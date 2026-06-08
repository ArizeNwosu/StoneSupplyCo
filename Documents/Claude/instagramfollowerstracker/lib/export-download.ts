import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toCsv, type CsvRow } from '@/lib/csv';
import { diffExports, type ExportData } from '@/lib/export-parser';

export type ExportDownloadType = 'followers' | 'following' | 'diff';
export type ExportDownloadFormat = 'csv' | 'json';

export function parseDownloadType(raw: string | null): ExportDownloadType {
  if (raw === 'following' || raw === 'diff') return raw;
  return 'followers';
}

export function parseDownloadFormat(raw: string | null): ExportDownloadFormat {
  return raw === 'json' ? 'json' : 'csv';
}

export async function buildExportDownload({
  userId,
  exportId,
  type,
  format,
}: {
  userId: string;
  exportId: string;
  type: ExportDownloadType;
  format: ExportDownloadFormat;
}) {
  const dataExport = await prisma.dataExport.findFirst({
    where: { id: exportId, userId },
    include: {
      followers: { orderBy: { handle: 'asc' } },
      following: { orderBy: { handle: 'asc' } },
    },
  });

  if (!dataExport) {
    return NextResponse.json({ error: 'Export not found' }, { status: 404 });
  }

  const previousExport =
    type === 'diff'
      ? await prisma.dataExport.findFirst({
          where: {
            userId,
            uploadedAt: { lt: dataExport.uploadedAt },
          },
          orderBy: { uploadedAt: 'desc' },
          include: { followers: { orderBy: { handle: 'asc' } } },
        })
      : null;

  const payload = getPayload(dataExport, previousExport, type);
  const baseName = `instagram-${type}-${dataExport.uploadedAt.toISOString().slice(0, 10)}`;

  if (format === 'json') {
    return NextResponse.json(payload, {
      headers: {
        'Content-Disposition': `attachment; filename="${baseName}.json"`,
      },
    });
  }

  const csv = toCsv(payload.rows, payload.columns);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${baseName}.csv"`,
    },
  });
}

const PERSON_COLUMNS = ['username', 'display_name', 'profile_url', 'follow_date', 'follow_time'] as const;
const DIFF_COLUMNS = ['change', 'username', 'display_name', 'profile_url', 'follow_date', 'follow_time'] as const;

type PersonRow = Record<typeof PERSON_COLUMNS[number], string | null | undefined>;
type DiffRow = Record<typeof DIFF_COLUMNS[number], string | null | undefined>;

function followDate(d: Date | null | undefined): string | null {
  if (!d || d.getTime() === 0) return null;
  return d.toISOString().slice(0, 10);
}

function followTime(d: Date | null | undefined): string | null {
  if (!d || d.getTime() === 0) return null;
  return d.toISOString().slice(11, 19);
}

function personRow(person: {
  handle: string;
  displayName: string | null;
  followedAt: Date | null;
}): PersonRow {
  return {
    username: person.handle,
    display_name: person.displayName,
    profile_url: `https://www.instagram.com/${person.handle}/`,
    follow_date: followDate(person.followedAt),
    follow_time: followTime(person.followedAt),
  };
}

function diffRow(
  change: 'unfollowed_you' | 'new_follower',
  person: { handle: string; displayName?: string; followedAt?: Date }
): DiffRow {
  return {
    change,
    username: person.handle,
    display_name: person.displayName ?? null,
    profile_url: `https://www.instagram.com/${person.handle}/`,
    follow_date: followDate(person.followedAt),
    follow_time: followTime(person.followedAt),
  };
}

function getPayload(
  dataExport: {
    uploadedAt: Date;
    followers: Array<{ handle: string; displayName: string | null; followedAt: Date | null }>;
    following: Array<{ handle: string; displayName: string | null; followedAt: Date | null }>;
  },
  previousExport: {
    uploadedAt: Date;
    followers: Array<{ handle: string; displayName: string | null; followedAt: Date | null }>;
  } | null,
  type: ExportDownloadType
): { columns: string[]; rows: CsvRow[]; meta: Record<string, unknown> } {
  if (type === 'following') {
    return {
      columns: [...PERSON_COLUMNS],
      rows: dataExport.following.map(personRow),
      meta: { type, uploadedAt: dataExport.uploadedAt },
    };
  }

  if (type === 'diff') {
    if (!previousExport) {
      return {
        columns: [...DIFF_COLUMNS],
        rows: [],
        meta: { type, uploadedAt: dataExport.uploadedAt, previousUploadedAt: null },
      };
    }

    const previous: ExportData = {
      followers: previousExport.followers.map((p) => ({
        handle: p.handle,
        displayName: p.displayName ?? undefined,
        followedAt: p.followedAt ?? undefined,
      })),
      following: [],
    };
    const current: ExportData = {
      followers: dataExport.followers.map((p) => ({
        handle: p.handle,
        displayName: p.displayName ?? undefined,
        followedAt: p.followedAt ?? undefined,
      })),
      following: [],
    };
    const diff = diffExports(previous, current);

    return {
      columns: [...DIFF_COLUMNS],
      rows: [
        ...diff.lostFollowers.map((p) => diffRow('unfollowed_you', p)),
        ...diff.newFollowers.map((p) => diffRow('new_follower', p)),
      ],
      meta: {
        type,
        uploadedAt: dataExport.uploadedAt,
        previousUploadedAt: previousExport.uploadedAt,
      },
    };
  }

  // followers
  return {
    columns: [...PERSON_COLUMNS],
    rows: dataExport.followers.map(personRow),
    meta: { type, uploadedAt: dataExport.uploadedAt },
  };
}
