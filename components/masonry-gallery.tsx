"use client"

import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface Photo {
  id: string
  url: string
  name: string
  width?: number
  height?: number
}

interface MasonryGalleryProps {
  photos: Photo[]
  onPhotoClick?: (photo: Photo, index: number) => void
  className?: string
}

export function MasonryGallery({ photos, onPhotoClick, className }: MasonryGalleryProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const galleryRef = useRef<HTMLDivElement>(null)

  const handleImageLoad = (photoId: string) => {
    setLoadedImages((prev) => new Set([...prev, photoId]))
  }

  const handleImageError = (photoId: string) => {
    setImageErrors((prev) => new Set([...prev, photoId]))
  }

  const handlePhotoClick = (photo: Photo, index: number) => {
    if (onPhotoClick) {
      onPhotoClick(photo, index)
    }
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">No photos yet</h3>
        <p className="text-muted-foreground">Upload some photos to get started</p>
      </div>
    )
  }

  return (
    <div
      ref={galleryRef}
      className={cn("columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4", className)}
    >
      {photos.map((photo, index) => (
        <MasonryItem
          key={photo.id}
          photo={photo}
          index={index}
          isLoaded={loadedImages.has(photo.id)}
          hasError={imageErrors.has(photo.id)}
          onLoad={() => handleImageLoad(photo.id)}
          onError={() => handleImageError(photo.id)}
          onClick={() => handlePhotoClick(photo, index)}
        />
      ))}
    </div>
  )
}

interface MasonryItemProps {
  photo: Photo
  index: number
  isLoaded: boolean
  hasError: boolean
  onLoad: () => void
  onError: () => void
  onClick: () => void
}

function MasonryItem({ photo, index, isLoaded, hasError, onLoad, onError, onClick }: MasonryItemProps) {
  return (
    <Card
      className={cn(
        "break-inside-avoid mb-4 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group",
        "border-0 shadow-sm hover:shadow-xl dark:shadow-lg dark:hover:shadow-2xl",
      )}
      onClick={onClick}
    >
      <div className="relative">
        {!isLoaded && !hasError && <Skeleton className="w-full aspect-[4/5] rounded-lg" />}

        {hasError ? (
          <div className="w-full aspect-[4/5] bg-muted flex items-center justify-center rounded-lg">
            <div className="text-center text-muted-foreground">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <p className="text-xs">Failed to load</p>
            </div>
          </div>
        ) : (
          <img
            src={photo.url || "/placeholder.svg"}
            alt={photo.name}
            className={cn(
              "w-full h-auto object-cover transition-all duration-300 rounded-lg",
              "group-hover:brightness-110 dark:group-hover:brightness-125",
              !isLoaded && "opacity-0",
            )}
            onLoad={onLoad}
            onError={onError}
            loading="lazy"
          />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 dark:group-hover:bg-black/30 transition-all duration-300 rounded-lg flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-white/90 dark:bg-black/90 rounded-full p-3 backdrop-blur-sm">
              <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Photo info */}
      <div className="p-3">
        <p className="text-sm font-medium truncate text-foreground">{photo.name}</p>
        <p className="text-xs text-muted-foreground mt-1">Photo {index + 1}</p>
      </div>
    </Card>
  )
}
