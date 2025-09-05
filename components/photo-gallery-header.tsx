"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Moon, Sun, Upload } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

interface PhotoGalleryHeaderProps {
  onUploadClick?: () => void
  photoCount?: number
  extraActions?: React.ReactNode
}

export function PhotoGalleryHeader({ onUploadClick, photoCount = 0, extraActions }: PhotoGalleryHeaderProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Photo Gallery</h1>
            <p className="text-muted-foreground">
              {photoCount > 0 ? `${photoCount} photos` : "Your personal photo collection"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onUploadClick} className="gap-2 bg-transparent">
              <Upload className="h-4 w-4" />
              Upload Photos
            </Button>

            {extraActions}

            {mounted && (
              <Button variant="ghost" size="sm" onClick={toggleTheme} className="h-9 w-9 p-0">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
