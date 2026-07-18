import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
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
      // Convert to WebP for better compression (60-80% smaller than JPEG)
      finalBuffer = await sharp(fileBuffer)
        .resize({ width: 1200, withoutEnlargement: true }) // Max width 1200px
        .webp({ quality: 80, effort: 4 })
        .toBuffer()
      finalContentType = "image/webp"
    } catch (error) {
      console.warn("Image compression failed, uploading original. Error:", error)
    }
  }

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: finalBuffer,
      ContentType: finalContentType,
      // Ensure public read access (adjust ACL based on bucket policy)
      ACL: "public-read",
    })

    await r2.send(command)
    
    // Construct public URL
    const r2PublicUrl = process.env.R2_PUBLIC_URL
    const publicUrl = r2PublicUrl 
      ? `${r2PublicUrl}/${key}`
      : `https://${bucketName}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`
    
    console.log(`[R2] Successfully uploaded ${key} to ${bucketName}`)
    return publicUrl
  } catch (error) {
    console.error(`[R2] Upload failed for ${key}:`, error)
    throw new Error(`Failed to upload file to R2: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function deleteFromR2(bucketName: string, key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })

    await r2.send(command)
    console.log(`[R2] Successfully deleted ${key} from ${bucketName}`)
  } catch (error) {
    console.error(`[R2] Delete failed for ${key}:`, error)
    throw new Error(`Failed to delete file from R2: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
