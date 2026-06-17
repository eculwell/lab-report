import { NextRequest, NextResponse } from 'next/server';
import { minio, BUCKET_NAME } from '@/lib/minio';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  try {
    const { key } = await params;
    const objectKey = key.join('/');

    const [stream, stat] = await Promise.all([
      minio.getObject(BUCKET_NAME, objectKey),
      minio.statObject(BUCKET_NAME, objectKey),
    ]);

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    const contentType =
      (stat.metaData?.['content-type'] as string | undefined) ?? 'image/jpeg';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }
}
