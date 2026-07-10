import { S3Client } from "@aws-sdk/client-s3"
import sharp from "sharp"

// Initialize R2 client
export const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
})

export async function uploadToR2(
  bucketName: string,
  key: string,
  fileBuffer: Buffer,
  contentType: string,
  compress: boolean = true
): Promise<string> {
  let finalBuffer = fileBuffer
  let finalContentType = contentType

  if (compress && contentType.startsWith("image/")) {
    try {
      finalBuffer = await sharp(fileBuffer)
        .resize({ width: 1200, withoutEnlargement: true }) // Max width 1200px
        .jpeg({ quality: 80 })
        .toBuffer()
      finalContentType = "image/jpeg"
    } catch (error) {
      console.warn("Image compression failed, uploading original. Error:", error)
    }
  }

  // TODO: Implement S3Client.send(new PutObjectCommand(...))
  // For now, return a dummy URL
  console.log(`[R2] Uploading ${key} to ${bucketName} with content type ${finalContentType}`)
  return `https://your-r2-domain.com/${bucketName}/${key}`
}

export async function deleteFromR2(bucketName: string, key: string): Promise<void> {
  // TODO: Implement S3Client.send(new DeleteObjectCommand(...))
  console.log(`[R2] Deleting ${key} from ${bucketName}`)
}
