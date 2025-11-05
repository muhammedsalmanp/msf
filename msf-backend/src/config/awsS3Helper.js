
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { Readable } from 'stream';
import dotenv from 'dotenv';

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const bucketName = process.env.AWS_BUCKET_NAME;

// Upload file to S3 and return the URL and key
export async function uploadFileToS3(folderPath, file) {
  const uniqueName = crypto.randomBytes(16).toString('hex');
  const extension = file.mimetype.split('/')[1];
  const fileName = `${folderPath}${uniqueName}.${extension}`;

  const stream = Readable.from(file.buffer);

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucketName,
      Key: fileName,
      Body: stream,
      ContentType: file.mimetype,
      ACL: 'private',  // File access set to private (no direct download)
    },
  });

  await upload.done();

  // Generate signed URL for the file to be accessible temporarily
  const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand({
    Bucket: bucketName,
    Key: fileName,
  }), { expiresIn: 3600 });  // URL expires in 1 hour

  return {
    key: fileName,
    url: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`, // Public URL
    signedUrl,  // URL for authorized download
  };
}

// Delete file from S3 using the key
export async function deleteFileFromS3(key) {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
}
