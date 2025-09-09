export async function convertToAvif(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.crossOrigin = "anonymous"

    img.onload = () => {
      // Calculate dimensions while maintaining aspect ratio
      const maxWidth = 1920
      const maxHeight = 1080

      let { width, height } = img

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }

      canvas.width = width
      canvas.height = height

      ctx?.drawImage(img, 0, 0, width, height)

      // Convert to AVIF with high quality
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error("Failed to convert image to AVIF"))
          }
        },
        "image/avif",
        0.4,
      )
    }

    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = URL.createObjectURL(file)
  })
}

export function validateImageFile(file: File): boolean {
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
  const maxSize = 60 * 5616 * 3744 // 60MB

  return validTypes.includes(file.type) && file.size <= maxSize
}
