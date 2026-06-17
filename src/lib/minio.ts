import * as Minio from 'minio';

const globalForMinio = globalThis as unknown as {
  minio: Minio.Client | undefined;
};

export const minio =
  globalForMinio.minio ??
  new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
    port: parseInt(process.env.MINIO_PORT ?? '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY ?? '',
    secretKey: process.env.MINIO_SECRET_KEY ?? '',
  });

if (process.env.NODE_ENV !== 'production') globalForMinio.minio = minio;

export const BUCKET_NAME = process.env.MINIO_BUCKET ?? 'lab-reports';

export async function ensureBucket() {
  const exists = await minio.bucketExists(BUCKET_NAME);
  if (!exists) {
    await minio.makeBucket(BUCKET_NAME);
  }
}

/**
 * Upload a file buffer to MinIO and return the object key.
 */
export async function uploadImage(
  buffer: Buffer,
  originalFilename: string,
  submissionId: string,
  questionId: string,
): Promise<string> {
  await ensureBucket();
  const ext = originalFilename.split('.').pop() ?? 'jpg';
  const key = `submissions/${submissionId}/${questionId}.${ext}`;
  await minio.putObject(BUCKET_NAME, key, buffer, buffer.length, {
    'Content-Type': `image/${ext === 'jpg' ? 'jpeg' : ext}`,
  });
  return key;
}

/**
 * Generate a presigned URL valid for 1 hour.
 * Replaces the internal Docker hostname with the public-facing endpoint
 * so browsers can actually load the image.
 */
export async function getPresignedUrl(key: string): Promise<string> {
  const url = await minio.presignedGetObject(BUCKET_NAME, key, 60 * 60);
  const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT;
  if (publicEndpoint) {
    const internalHost = `${process.env.MINIO_ENDPOINT ?? 'minio'}:${process.env.MINIO_PORT ?? '9000'}`;
    return url.replace(internalHost, publicEndpoint);
  }
  return url;
}

/**
 * Delete an object from MinIO.
 */
export async function deleteImage(key: string): Promise<void> {
  await minio.removeObject(BUCKET_NAME, key);
}
