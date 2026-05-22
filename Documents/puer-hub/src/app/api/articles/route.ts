import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkUserCanPost } from "@/lib/check-mute";
import { prisma } from "@/lib/prisma";
import { grantExp } from "@/lib/exp";
import { z } from "zod";

const articleSchema = z.object({
  type: z.enum(["article", "tasting", "discussion"]),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  summary: z.string().max(500).optional(),
  teaId: z.string().optional(),
  tastingScores: z.record(z.string(), z.number()).optional(),
  brewMethod: z.string().optional(),
  waterTemp: z.number().optional(),
  teaWeight: z.string().optional(),
  steepCount: z.number().optional(),
  tags: z.array(z.string()).default([]),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: Record<string, unknown> = { status: "published" };
  if (type) where.type = type;

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      select: {
        id: true,
        type: true,
        title: true,
        summary: true,
        createdAt: true,
        replyCount: true,
        upvotes: true,
        downvotes: true,
        viewCount: true,
        isPinned: true,
        lastRepliedAt: true,
        author: { select: { id: true, username: true, avatar: true, level: true } },
        tea: { select: { id: true, name: true, brand: true, year: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.article.count({ where }),
  ]);

  return NextResponse.json({ articles, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { canPost, reason } = await checkUserCanPost(session.user.id);
  if (!canPost) {
    return NextResponse.json({ error: reason }, { status: 403 });
  }

  const body = await req.json();
  const data = articleSchema.parse(body);

  const article = await prisma.article.create({
    data: {
      ...data,
      authorId: session.user.id,
    },
  });

  const expType = data.type === "tasting" ? "post_tasting" : "post_article";
  await grantExp(session.user.id, expType, article.id);

  return NextResponse.json(article, { status: 201 });
}
