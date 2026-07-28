import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { ENV } from "./_core/env";

const s3Client = new S3Client({
  region: "auto",
  endpoint: ENV.builtInForgeApiUrl ? `${ENV.builtInForgeApiUrl}/storage` : undefined,
  credentials: ENV.builtInForgeApiKey
    ? {
        accessKeyId: "storage",
        secretAccessKey: ENV.builtInForgeApiKey,
      }
    : undefined,
});

const BUCKET_NAME = process.env.S3_BUCKET || "manus-storage";

export async function storagePut(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string
): Promise<{ key: string; url: string }> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return {
    key,
    url: `/manus-storage/${key}`,
  };
}
