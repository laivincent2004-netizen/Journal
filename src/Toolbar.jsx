import { MousePointer2, PenTool, Eraser, Highlighter } from 'lucide-react'

const COLORS = [
  { name: 'Charcoal Black', value: '#1C1C1E' },
  { name: 'Navy Blue', value: '#000080' },
  { name: 'Crimson', value: '#DC143C' },
]

export default function Toolbar({ activeTool, setActiveTool, activeColor, setActiveColor }) {
  return (
    <div 
      className="flex items-center gap-4 bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-white/40 fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999]"
    >
      
      {/* Tools */}
      <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
        <button 
          onClick={() => setActiveTool('pointer')}
          className={`p-3 rounded-full transition-all ${activeTool === 'pointer' ? 'bg-journal-dark text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
        >
          <MousePointer2 size={24} />
        </button>
        <button 
          onClick={() => { setActiveTool('pen'); setActiveColor(COLORS[0].value) }}
          className={`p-3 rounded-full transition-all ${activeTool === 'pen' ? 'bg-journal-dark text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
        >
          <PenTool size={24} />
        </button>
        <button 
          onClick={() => { setActiveTool('highlighter') }}
          className={`p-3 rounded-full transition-all ${activeTool === 'highlighter' ? 'bg-journal-highlight text-journal-dark shadow-[0_0_15px_rgba(255,204,0,0.6)]' : 'text-gray-600 hover:bg-gray-200'}`}
        >
          <Highlighter size={24} />
        </button>
        <button 
          onClick={() => setActiveTool('eraser')}
          className={`p-3 rounded-full transition-all ${activeTool === 'eraser' ? 'bg-red-100 text-red-600 shadow-inner' : 'text-gray-600 hover:bg-gray-200'}`}
        >
          <Eraser size={24} />
        </button>
      </div>

      {/* Colors (only for pen) */}
      <div className="flex items-center gap-3">
        {COLORS.map(color => (
          <button
            key={color.value}
            onClick={() => {
              if (activeTool !== 'pen') setActiveTool('pen')
              setActiveColor(color.value)
            }}
            className={`w-8 h-8 rounded-full border-2 transition-transform ${activeColor === color.value && activeTool === 'pen' ? 'scale-125 border-gray-400 shadow-md' : 'border-transparent hover:scale-110 shadow-sm'}`}
            style={{ backgroundColor: color.value }}
          />
        ))}
      </div>
    </div>
  )
}
