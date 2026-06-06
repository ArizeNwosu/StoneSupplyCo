import { prisma } from '@/lib/prisma';
import {
  getValidGoogleToken,
  findInstagramExportsInDrive,
  downloadDriveFile,
} from '@/lib/google-drive';
import { parseInstagramUpload, diffExports, type ExportData } from '@/lib/export-parser';

const INSERT_CHUNK = 1000;

async function chunkInsert<T>(rows: T[], insert: (rows: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
    await insert(rows.slice(i, i + INSERT_CHUNK));
  }
}

export interface DriveSyncResult {
  userId: string;
  status: 'synced' | 'no_new_files' | 'error';
  error?: string;
  followerCount?: number;
  lostFollowers?: number;
  newFollowers?: number;
}

export async function syncUserDrive(userId: string): Promise<DriveSyncResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      googleDriveConnected: true,
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true,
      googleDriveLastSync: true,
    },
  });

  if (!user?.googleDriveConnected || !user.googleRefreshToken) {
    return { userId, status: 'error', error: 'Drive not connected' };
  }

  let accessToken: string;
  try {
    const tokenResult = await getValidGoogleToken(user);
    accessToken = tokenResult.accessToken;

    if (tokenResult.newAccessToken) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          googleAccessToken: tokenResult.newAccessToken,
          googleTokenExpiry: tokenResult.newExpiry,
        },
      });
    }
  } catch {
    await prisma.user.update({
      where: { id: userId },
      data: { googleDriveConnected: false },
    });
    return { userId, status: 'error', error: 'Token refresh failed — Drive disconnected' };
  }

  const files = await findInstagramExportsInDrive(accessToken, user.googleDriveLastSync);
  if (files.length === 0) {
    return { userId, status: 'no_new_files' };
  }

  // Process only the newest file
  const newest = files[0]!;
  const buffer = await downloadDriveFile(accessToken, newest.id);
  const file = new File([new Uint8Array(buffer)], newest.name, { type: 'application/json' });
  const parsed = await parseInstagramUpload(file);

  if (parsed.followers.length === 0) {
    return { userId, status: 'error', error: 'No followers found in Drive file' };
  }

  const previousExport = await prisma.dataExport.findFirst({
    where: { userId },
    orderBy: { uploadedAt: 'desc' },
    include: { followers: { select: { handle: true, displayName: true } } },
  });

  const newExport = await prisma.dataExport.create({
    data: {
      userId,
      source: 'GOOGLE_DRIVE',
      followerCount: parsed.followers.length,
      followingCount: parsed.following.length || null,
    },
  });

  await chunkInsert(
    parsed.followers.map((f) => ({
      dataExportId: newExport.id,
      handle: f.handle,
      displayName: f.displayName,
      followedAt: f.followedAt,
    })),
    (data) => prisma.exportFollower.createMany({ data })
  );

  await chunkInsert(
    parsed.following.map((f) => ({
      dataExportId: newExport.id,
      handle: f.handle,
      displayName: f.displayName,
      followedAt: f.followedAt,
    })),
    (data) => prisma.exportFollowing.createMany({ data })
  );

  let lostFollowers = 0;
  let newFollowersCount = 0;

  if (previousExport) {
    const prevData: ExportData = {
      followers: previousExport.followers.map((f) => ({
        handle: f.handle,
        displayName: f.displayName ?? undefined,
      })),
      following: [],
    };
    const diff = diffExports(prevData, parsed);
    lostFollowers = diff.lostFollowers.length;
    newFollowersCount = diff.newFollowers.length;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { googleDriveLastSync: new Date() },
  });

  return {
    userId,
    status: 'synced',
    followerCount: parsed.followers.length,
    lostFollowers,
    newFollowers: newFollowersCount,
  };
}

export async function syncAllDriveUsers(): Promise<DriveSyncResult[]> {
  const users = await prisma.user.findMany({
    where: { googleDriveConnected: true, googleRefreshToken: { not: null } },
    select: { id: true },
  });

  const results: DriveSyncResult[] = [];
  for (const { id } of users) {
    try {
      const result = await syncUserDrive(id);
      results.push(result);
    } catch (err) {
      results.push({ userId: id, status: 'error', error: String(err) });
    }
  }
  return results;
}
