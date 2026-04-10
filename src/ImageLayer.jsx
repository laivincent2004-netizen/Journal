import { useState, useCallback, useRef } from 'react'

export default function ImageLayer({ layer, activeTool, isSelected, onSelect, onMove, onRotate, pageRef }) {
  const [dragging, setDragging] = useState(false)
  const [rotating, setRotating] = useState(false)
  const didDrag = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, layerX: 0, layerY: 0 })
  const rotateCenter = useRef({ cx: 0, cy: 0 })
  const containerRef = useRef(null)

  const isPointer = activeTool === 'pointer'

  // ---- DRAG TO MOVE ----
  const handlePointerDown = useCallback((e) => {
    if (!isPointer) return
    e.stopPropagation()
    e.target.setPointerCapture(e.pointerId)
    didDrag.current = false
    setDragging(true)

    const pageRect = pageRef.current?.getBoundingClientRect()
    if (!pageRect) return

    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      layerX: layer.x,
      layerY: layer.y,
      pageW: pageRect.width,
      pageH: pageRect.height,
    }
  }, [isPointer, layer.x, layer.y, pageRef])

  const handlePointerMove = useCallback((e) => {
    if (!dragging) return
    const { x, y, layerX, layerY, pageW, pageH } = dragStart.current

    const dx = (e.clientX - x) / pageW
    const dy = (e.clientY - y) / pageH

    const pxDist = Math.sqrt((e.clientX - x) ** 2 + (e.clientY - y) ** 2)
    if (pxDist > 3) didDrag.current = true

    if (!didDrag.current) return

    let newX = layerX + dx
    let newY = layerY + dy

    const aspectRatio = layer.naturalHeight / layer.naturalWidth
    const heightFrac = layer.width * aspectRatio * (pageW / pageH)

    newX = Math.max(0, Math.min(1 - layer.width, newX))
    newY = Math.max(0, Math.min(1 - heightFrac, newY))

    onMove(newX, newY)
  }, [dragging, layer.width, layer.naturalWidth, layer.naturalHeight, onMove])

  const handlePointerUp = useCallback(() => {
    if (!didDrag.current && onSelect) {
      onSelect()
    }
    setDragging(false)
  }, [onSelect])

  // ---- ROTATION HANDLE ----
  const handleRotateDown = useCallback((e) => {
    e.stopPropagation()
    e.preventDefault()
    e.target.setPointerCapture(e.pointerId)
    setRotating(true)

    // Calculate the center of the image container
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    rotateCenter.current = {
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2,
    }
  }, [])

  const handleRotateMove = useCallback((e) => {
    if (!rotating) return
    const { cx, cy } = rotateCenter.current
    let angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI)
    // Offset by 90° since the handle is at the top (not the right)
    angle += 90

    // Magnetic snap to nearest 90° axis
    const SNAP_TOLERANCE = 8
    const nearestAxis = Math.round(angle / 90) * 90
    if (Math.abs(angle - nearestAxis) <= SNAP_TOLERANCE) {
      angle = nearestAxis
    }

    onRotate(angle)
  }, [rotating, onRotate])

  const handleRotateUp = useCallback(() => {
    setRotating(false)
  }, [])

  // Compute display dimensions
  const aspectRatio = layer.naturalHeight / layer.naturalWidth
  const widthPct = layer.width * 100
  const rotation = layer.rotation || 0

  return (
    <div
      ref={containerRef}
      className="absolute"
      style={{
        left: `${layer.x * 100}%`,
        top: `${layer.y * 100}%`,
        width: `${widthPct}%`,
        pointerEvents: isPointer ? 'auto' : 'none',
        cursor: isPointer ? (dragging ? 'grabbing' : 'grab') : 'default',
        zIndex: 'inherit',
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Rotation handle — visible only when selected */}
      {isSelected && isPointer && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          {/* Rotation knob (above the line) */}
          <div
            onPointerDown={handleRotateDown}
            onPointerMove={handleRotateMove}
            onPointerUp={handleRotateUp}
            onPointerCancel={handleRotateUp}
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: 'white',
              border: '2px solid #3b82f6',
              boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
              cursor: 'grab',
              pointerEvents: 'auto',
              marginTop: '-44px',
            }}
          />
          {/* Connecting line */}
          <div
            style={{
              width: '2px',
              height: '28px',
              backgroundColor: '#3b82f6',
              marginTop: '-1px',
            }}
          />
        </div>
      )}

      <img
        src={layer.src}
        alt=""
        draggable={false}
        className="journal-photo"
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          outline: isSelected ? '3px solid #3b82f6' : 'none',
          outlineOffset: '3px',
        }}
      />
    </div>
  )
}
