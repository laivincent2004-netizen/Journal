import { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react'
import { generatePathData } from './utils'

const Canvas = forwardRef(function Canvas(
  { activeTool, activeColor, strokes, setStrokes, currentStroke, setCurrentStroke },
  ref
) {
  const canvasRef = useRef(null)
  const wrapperRef = useRef(null)

  // Expose imperative method so Page can trigger a native-resolution redraw
  // after the CSS focus transition completes
  useImperativeHandle(ref, () => ({
    resizeAndRedraw() {
      syncCanvasSize()
      // Force a redraw by triggering the strokes effect
      setStrokes(prev => [...prev])
    }
  }))

  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current
    const wrapper = wrapperRef.current
    if (!canvas || !wrapper) return

    const rect = wrapper.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
  }, [])

  // Resize canvas to match its wrapper (the page) on mount & window resize
  useEffect(() => {
    const handleResize = () => {
      syncCanvasSize()
      setStrokes(prev => [...prev])
    }

    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [setStrokes, syncCanvasSize])

  // Redraw all strokes whenever strokes or currentStroke change
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    // Clear using raw pixel dimensions (context is already scaled by dpr)
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)

    const drawStroke = (stroke, isCurrent = false) => {
      let pathData = stroke.pathData
      if (isCurrent) {
        pathData = generatePathData(stroke.points, stroke.tool)
      }
      if (!pathData) return

      const path = new Path2D(pathData)
      ctx.fillStyle = stroke.color
      if (stroke.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'multiply'
      } else {
        ctx.globalCompositeOperation = 'source-over'
      }
      ctx.fill(path)
    }

    strokes.forEach(s => drawStroke(s, false))
    if (currentStroke) drawStroke(currentStroke, true)
  }, [strokes, currentStroke])

  // ---- POINTER MATH (CRITICAL) ----
  // Uses getBoundingClientRect() so coordinates are always relative to the
  // page's actual screen position, automatically accounting for any CSS
  // scale/translate transforms from Focus Mode.
  const getPointerPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()

    // rect already reflects CSS transforms, so this correctly
    // maps screen pixels → canvas logical pixels
    const x = (e.clientX - rect.left) * (canvas.width / rect.width) / (window.devicePixelRatio || 1)
    const y = (e.clientY - rect.top) * (canvas.height / rect.height) / (window.devicePixelRatio || 1)

    return { x, y, pressure: e.pressure ?? 0.5 }
  }

  const handlePointerDown = (e) => {
    // Pointer tool: let the event bubble up to Page for focus zoom
    if (activeTool === 'pointer') return
    e.stopPropagation()
    const canvas = canvasRef.current
    canvas.setPointerCapture(e.pointerId)
    const pos = getPointerPos(e)

    if (activeTool === 'eraser') {
      eraseAtPoint(pos.x, pos.y)
    } else {
      setCurrentStroke({
        tool: activeTool,
        color: activeTool === 'highlighter' ? '#FFCC00' : activeColor,
        points: [pos]
      })
    }
  }

  const handlePointerMove = (e) => {
    if (activeTool === 'pointer' || e.buttons !== 1) return
    const pos = getPointerPos(e)

    if (activeTool === 'eraser') {
      eraseAtPoint(pos.x, pos.y)
    } else if (currentStroke) {
      setCurrentStroke(prev => ({
        ...prev,
        points: [...prev.points, pos]
      }))
    }
  }

  const handlePointerUp = () => {
    if (currentStroke && activeTool !== 'eraser') {
      const pathData = generatePathData(currentStroke.points, currentStroke.tool)
      setStrokes(prev => [...prev, { ...currentStroke, pathData }])
      setCurrentStroke(null)
    }
  }

  const eraseAtPoint = (x, y) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    setStrokes(prev => prev.filter(stroke => {
      if (!stroke.pathData) return true
      const path = new Path2D(stroke.pathData)
      return !ctx.isPointInPath(path, x * dpr, y * dpr)
    }))
  }

  return (
    <div ref={wrapperRef} className="absolute inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerOut={handlePointerUp}
      />
    </div>
  )
})

export default Canvas
