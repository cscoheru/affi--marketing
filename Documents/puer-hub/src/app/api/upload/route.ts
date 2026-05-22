import { auth } from "@/lib/auth";
import { mkdir, writeFile, readdir, rm, rename, stat } from "fs/promises";
import { existsSync, createWriteStream, createReadStream } from "fs";
import path from "path";
import crypto from "crypto";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const VIDEO_MAX_SIZE = 100 * 1024 * 1024;
const CHUNK_DIR = path.join(process.cwd(), "public", "uploads", ".tmp");

// GET /api/upload?uploadId=xxx — check which chunks exist (for resume)
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const uploadId = searchParams.get("uploadId");
  if (!uploadId) {
    return Response.json({ error: "Missing uploadId" }, { status: 400 });
  }
  const dir = path.join(CHUNK_DIR, uploadId);
  if (!existsSync(dir)) {
    return Response.json({ chunks: [] });
  }
  const entries = await readdir(dir, { withFileTypes: true });
  const chunks = entries
    .filter((e) => e.isFile() && /^\d+$/.test(e.name))
    .map((e) => parseInt(e.name, 10))
    .sort((a, b) => a - b);
  return Response.json({ chunks });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const uploadId = req.headers.get("X-Upload-Id");
  const isComplete = req.headers.get("X-Upload-Complete") === "true";
  const fileType = req.headers.get("X-File-Type") || "";

  // ── Complete: assemble chunks into final file ──────────
  if (isComplete) {
    if (!uploadId) {
      return Response.json({ error: "Missing uploadId" }, { status: 400 });
    }
    const chunkDir = path.join(CHUNK_DIR, uploadId);
    if (!existsSync(chunkDir)) {
      return Response.json({ error: "No chunks found" }, { status: 400 });
    }
    const entries = await readdir(chunkDir);
    const chunkIndices = entries
      .filter((n) => /^\d+$/.test(n))
      .map(Number)
      .sort((a, b) => a - b);

    if (chunkIndices.length === 0) {
      return Response.json({ error: "No chunks uploaded" }, { status: 400 });
    }

    const isVideo = VIDEO_TYPES.includes(fileType);
    const isImage = IMAGE_TYPES.includes(fileType);
    if (!isVideo && !isImage) {
      return Response.json({ error: "不支持的文件类型" }, { status: 400 });
    }

    const category = req.headers.get("X-Category") || "";
    let subDir = isVideo ? "videos" : "forum";
    if (category === "session") subDir = "sessions";
    else if (category === "avatar") subDir = "avatars";

    const ext = isVideo ? "mp4" : (fileType.split("/")[1]?.replace("jpeg", "jpg") || "jpg");
    const filename = `${crypto.randomUUID()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", subDir);
    await mkdir(uploadDir, { recursive: true });
    const filepath = path.join(uploadDir, filename);

    // Assemble chunks in order
    const writeStream = createWriteStream(filepath);
    for (const idx of chunkIndices) {
      const chunkPath = path.join(chunkDir, String(idx));
      const readStream = createReadStream(chunkPath);
      await pipeline(readStream, writeStream, { end: false });
    }
    writeStream.end();
    await new Promise<void>((resolve, reject) => {
      writeStream.on("finish", () => resolve());
      writeStream.on("error", reject);
    });

    // Cleanup temp chunks
    await rm(chunkDir, { recursive: true, force: true });

    // Compress video after assembly
    if (isVideo) {
      await compressVideo(filepath).catch((err) => {
        console.warn("Video compression skipped:", err.message);
      });
    }

    return Response.json({ url: `/uploads/${subDir}/${filename}`, type: isVideo ? "video" : "image" });
  }

  // ── Chunk upload ──────────────────────────────────────
  const chunkIndex = parseInt(req.headers.get("X-Chunk-Index") || "", 10);
  const totalChunks = parseInt(req.headers.get("X-Total-Chunks") || "", 10);

  if (!uploadId || isNaN(chunkIndex) || isNaN(totalChunks) || !fileType) {
    // Fallback: single-shot upload (no chunk headers) for small files
    return handleSingleUpload(req);
  }

  const chunkDir = path.join(CHUNK_DIR, uploadId);
  try {
    await mkdir(chunkDir, { recursive: true });
  } catch {
    return Response.json({ error: "服务器临时目录不可写" }, { status: 500 });
  }

  const arrayBuffer = await req.arrayBuffer();
  const chunkPath = path.join(chunkDir, String(chunkIndex));
  await writeFile(chunkPath, Buffer.from(arrayBuffer));

  return Response.json({ ok: true, chunkIndex, totalChunks });
}

// Legacy single-shot upload (for small images etc.)
async function handleSingleUpload(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return Response.json({ error: "请选择文件" }, { status: 400 });
  }

  const isVideo = VIDEO_TYPES.includes(file.type);
  const isImage = IMAGE_TYPES.includes(file.type);
  if (!isVideo && !isImage) {
    return Response.json({ error: "只支持 JPG/PNG/GIF/WebP 图片或 MP4/WebM 视频" }, { status: 400 });
  }

  const maxSize = isVideo ? VIDEO_MAX_SIZE : IMAGE_MAX_SIZE;
  if (file.size > maxSize) {
    return Response.json({ error: `文件大小不能超过 ${maxSize / 1024 / 1024}MB` }, { status: 400 });
  }

  const category = formData.get("category") as string | null;
  let subDir = isVideo ? "videos" : "forum";
  if (category === "session") subDir = "sessions";
  else if (category === "avatar") subDir = "avatars";

  const ext = isVideo ? "mp4" : (file.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg");
  const filename = `${crypto.randomUUID()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", subDir);
  await mkdir(uploadDir, { recursive: true });
  const filepath = path.join(uploadDir, filename);

  const nodeStream = Readable.fromWeb(file.stream() as import("stream/web").ReadableStream);
  const writeStream = createWriteStream(filepath);
  await pipeline(nodeStream, writeStream);

  return Response.json({ url: `/uploads/${subDir}/${filename}`, type: isVideo ? "video" : "image" });
}

/** Compress video with ffmpeg: H.264, CRF 32, max 720p, aim for small files */
async function compressVideo(filepath: string): Promise<void> {
  const tmpPath = filepath + ".tmp.mp4";
  try {
    await execFileAsync("ffprobe", [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height",
      "-of", "csv=p=0",
      filepath,
    ]);
  } catch {
    return;
  }

  try {
    await execFileAsync("ffmpeg", [
      "-i", filepath,
      "-c:v", "libx264",
      "-crf", "32",
      "-preset", "fast",
      "-vf", "scale=min(720\\,iw):min(720\\,ih):force_original_aspect_ratio=decrease",
      "-c:a", "aac",
      "-b:a", "64k",
      "-movflags", "+faststart",
      "-y", tmpPath,
    ], { timeout: 120_000 });

    const origSize = (await stat(filepath).catch(() => ({ size: 0 }))).size;
    const newSize = (await stat(tmpPath).catch(() => ({ size: 0 }))).size;

    // Only replace if compressed is actually smaller
    if (newSize > 0 && newSize < origSize) {
      await rm(filepath);
      await rename(tmpPath, filepath);
    } else {
      await rm(tmpPath).catch(() => {});
    }
  } catch {
    await rm(tmpPath).catch(() => {});
  }
}
