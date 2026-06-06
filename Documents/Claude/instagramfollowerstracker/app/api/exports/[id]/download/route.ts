import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  buildExportDownload,
  parseDownloadFormat,
  parseDownloadType,
} from '@/lib/export-download';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const type = parseDownloadType(req.nextUrl.searchParams.get('type'));
  const format = parseDownloadFormat(req.nextUrl.searchParams.get('format'));

  return buildExportDownload({
    userId: session.user.id,
    exportId: id,
    type,
    format,
  });
}
