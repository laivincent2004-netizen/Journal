import { useState, useCallback } from 'react'
import Page from './Page'
import Toolbar from './Toolbar'

const INITIAL_PAGES = [
  { id: 1, strokes: [] },
  { id: 2, strokes: [] },
]

export default function App() {
  const [activeTool, setActiveTool] = useState('pointer')
  const [activeColor, setActiveColor] = useState('#1C1C1E')

  // Array of page objects — designed to scale to infinite pages in Phase 4
  const [pages, setPages] = useState(INITIAL_PAGES)

  // Which page id is in focus mode (null = spread view)
  const [focusedPageId, setFocusedPageId] = useState(null)

  // Update strokes for a specific page by id
  const updateStrokes = useCallback((pageId, updater) => {
    setPages(prev => prev.map(page => {
      if (page.id !== pageId) return page
      const newStrokes = typeof updater === 'function'
        ? updater(page.strokes)
        : updater
      return { ...page, strokes: newStrokes }
    }))
  }, [])

  const handleFocusPage = useCallback((pageId) => {
    setFocusedPageId(pageId)
  }, [])

  const handleExitFocus = useCallback(() => {
    setFocusedPageId(null)
  }, [])

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
