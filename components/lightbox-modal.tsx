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
    const [touchStart, setTouchStart] = useState({ x: 0, y: 0, distance: 0 })
    const [initialZoom, setInitialZoom] = useState(1)

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

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            // Single touch - start drag
            if (zoom > 1) {
                setIsDragging(true)
                setDragStart({
                    x: e.touches[0].clientX - position.x,
                    y: e.touches[0].clientY - position.y,
                })
            }
            setTouchStart({
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
                distance: 0,
            })
        } else if (e.touches.length === 2) {
            // Pinch to zoom
            const distance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY,
            )
            setTouchStart({
                x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
                distance,
            })
            setInitialZoom(zoom)
        }
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        e.preventDefault()

        if (e.touches.length === 1 && isDragging && zoom > 1) {
            // Single touch drag
            setPosition({
                x: e.touches[0].clientX - dragStart.x,
                y: e.touches[0].clientY - dragStart.y,
            })
        } else if (e.touches.length === 2) {
            // Pinch zoom
            const distance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY,
            )
            const scale = distance / touchStart.distance
            const newZoom = Math.min(Math.max(initialZoom * scale, 0.5), 3)
            setZoom(newZoom)
        }
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (e.touches.length === 0) {
            setIsDragging(false)

            if (!isDragging && zoom === 1 && e.changedTouches.length === 1) {
                const touch = e.changedTouches[0]
                const deltaX = touch.clientX - touchStart.x
                const deltaY = Math.abs(touch.clientY - touchStart.y)

                // Swipe threshold and ensure horizontal swipe
                if (Math.abs(deltaX) > 50 && deltaY < 100) {
                    if (deltaX > 0) {
                        navigateToPrevious()
                    } else {
                        navigateToNext()
                    }
                }
            }
        }
    }

    if (!isOpen || !currentPhoto) return null

    return (
        <div className="fixed inset-0 z-50 bg-black/95 dark:bg-black/98 backdrop-blur-sm">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 dark:from-black/80 to-transparent p-2 sm:p-4 safe-area-inset-top">
                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <span className="text-xs sm:text-sm text-white/70 whitespace-nowrap">
              {currentIndex + 1} of {photos.length}
            </span>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleZoomOut}
                            disabled={zoom <= 0.5}
                            className="text-white hover:bg-white/20 dark:hover:bg-white/30 h-8 w-8 sm:h-10 sm:w-10 p-0"
                        >
                            <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetZoom}
                            className="text-white hover:bg-white/20 dark:hover:bg-white/30 text-xs px-1 sm:px-2 h-8 sm:h-10 min-w-[2rem] sm:min-w-[2.5rem]"
                        >
                            {Math.round(zoom * 100)}%
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleZoomIn}
                            disabled={zoom >= 3}
                            className="text-white hover:bg-white/20 dark:hover:bg-white/30 h-8 w-8 sm:h-10 sm:w-10 p-0"
                        >
                            <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDownload}
                            className="text-white hover:bg-white/20 dark:hover:bg-white/30 h-8 w-8 sm:h-10 sm:w-10 p-0"
                        >
                            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-white hover:bg-white/20 dark:hover:bg-white/30 h-8 w-8 sm:h-10 sm:w-10 p-0"
                        >
                            <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main image area */}
            <div
                className="absolute inset-0 flex items-center justify-center p-2 sm:p-4 pt-12 sm:pt-20 pb-12 sm:pb-16 safe-area-inset"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <div
                    className={cn(
                        "relative w-full h-full max-w-full max-h-full transition-transform duration-200",
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
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onClick={zoom === 1 ? handleZoomIn : undefined}
                >
                    {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-white"></div>
                        </div>
                    )}

                    <img
                        src={currentPhoto.url || "/placeholder.svg"}
                        alt={currentPhoto.name}
                        className={cn(
                            "w-full h-full object-contain transition-opacity duration-300",
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
                        className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 dark:hover:bg-white/30 h-10 w-10 sm:h-12 sm:w-12 rounded-full"
                    >
                        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="lg"
                        onClick={navigateToNext}
                        className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 dark:hover:bg-white/30 h-10 w-10 sm:h-12 sm:w-12 rounded-full"
                    >
                        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Button>
                </>
            )}

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 dark:from-black/80 to-transparent p-2 sm:p-4 safe-area-inset-bottom">
                <div className="flex items-center justify-center">
                    <div className="flex gap-1 sm:gap-2 max-w-full overflow-x-auto">
                        {photos.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => onNavigate?.(index)}
                                className={cn(
                                    "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all flex-shrink-0",
                                    index === currentIndex ? "bg-white" : "bg-white/40 hover:bg-white/60",
                                )}
                            />
                        ))}
                    </div>
                </div>

                <div className="text-center text-white/70 text-xs sm:text-sm mt-1 sm:mt-2">
          <span className="hidden sm:inline">
            Use arrow keys to navigate • ESC to close • Click to zoom • +/- to zoom in/out
          </span>
                    <span className="sm:hidden">Swipe to navigate • Pinch to zoom</span>
                </div>
            </div>
        </div>
    )
}
