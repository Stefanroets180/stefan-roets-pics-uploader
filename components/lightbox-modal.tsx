"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from "lucide-react"
import { cn } from "@/lib/utils"

interface Photo {
  id: string
  url: string
  name: string
  key: string
}

interface LightboxModalProps {
  photos: Photo[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onNavigate?: (index: number) => void
}

export function LightboxModal({ photos, currentIndex, isOpen, onClose, onNavigate }: LightboxModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const currentPhoto = photos[currentIndex]

  // Reset zoom and position when photo changes
  useEffect(() => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
    setImageLoaded(false)
  }, [currentIndex])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case "Escape":
          onClose()
          break
        case "ArrowLeft":
          e.preventDefault()
          navigateToPrevious()
          break
        case "ArrowRight":
          e.preventDefault()
          navigateToNext()
          break
        case "+":
        case "=":
          e.preventDefault()
          handleZoomIn()
          break
        case "-":
          e.preventDefault()
          handleZoomOut()
          break
        case "0":
          e.preventDefault()
          resetZoom()
          break
      }
    },
    [isOpen, currentIndex],
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, handleKeyDown])

  const navigateToPrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1
    onNavigate?.(newIndex)
  }

  const navigateToNext = () => {
    const newIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0
    onNavigate?.(newIndex)
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.2, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.5))
  }

  const resetZoom = () => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleDownload = async () => {
    if (!currentPhoto) return

    try {
      const response = await fetch(currentPhoto.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = currentPhoto.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  if (!isOpen || !currentPhoto) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/95 dark:bg-black/98 backdrop-blur-sm">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 dark:from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold truncate max-w-md">{currentPhoto.name}</h2>
            <span className="text-sm text-white/70">
              {currentIndex + 1} of {photos.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="text-white hover:bg-white/20 dark:hover:bg-white/30"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={resetZoom}
              className="text-white hover:bg-white/20 dark:hover:bg-white/30 text-xs px-2"
            >
              {Math.round(zoom * 100)}%
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="text-white hover:bg-white/20 dark:hover:bg-white/30"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-white hover:bg-white/20 dark:hover:bg-white/30"
            >
              <Download className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 dark:hover:bg-white/30"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main image area */}
      <div
        className="absolute inset-0 flex items-center justify-center p-4 pt-20 pb-16"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className={cn(
            "relative max-w-full max-h-full transition-transform duration-200",
            zoom > 1 ? "cursor-grab" : "cursor-zoom-in",
            isDragging && "cursor-grabbing",
          )}
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={zoom === 1 ? handleZoomIn : undefined}
        >
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}

          <img
            src={currentPhoto.url || "/placeholder.svg"}
            alt={currentPhoto.name}
            className={cn(
              "max-w-full max-h-full object-contain transition-opacity duration-300",
              imageLoaded ? "opacity-100" : "opacity-0",
            )}
            onLoad={() => setImageLoaded(true)}
            draggable={false}
          />
        </div>
      </div>

      {/* Navigation buttons */}
      {photos.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="lg"
            onClick={navigateToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 dark:hover:bg-white/30 h-12 w-12 rounded-full"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={navigateToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 dark:hover:bg-white/30 h-12 w-12 rounded-full"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 dark:from-black/80 to-transparent p-4">
        <div className="flex items-center justify-center">
          <div className="flex gap-2">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={() => onNavigate?.(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentIndex ? "bg-white" : "bg-white/40 hover:bg-white/60",
                )}
              />
            ))}
          </div>
        </div>

        <div className="text-center text-white/70 text-sm mt-2">
          Use arrow keys to navigate • ESC to close • Click to zoom • +/- to zoom in/out
        </div>
      </div>
    </div>
  )
}
