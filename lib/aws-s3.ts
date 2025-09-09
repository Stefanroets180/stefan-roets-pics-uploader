import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: async () => ({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    }),
    // Disable all automatic credential loading
    maxAttempts: 3,
    retryMode: "standard",
})

export interface UploadResult {
    success: boolean
    url?: string
    key?: string
    error?: string
}

export async function uploadToS3(
    file: Buffer,
    fileName: string,
    contentType = "image/avif",
    metadata?: { [key: string]: string },
): Promise<UploadResult> {
    try {
        const key = `photos/${Date.now()}-${fileName}`

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME!,
            Key: key,
            Body: file,
            ContentType: contentType,
            Metadata: metadata || {},
        })

        await s3Client.send(command)

        const url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`

        return {
            success: true,
            url,
            key,
        }
    } catch (error) {
        console.error("S3 upload error:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Upload failed",
        }
    }
}

export async function deleteFromS3(key: string): Promise<boolean> {
    try {
        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME!,
            Key: key,
        })

        await s3Client.send(command)
        return true
    } catch (error) {
        console.error("S3 delete error:", error)
        return false
    }
}
