"use client"

import { useState, useEffect } from "react"
import { PhotoGalleryHeader } from "@/components/photo-gallery-header"
import { MasonryGallery } from "@/components/masonry-gallery"
import { PhotoUpload } from "@/components/photo-upload"
import { LightboxModal } from "@/components/lightbox-modal"
import { Button } from "@/components/ui/button"
import { X, RefreshCw } from "lucide-react"

interface Photo {
  id: string
  url: string
  name: string
  key: string
}

export default function HomePage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchPhotos = async () => {
    try {
      const response = await fetch("/api/photos")
      if (response.ok) {
        const data = await response.json()
        setPhotos(data.photos)
      } else {
        console.error("Failed to fetch photos")
      }
    } catch (error) {
      console.error("Error fetching photos:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPhotos()
  }, [])

  const handleUploadComplete = (newPhotos: Photo[]) => {
    setShowUpload(false)
    fetchPhotos() // Refresh the photo list from S3
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchPhotos()
  }

  const handlePhotoClick = (photo: Photo, index: number) => {
    setCurrentPhotoIndex(index)
    setLightboxOpen(true)
  }

  const handleLightboxNavigate = (index: number) => {
    setCurrentPhotoIndex(index)
  }

  const handleLightboxClose = () => {
    setLightboxOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <PhotoGalleryHeader
        onUploadClick={() => setShowUpload(true)}
        photoCount={photos.length}
        extraActions={
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing} className="ml-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        }
      />

      <main className="container mx-auto px-4 py-8">
        {showUpload && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Upload New Photos</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowUpload(false)} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <PhotoUpload onUploadComplete={handleUploadComplete} />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading photos...</p>
            </div>
          </div>
        ) : (
          <MasonryGallery photos={photos} onPhotoClick={handlePhotoClick} className="mt-8" />
        )}
      </main>

      <LightboxModal
        photos={photos}
        currentIndex={currentPhotoIndex}
        isOpen={lightboxOpen}
        onClose={handleLightboxClose}
        onNavigate={handleLightboxNavigate}
      />
    </div>
  )
}
