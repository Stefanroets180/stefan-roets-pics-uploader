import { NextResponse } from "next/server"
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"

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

export async function GET() {
    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.AWS_S3_BUCKET_NAME!,
            Prefix: "photos/", // Only list photos in the photos/ folder
        })

        const response = await s3Client.send(command)

        const photos = (response.Contents || [])
            .filter((object) => object.Key && object.Size && object.Size > 0) // Filter out empty objects
            .map((object) => ({
                id: object.Key!.split("/").pop()!.split(".")[0], // Extract filename without extension
                url: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${object.Key}`,
                name: object.Key!.split("/").pop()!,
                key: object.Key!,
                lastModified: object.LastModified?.toISOString(),
            }))
            .sort((a, b) => new Date(b.lastModified!).getTime() - new Date(a.lastModified!).getTime()) // Sort by newest first

        return NextResponse.json({ photos })
    } catch (error) {
        console.error("Error listing photos from S3:", error)
        return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 })
    }
}
