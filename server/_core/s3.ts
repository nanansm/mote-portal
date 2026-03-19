import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./env";

export const s3Client = new S3Client({
  region: ENV.awsRegion,
  credentials: {
    accessKeyId: ENV.awsAccessKeyId,
    secretAccessKey: ENV.awsSecretAccessKey,
  },
});

export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: ENV.awsBucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return `https://${ENV.awsBucketName}.s3.${ENV.awsRegion}.amazonaws.com/${key}`;
}

export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: ENV.awsBucketName,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}
