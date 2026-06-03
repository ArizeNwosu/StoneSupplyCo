import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLAN_LIMITS } from '@/lib/limits';
import { parseInstagramExport, diffExports, type ExportData } from '@/lib/export-parser';

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, plan: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (!PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS].unfollowDetection) {
    return NextResponse.json(
      { error: 'Unfollow detection requires Pro plan', upgrade: '/pricing' },
      { status: 402 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const fileEntry = formData.get('file');
  if (!fileEntry || typeof fileEntry === 'string') {
    return NextResponse.json({ error: 'Missing file field' }, { status: 400 });
  }

  const file = fileEntry as File;
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'File too large (max 50 MB)' }, { status: 413 });
  }

  const text = await file.text();

  let parsed: ExportData;
  try {
    parsed = parseInstagramExport(text);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to parse export file' },
      { status: 400 }
    );
  }

  if (parsed.followers.length === 0) {
    return NextResponse.json(
      { error: 'No followers found in this file. Make sure you uploaded followers_1.json from your Instagram data export.' },
      { status: 400 }
    );
  }

  // Get the previous export to diff against
  const previousExport = await prisma.dataExport.findFirst({
    where: { userId: user.id },
    orderBy: { uploadedAt: 'desc' },
    include: { followers: { select: { handle: true, displayName: true } } },
  });

  // Store new export
  const newExport = await prisma.dataExport.create({
    data: {
      userId: user.id,
      followerCount: parsed.followers.length,
      followingCount: parsed.following.length || null,
      followers: {
        create: parsed.followers.map((f) => ({
          handle: f.handle,
          displayName: f.displayName,
          followedAt: f.followedAt,
        })),
      },
    },
    select: { id: true, followerCount: true, uploadedAt: true },
  });

  // Compute diff if previous export exists
  let diff: { newFollowers: { handle: string; displayName?: string }[]; lostFollowers: { handle: string; displayName?: string }[] } | null = null;

  if (previousExport) {
    const prevData: ExportData = {
      followers: previousExport.followers.map((f) => ({
        handle: f.handle,
        displayName: f.displayName ?? undefined,
      })),
      following: [],
    };
    const result = diffExports(prevData, parsed);
    diff = {
      newFollowers: result.newFollowers.map((f) => ({ handle: f.handle, displayName: f.displayName })),
      lostFollowers: result.lostFollowers.map((f) => ({ handle: f.handle, displayName: f.displayName })),
    };
  }

  return NextResponse.json({
    uploadId: newExport.id,
    followerCount: newExport.followerCount,
    uploadedAt: newExport.uploadedAt,
    diff,
  });
}
