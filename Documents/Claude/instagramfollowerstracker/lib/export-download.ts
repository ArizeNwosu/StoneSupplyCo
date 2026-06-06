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
      columns: ['handle', 'displayName', 'followedAt'],
      rows: dataExport.following.map(personRow),
      meta: { type, uploadedAt: dataExport.uploadedAt },
    };
  }

  if (type === 'diff') {
    if (!previousExport) {
      return {
        columns: ['changeType', 'handle', 'displayName'],
        rows: [],
        meta: {
          type,
          uploadedAt: dataExport.uploadedAt,
          previousUploadedAt: null,
        },
      };
    }

    const previous: ExportData = {
      followers: previousExport.followers.map((person) => ({
        handle: person.handle,
        displayName: person.displayName ?? undefined,
        followedAt: person.followedAt ?? undefined,
      })),
      following: [],
    };
    const current: ExportData = {
      followers: dataExport.followers.map((person) => ({
        handle: person.handle,
        displayName: person.displayName ?? undefined,
        followedAt: person.followedAt ?? undefined,
      })),
      following: [],
    };
    const diff = diffExports(previous, current);

    return {
      columns: ['changeType', 'handle', 'displayName'],
      rows: [
        ...diff.lostFollowers.map((person) => ({
          changeType: 'lost',
          handle: person.handle,
          displayName: person.displayName,
        })),
        ...diff.newFollowers.map((person) => ({
          changeType: 'new',
          handle: person.handle,
          displayName: person.displayName,
        })),
      ],
      meta: {
        type,
        uploadedAt: dataExport.uploadedAt,
        previousUploadedAt: previousExport.uploadedAt,
      },
    };
  }

  return {
    columns: ['handle', 'displayName', 'followedAt'],
    rows: dataExport.followers.map(personRow),
    meta: { type, uploadedAt: dataExport.uploadedAt },
  };
}

function personRow(person: {
  handle: string;
  displayName: string | null;
  followedAt: Date | null;
}): CsvRow {
  return {
    handle: person.handle,
    displayName: person.displayName,
    followedAt: person.followedAt,
  };
}
