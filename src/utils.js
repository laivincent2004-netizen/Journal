import { getStroke } from 'perfect-freehand'

export function getSvgPathFromStroke(strokePoints) {
  if (!strokePoints.length) return ""

  const d = strokePoints.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ["M", ...strokePoints[0], "Q"]
  )

  d.push("Z")
  return d.join(" ")
}

export function getOptions(tool) {
  switch (tool) {
    case 'pen':
      return { size: 4, thinning: 0.6, smoothing: 0.5, streamline: 0.5 }
    case 'highlighter':
      return { size: 30, thinning: 0, smoothing: 0.8, streamline: 0.5 }
    default:
      return { size: 4 }
  }
}

export function generatePathData(points, tool) {
  if (points.length === 0) return ""
  // Format points for perfect-freehand: it accepts {x, y, pressure}
  const formattedPoints = points.map(p => ({ x: p.x, y: p.y, pressure: p.pressure }))
  const options = getOptions(tool)
  const outlinePoints = getStroke(formattedPoints, options)
  return getSvgPathFromStroke(outlinePoints)
}
