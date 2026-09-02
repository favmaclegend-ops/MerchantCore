import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'

/**
 * Camera-based QR code scanner. Streams frames from the device camera and
 * decodes QR codes using jsQR. Calls `onScan` with the decoded raw string
 * (the attendance token) once detected, then stops the camera.
 */
export function useQrScanner(onScan: (data: string) => void, enabled: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan
  const [error, setError] = useState('')

  useEffect(() => {
    if (!enabled) return
    let stopped = false

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        if (stopped) {
          stream.getTracks().forEach(t => t.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()
        setError('')

        const tick = () => {
          if (stopped || !video) return
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            const canvas = document.createElement('canvas')
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext('2d', { willReadFrequently: true })
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
              const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
              const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })
              if (code && code.data) {
                onScanRef.current(code.data)
                stopCamera()
                return
              }
            }
          }
          rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
      } catch {
        if (!stopped) setError('Camera unavailable. Allow camera access or check HTTPS.')
      }
    }

    const stopCamera = () => {
      stopped = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }

    start()

    return () => {
      stopCamera()
    }
  }, [enabled])

  return { videoRef, error }
}
