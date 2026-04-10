import { useState, useCallback, useEffect } from 'react'
import Page from './Page'
import Toolbar from './Toolbar'

let nextImageId = 1

const INITIAL_PAGES = [
  { id: 1, strokes: [], images: [] },
  { id: 2, strokes: [], images: [] },
]

export default function App() {
  const [activeTool, setActiveTool] = useState('pointer')
  const [activeColor, setActiveColor] = useState('#1C1C1E')

  // Array of page objects — designed to scale to infinite pages in Phase 4
  const [pages, setPages] = useState(INITIAL_PAGES)

  // Which page id is in focus mode (null = spread view)
  const [focusedPageId, setFocusedPageId] = useState(null)

  // Which image is currently selected (for deletion)
  const [selectedImageId, setSelectedImageId] = useState(null)

  // Update strokes for a specific page
  const updateStrokes = useCallback((pageId, updater) => {
    setPages(prev => prev.map(page => {
      if (page.id !== pageId) return page
      const newStrokes = typeof updater === 'function'
        ? updater(page.strokes)
        : updater
      return { ...page, strokes: newStrokes }
    }))
  }, [])

  // Add an image to a page's images array
  const addImage = useCallback((pageId, imageSrc, width, height) => {
    setPages(prev => prev.map(page => {
      if (page.id !== pageId) return page
      const newImage = {
        id: `img-${nextImageId++}`,
        src: imageSrc,
        x: 0.25,
        y: 0.15,
        width: 0.5,
        rotation: 0,
        naturalWidth: width,
        naturalHeight: height,
      }
      return { ...page, images: [...page.images, newImage] }
    }))
  }, [])

  // Update position of a specific image
  const updateImage = useCallback((pageId, imageId, patch) => {
    setPages(prev => prev.map(page => {
      if (page.id !== pageId) return page
      return {
        ...page,
        images: page.images.map(img =>
          img.id === imageId ? { ...img, ...patch } : img
        ),
      }
    }))
  }, [])

  // Delete a specific image from a page
  const deleteImage = useCallback((pageId, imageId) => {
    setPages(prev => prev.map(page => {
      if (page.id !== pageId) return page
      return { ...page, images: page.images.filter(img => img.id !== imageId) }
    }))
    setSelectedImageId(null)
  }, [])

  const handleFocusPage = useCallback((pageId) => {
    setFocusedPageId(pageId)
  }, [])

  const handleExitFocus = useCallback(() => {
    setFocusedPageId(null)
    setSelectedImageId(null)
  }, [])

  // Keyboard deletion: Backspace or Delete removes the selected image
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedImageId !== null && focusedPageId !== null) {
        e.preventDefault()
        deleteImage(focusedPageId, selectedImageId)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedImageId, focusedPageId, deleteImage])

  // Currently visible spread (first two pages)
  const spread = pages.slice(0, 2)

  return (
    <div className="fixed inset-0 bg-table-texture overflow-hidden flex items-center justify-center">

      {/* Focus Mode Overlay — dims the desk when a page is focused.
          Rendered BEFORE the book so it sits behind the z-40 focused page
          but above the desk. Uses fixed positioning in the root stacking context. */}
      {focusedPageId !== null && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={handleExitFocus}
        />
      )}

      {/* Journal Book Container — no z-index set, so children participate
          in the root stacking context and can layer above the z-30 overlay */}
      <div className="relative book-shadow rounded-sm flex" style={{ height: '75vh' }}>
        {/* Spine / center crease */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 spine-shadow z-20 pointer-events-none" />

        {spread.map((pageData, index) => (
          <Page
            key={pageData.id}
            pageData={pageData}
            updateStrokes={updateStrokes}
            addImage={addImage}
            updateImage={updateImage}
            deleteImage={deleteImage}
            selectedImageId={selectedImageId}
            setSelectedImageId={setSelectedImageId}
            activeTool={activeTool}
            activeColor={activeColor}
            isFocused={focusedPageId === pageData.id}
            onFocus={handleFocusPage}
            side={index === 0 ? 'left' : 'right'}
          />
        ))}
      </div>

      {/* Floating Done Button — visible only in Focus Mode */}
      {focusedPageId !== null && (
        <button
          onClick={handleExitFocus}
          className="fixed top-6 right-6 z-50 px-5 py-2.5 bg-white/90 backdrop-blur-md
                     text-journal-dark font-semibold rounded-full shadow-lg
                     border border-white/40 hover:bg-white hover:scale-105
                     transition-all duration-200 cursor-pointer"
        >
          ✓ Done
        </button>
      )}

      {/* Toolbar */}
      <Toolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        activeColor={activeColor}
        setActiveColor={setActiveColor}
      />
    </div>
  )
}
