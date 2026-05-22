import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { grantExp } from "@/lib/exp";
import { notifyCommentReply } from "@/lib/notifications";
import { checkUserCanPost } from "@/lib/check-mute";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { canPost, reason } = await checkUserCanPost(session.user.id);
  if (!canPost) {
    return NextResponse.json({ error: reason }, { status: 403 });
  }

  const { articleId, tastingNoteId, content, parentId, images } = await req.json();
  if ((!articleId && !tastingNoteId) || !content?.trim()) {
    return NextResponse.json({ error: "参数不完整" }, { status: 400 });
  }

  if (content.trim().length < 5) {
    return NextResponse.json({ error: "评论至少5个字" }, { status: 400 });
  }

  const now = new Date();
  const comment = await prisma.comment.create({
    data: {
      ...(articleId ? { articleId } : {}),
      ...(tastingNoteId ? { tastingNoteId } : {}),
      content: content.trim(),
      images: images || [],
      parentId: parentId || null,
      authorId: session.user.id,
    },
    include: {
      author: { select: { id: true, username: true, avatar: true, level: true } },
    },
  });

  if (articleId) {
    // Update article reply count and last reply time
    await prisma.article.update({
      where: { id: articleId },
      data: { replyCount: { increment: 1 }, lastRepliedAt: now },
    });

    // Fetch article metadata once (was 2 separate queries)
    const postArticle = await prisma.article.findUnique({
      where: { id: articleId },
      select: { boardId: true, authorId: true },
    });
    if (postArticle?.boardId) {
      await prisma.board.update({
        where: { id: postArticle.boardId },
        data: { postCount: { increment: 1 }, lastPostedAt: now },
      });
    }

    // Send notification (fire-and-forget)
    if (postArticle?.authorId) {
      notifyCommentReply(postArticle.authorId, session.user.id, articleId, parentId || undefined).catch(() => {});
    }
  }

  await grantExp(session.user.id, "comment", comment.id);

  return NextResponse.json(comment, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const articleId = searchParams.get("articleId");
  const tastingNoteId = searchParams.get("tastingNoteId");
  if (!articleId && !tastingNoteId) {
    return NextResponse.json({ error: "缺少 articleId 或 tastingNoteId" }, { status: 400 });
  }

  const session = await auth();

  const comments = await prisma.comment.findMany({
    where: articleId ? { articleId } : { tastingNoteId },
    select: {
      id: true,
      content: true,
      images: true,
      createdAt: true,
      parentId: true,
      upvotes: true,
      downvotes: true,
      author: { select: { id: true, username: true, avatar: true, level: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Attach user's vote state
  let voteMap = new Map<string, number>();
  if (session?.user?.id && comments.length > 0) {
    const votes = await prisma.vote.findMany({
      where: {
        userId: session.user.id,
        refId: { in: comments.map((c) => c.id) },
      },
      select: { refId: true, value: true },
    });
    votes.forEach((v) => voteMap.set(v.refId, v.value));
  }

  const enriched = comments.map((c) => ({
    ...c,
    initialVote: voteMap.get(c.id) || 0,
  }));

  return NextResponse.json(enriched);
}
