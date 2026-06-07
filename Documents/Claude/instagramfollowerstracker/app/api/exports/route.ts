import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLAN_LIMITS } from '@/lib/limits';
import { parseMultipleInstagramFiles, diffExports, type ExportData } from '@/lib/export-parser';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50 MB across all files
const INSERT_CHUNK_SIZE = 1000;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const exports = await prisma.dataExport.findMany({
    where: { userId: session.user.id },
    orderBy: { uploadedAt: 'desc' },
    take: 25,
    select: {
      id: true,
      uploadedAt: true,
      followerCount: true,
      followingCount: true,
    },
  });

  return NextResponse.json(exports);
}

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

  const isPro = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS].unfollowDetection;
  const maxUnfollowAccounts = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS].maxUnfollowAccounts;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  // Read and validate handle
  const rawHandle = formData.get('handle');
  const handle: string | null =
    typeof rawHandle === 'string' && rawHandle.trim().length > 0
      ? rawHandle.trim().toLowerCase()
      : null;

  if (handle !== null && !/^[a-z0-9._]{1,30}$/.test(handle)) {
    return NextResponse.json({ error: 'Invalid Instagram handle.' }, { status: 400 });
  }

  // Enforce plan limit for distinct unfollow accounts
  if (maxUnfollowAccounts !== null && handle) {
    const existingHandles = await prisma.dataExport.findMany({
      where: { userId: user.id, handle: { not: null } },
      select: { handle: true },
      distinct: ['handle'],
    });
    const isNewHandle = !existingHandles.some((e) => e.handle === handle);
    if (isNewHandle && existingHandles.length >= maxUnfollowAccounts) {
      return NextResponse.json(
        {
          error: `Plan limit: you can track up to ${maxUnfollowAccounts} Instagram account${maxUnfollowAccounts === 1 ? '' : 's'}. Upgrade to add more.`,
          upgrade: '/pricing',
        },
        { status: 402 }
      );
    }
  }

  const fileEntries = formData.getAll('file');
  const files = fileEntries.filter((e): e is File => typeof e !== 'string' && e.size > 0);

  if (files.length === 0) {
    return NextResponse.json({ error: 'No files received' }, { status: 400 });
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > MAX_TOTAL_BYTES) {
    return NextResponse.json(
      { error: 'Files too large (50 MB total max). Extract the ZIP and upload the 3 HTML files directly.' },
      { status: 413 }
    );
  }

  let parsed: ExportData;
  let recentlyUnfollowed: { handle: string }[];
  try {
    const result = await parseMultipleInstagramFiles(files);
    parsed = result.data;
    recentlyUnfollowed = result.recentlyUnfollowed;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to parse export file' },
      { status: 400 }
    );
  }

  if (parsed.followers.length === 0 && parsed.following.length === 0) {
    return NextResponse.json(
      { error: 'No followers or following data found. Make sure you uploaded followers_1.html and/or following.html.' },
      { status: 400 }
    );
  }

  // Get the previous export to diff against (scoped to same handle if provided)
  const previousExport = await prisma.dataExport.findFirst({
    where: handle ? { userId: user.id, handle } : { userId: user.id },
    orderBy: { uploadedAt: 'desc' },
    include: { followers: { select: { handle: true, displayName: true } } },
  });

  // Store new export
  const newExport = await prisma.dataExport.create({
    data: {
      userId: user.id,
      handle: handle ?? null,
      followerCount: parsed.followers.length || null,
      followingCount: parsed.following.length || null,
    },
    select: { id: true, followerCount: true, followingCount: true, uploadedAt: true },
  });

  await createRowsInChunks(
    parsed.followers.map((f) => ({
      dataExportId: newExport.id,
      handle: f.handle,
      displayName: f.displayName,
      followedAt: f.followedAt,
    })),
    (data) => prisma.exportFollower.createMany({ data })
  );

  await createRowsInChunks(
    parsed.following.map((f) => ({
      dataExportId: newExport.id,
      handle: f.handle,
      displayName: f.displayName,
      followedAt: f.followedAt,
    })),
    (data) => prisma.exportFollowing.createMany({ data })
  );

  // Compute diff if previous export exists — names only returned for Pro users
  let diff: {
    newFollowers: { handle: string; displayName?: string }[];
    lostFollowers: { handle: string; displayName?: string }[];
    newCount: number;
    lostCount: number;
  } | null = null;

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
      newCount: result.newFollowers.length,
      lostCount: result.lostFollowers.length,
      newFollowers: isPro ? result.newFollowers.map((f) => ({ handle: f.handle, displayName: f.displayName })) : [],
      lostFollowers: isPro ? result.lostFollowers.map((f) => ({ handle: f.handle, displayName: f.displayName })) : [],
    };
  }

  return NextResponse.json({
    uploadId: newExport.id,
    followerCount: newExport.followerCount,
    followingCount: newExport.followingCount,
    uploadedAt: newExport.uploadedAt,
    diff,
    // Returned but not persisted — supplementary data from recently_unfollowed_profiles.html
    recentlyUnfollowed: isPro ? recentlyUnfollowed : [],
    recentlyUnfollowedCount: recentlyUnfollowed.length,
  });
}

async function createRowsInChunks<T>(
  rows: T[],
  insert: (rows: T[]) => Promise<unknown>
) {
  for (let index = 0; index < rows.length; index += INSERT_CHUNK_SIZE) {
    await insert(rows.slice(index, index + INSERT_CHUNK_SIZE));
  }
}
