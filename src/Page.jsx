import { useRef, useState, useCallback, useEffect } from 'react'
import Canvas from './Canvas'
import ImageLayer from './ImageLayer'

export default function Page({
  pageData,
  updateStrokes,
  addImage,
  updateImage,
  deleteImage,
  selectedImageId,
  setSelectedImageId,
  activeTool,
  activeColor,
  isFocused,
  onFocus,
  side, // 'left' or 'right'
}) {
  const canvasRef = useRef(null)
  const pageRef = useRef(null)
  const [currentStroke, setCurrentStroke] = useState(null)
  const [focusTransform, setFocusTransform] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // ---- Focus Mode Transform ----
  useEffect(() => {
    if (isFocused && pageRef.current) {
      const rect = pageRef.current.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const aspect = 5 / 8

      const fill = 0.85
      const maxH = vh * fill
      const wFromH = maxH * aspect
      const maxW = vw * fill
      const hFromW = maxW / aspect

      let targetW, targetH
      if (wFromH <= maxW) {
        targetW = wFromH
        targetH = maxH
      } else {
        targetW = maxW
        targetH = hFromW
      }

      const scale = targetW / rect.width

      const currentCenterX = rect.left + rect.width / 2
      const currentCenterY = rect.top + rect.height / 2
      const tx = vw / 2 - currentCenterX
      const ty = vh / 2 - currentCenterY

      setFocusTransform(`translate(${tx}px, ${ty}px) scale(${scale})`)
    } else {
      setFocusTransform(null)
    }
  }, [isFocused])

  // Phase 2 blur fix: after focus transition, resize the single canvas
  const handleTransitionEnd = useCallback((e) => {
    if (e.propertyName !== 'transform') return
    if (canvasRef.current) {
      canvasRef.current.resizeAndRedraw()
    }
  }, [])

  // Stroke updater scoped to this page
  const setStrokes = useCallback((updater) => {
    updateStrokes(pageData.id, updater)
  }, [pageData.id, updateStrokes])

  // Single click on empty background deselects images
  const handleClick = (e) => {
    if (activeTool === 'pointer') {
      setSelectedImageId(null)
    }
  }

  // Double-click to enter Focus Mode
  const handleDoubleClick = (e) => {
    if (!isFocused && activeTool === 'pointer') {
      e.stopPropagation()
      onFocus(pageData.id)
    }
  }

  // ---- Drag-and-Drop Image Handling ----
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length === 0) return

    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target.result
        const img = new Image()
        img.onload = () => {
          addImage(pageData.id, dataUrl, img.naturalWidth, img.naturalHeight)
        }
        img.src = dataUrl
      }
      reader.readAsDataURL(file)
    })
  }, [pageData.id, addImage])

  // ---- Styling ----
  const pageShadowClass = side === 'left' ? 'page-shadow-left' : 'page-shadow-right'
  const cursorClass = activeTool === 'pointer' ? 'cursor-pointer' : 'cursor-crosshair'

  return (
    <div
      ref={pageRef}
      className={`
        relative bg-paper-texture aspect-[5/8] overflow-hidden h-full
        transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isFocused
          ? `z-40 shadow-2xl ${cursorClass}`
          : `${pageShadowClass} ${cursorClass} hover:brightness-[0.98]`
        }
        ${isDragOver ? 'page-drag-over' : ''}
      `}
      style={{
        transform: focusTransform || 'none',
        transformOrigin: 'center center',
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onTransitionEnd={handleTransitionEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ========= BOTTOM PLANE: Images ========= */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        {pageData.images.map(image => (
          <ImageLayer
            key={image.id}
            layer={image}
            activeTool={activeTool}
            isSelected={selectedImageId === image.id}
            onSelect={() => setSelectedImageId(image.id)}
            onMove={(x, y) => updateImage(pageData.id, image.id, { x, y })}
            onRotate={(rotation) => updateImage(pageData.id, image.id, { rotation })}
            pageRef={pageRef}
          />
        ))}
      </div>

      {/* ========= TOP PLANE: Single Canvas ========= */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 1,
          pointerEvents: activeTool === 'pointer' ? 'none' : 'auto',
        }}
      >
        <Canvas
          ref={canvasRef}
          activeTool={activeTool}
          activeColor={activeColor}
          strokes={pageData.strokes}
          setStrokes={setStrokes}
          currentStroke={currentStroke}
          setCurrentStroke={setCurrentStroke}
        />
      </div>
    </div>
  )
}
