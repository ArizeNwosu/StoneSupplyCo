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
  snapshotAccountId?: string;
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

  const parsedFile = await findNewestParsableExport(accessToken, files);
  if (!parsedFile) {
    return {
      userId,
      status: 'error',
      error: 'Found Drive files, but none contained Instagram follower export data',
    };
  }

  const { parsed } = parsedFile;

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

  const snapshotAccountId = await upsertOwnedAccountSnapshot({
    userId,
    followerCount: parsed.followers.length,
    followingCount: parsed.following.length || null,
  });

  return {
    userId,
    status: 'synced',
    followerCount: parsed.followers.length,
    lostFollowers,
    newFollowers: newFollowersCount,
    snapshotAccountId,
  };
}

async function findNewestParsableExport(
  accessToken: string,
  files: Array<{ id: string; name: string; mimeType: string }>
): Promise<{ parsed: ExportData } | null> {
  for (const driveFile of files) {
    try {
      const buffer = await downloadDriveFile(accessToken, driveFile.id);
      const file = new File([new Uint8Array(buffer)], driveFile.name, {
        type: contentTypeForDriveFile(driveFile),
      });
      const parsed = await parseInstagramUpload(file);
      if (parsed.followers.length > 0) {
        return { parsed };
      }
    } catch {
      // Scheduled exports can contain folders, metadata, or unrelated files.
      // Keep scanning until a parsable followers export is found.
    }
  }

  return null;
}

function contentTypeForDriveFile(file: { name: string; mimeType: string }) {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.zip')) return 'application/zip';
  if (lower.endsWith('.json')) return 'application/json';
  return file.mimeType || 'application/octet-stream';
}

async function upsertOwnedAccountSnapshot({
  userId,
  followerCount,
  followingCount,
}: {
  userId: string;
  followerCount: number;
  followingCount: number | null;
}): Promise<string | undefined> {
  const accounts = await prisma.trackedAccount.findMany({
    where: { userId },
    select: { id: true },
    take: 2,
  });

  if (accounts.length !== 1) return undefined;

  const account = accounts[0]!;
  const takenAt = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');

  await prisma.snapshot.upsert({
    where: {
      trackedAccountId_takenAt: {
        trackedAccountId: account.id,
        takenAt,
      },
    },
    create: {
      trackedAccountId: account.id,
      followerCount,
      followingCount: followingCount ?? undefined,
      takenAt,
    },
    update: {
      followerCount,
      followingCount: followingCount ?? undefined,
    },
  });

  const snapshotCount = await prisma.snapshot.count({
    where: { trackedAccountId: account.id },
  });

  await prisma.trackedAccount.update({
    where: { id: account.id },
    data: {
      snapshotCount,
      lastChecked: new Date(),
    },
  });

  return account.id;
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
