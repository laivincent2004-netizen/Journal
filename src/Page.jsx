import { useRef, useState, useCallback, useEffect } from 'react'
import Canvas from './Canvas'

export default function Page({
  pageData,
  updateStrokes,
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

  // Compute the CSS transform to center + scale this page to fill the viewport
  useEffect(() => {
    if (isFocused && pageRef.current) {
      const rect = pageRef.current.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const aspect = 5 / 8

      // Target dimensions: fill 85% of viewport while maintaining 5/8 ratio
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

      // Translate from current center to viewport center
      const currentCenterX = rect.left + rect.width / 2
      const currentCenterY = rect.top + rect.height / 2
      const tx = vw / 2 - currentCenterX
      const ty = vh / 2 - currentCenterY

      setFocusTransform(`translate(${tx}px, ${ty}px) scale(${scale})`)
    } else {
      setFocusTransform(null)
    }
  }, [isFocused])

  // When the CSS transition finishes, resize the canvas to its new
  // physical DOM size and redraw all strokes at native resolution.
  // This is the "blur fix": CSS scale() is used for the smooth animation,
  // then we snap to crisp rendering once the animation completes.
  const handleTransitionEnd = useCallback((e) => {
    if (e.propertyName !== 'transform') return
    if (canvasRef.current) {
      canvasRef.current.resizeAndRedraw()
    }
  }, [])

  // Wrapper to update strokes in the central pages state
  const setStrokes = useCallback((updater) => {
    updateStrokes(pageData.id, updater)
  }, [pageData.id, updateStrokes])

  const handleClick = (e) => {
    // Only enter Focus Mode when the pointer/select tool is active
    if (!isFocused && activeTool === 'pointer') {
      e.stopPropagation()
      onFocus(pageData.id)
    }
  }

  // Shadow class based on which side of the spine this page is on
  const pageShadowClass = side === 'left' ? 'page-shadow-left' : 'page-shadow-right'

  // Cursor: crosshair for drawing tools, default pointer for pointer tool
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
      `}
      style={{
        transform: focusTransform || 'none',
        transformOrigin: 'center center',
      }}
      onClick={handleClick}
      onTransitionEnd={handleTransitionEnd}
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
  )
}
