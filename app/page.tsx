"use client"

import { useState, useEffect } from "react"
import { PhotoGalleryHeader } from "@/components/photo-gallery-header"
import { MasonryGallery } from "@/components/masonry-gallery"
import { PhotoUpload } from "@/components/photo-upload"
import { LightboxModal } from "@/components/lightbox-modal"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

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

  useEffect(() => {
    const savedPhotos = localStorage.getItem("gallery-photos")
    if (savedPhotos) {
      try {
        setPhotos(JSON.parse(savedPhotos))
      } catch (error) {
        console.error("Failed to load saved photos:", error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("gallery-photos", JSON.stringify(photos))
  }, [photos])

  const handleUploadComplete = (newPhotos: Photo[]) => {
    setPhotos((prev) => [...prev, ...newPhotos])
    setShowUpload(false)
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
      <PhotoGalleryHeader onUploadClick={() => setShowUpload(true)} photoCount={photos.length} />

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

        <MasonryGallery photos={photos} onPhotoClick={handlePhotoClick} className="mt-8" />
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
