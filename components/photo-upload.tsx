"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, X, ImageIcon, CheckCircle, AlertCircle } from "lucide-react"
import { convertToAvif, validateImageFile } from "@/lib/image-converter"
import { cn } from "@/lib/utils"

interface UploadedPhoto {
    id: string
    url: string
    key: string
    name: string
    label?: string
}

interface PhotoUploadProps {
    onUploadComplete?: (photos: UploadedPhoto[]) => void
    maxFiles?: number
    className?: string
}

export function PhotoUpload({ onUploadComplete, maxFiles = 10, className }: PhotoUploadProps) {
    const [isDragOver, setIsDragOver] = useState(false)
    const [uploadQueue, setUploadQueue] = useState<File[]>([])
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([])
    const [errors, setErrors] = useState<string[]>([])
    const [photoLabels, setPhotoLabels] = useState<{ [key: string]: string }>({})
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)

        const files = Array.from(e.dataTransfer.files)
        handleFiles(files)
    }, [])

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        handleFiles(files)
    }, [])

    const handleFiles = useCallback(
        (files: File[]) => {
            const validFiles: File[] = []
            const newErrors: string[] = []

            files.forEach((file) => {
                if (validateImageFile(file)) {
                    validFiles.push(file)
                    setPhotoLabels((prev) => ({ ...prev, [file.name]: "" }))
                } else {
                    newErrors.push(`${file.name}: Invalid file type or size too large (max 10MB)`)
                }
            })

            if (validFiles.length + uploadQueue.length > maxFiles) {
                newErrors.push(`Maximum ${maxFiles} files allowed`)
                return
            }

            setErrors(newErrors)
            setUploadQueue((prev) => [...prev, ...validFiles])
        },
        [uploadQueue.length, maxFiles],
    )

    const removeFromQueue = useCallback((index: number) => {
        setUploadQueue((prev) => {
            const fileToRemove = prev[index]
            setPhotoLabels((prevLabels) => {
                const newLabels = { ...prevLabels }
                delete newLabels[fileToRemove.name]
                return newLabels
            })
            return prev.filter((_, i) => i !== index)
        })
    }, [])

    const updatePhotoLabel = useCallback((fileName: string, label: string) => {
        setPhotoLabels((prev) => ({ ...prev, [fileName]: label }))
    }, [])

    const uploadPhotos = useCallback(async () => {
        if (uploadQueue.length === 0) return

        setUploading(true)
        setUploadProgress(0)
        const newUploadedPhotos: UploadedPhoto[] = []
        const uploadErrors: string[] = []

        for (let i = 0; i < uploadQueue.length; i++) {
            const file = uploadQueue[i]

            try {
                const avifBlob = await convertToAvif(file)

                const formData = new FormData()
                const avifFile = new File([avifBlob], `${file.name.split(".")[0]}.avif`, {
                    type: "image/avif",
                })
                formData.append("file", avifFile)
                formData.append("label", photoLabels[file.name] || "")

                const response = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                })

                const result = await response.json()

                if (result.success) {
                    newUploadedPhotos.push({
                        id: crypto.randomUUID(),
                        url: result.url,
                        key: result.key,
                        name: file.name,
                        label: photoLabels[file.name] || "",
                    })
                } else {
                    uploadErrors.push(`${file.name}: ${result.error}`)
                }
            } catch (error) {
                uploadErrors.push(`${file.name}: Failed to process image`)
            }

            setUploadProgress(((i + 1) / uploadQueue.length) * 100)
        }

        setUploadedPhotos((prev) => [...prev, ...newUploadedPhotos])
        setErrors(uploadErrors)
        setUploadQueue([])
        setPhotoLabels({})
        setUploading(false)

        if (onUploadComplete && newUploadedPhotos.length > 0) {
            onUploadComplete([...uploadedPhotos, ...newUploadedPhotos])
        }
    }, [uploadQueue, uploadedPhotos, onUploadComplete, photoLabels])

    return (
        <div className={cn("space-y-4", className)}>
            {/* Upload Area */}
            <Card
                className={cn(
                    "border-2 border-dashed transition-colors cursor-pointer",
                    isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                    uploading && "pointer-events-none opacity-50",
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Upload Photos</h3>
                    <p className="text-muted-foreground mb-4">Drag and drop your images here, or click to browse</p>
                    <p className="text-sm text-muted-foreground">Supports JPEG, PNG, WebP • Max {maxFiles} files • 10MB each</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </CardContent>
            </Card>

            {/* Upload Queue */}
            {uploadQueue.length > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold">Ready to Upload ({uploadQueue.length})</h4>
                            <Button onClick={uploadPhotos} disabled={uploading}>
                                {uploading ? "Uploading..." : "Upload All"}
                            </Button>
                        </div>

                        {uploading && (
                            <div className="mb-4">
                                <Progress value={uploadProgress} className="w-full" />
                                <p className="text-sm text-muted-foreground mt-2">
                                    Converting to AVIF and uploading... {Math.round(uploadProgress)}%
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {uploadQueue.map((file, index) => (
                                <div key={index} className="relative group border rounded-lg p-4">
                                    <div className="flex gap-4">
                                        <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <p className="text-sm font-medium truncate">{file.name}</p>
                                            <div className="space-y-1">
                                                <label className="text-xs text-muted-foreground">Photo Label (optional)</label>
                                                <input
                                                    type="text"
                                                    placeholder="Add a description or caption..."
                                                    value={photoLabels[file.name] || ""}
                                                    onChange={(e) => updatePhotoLabel(file.name, e.target.value)}
                                                    className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    disabled={uploading}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {!uploading && (
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                removeFromQueue(index)
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Uploaded Photos */}
            {uploadedPhotos.length > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <h4 className="font-semibold">Uploaded Successfully ({uploadedPhotos.length})</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {uploadedPhotos.map((photo) => (
                                <div key={photo.id} className="space-y-2">
                                    <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                                        <img
                                            src={photo.url || "/placeholder.svg"}
                                            alt={photo.label || photo.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs truncate">{photo.name}</p>
                                        {photo.label && <p className="text-xs text-muted-foreground truncate mt-1">{photo.label}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Errors */}
            {errors.length > 0 && (
                <Card className="border-destructive">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            <h4 className="font-semibold text-destructive">Upload Errors</h4>
                        </div>
                        <ul className="text-sm text-destructive space-y-1">
                            {errors.map((error, index) => (
                                <li key={index}>• {error}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
