import type { PathArray, Point, PolylineStyleProps } from '@antv/g6'
import { describe, expect, it } from 'vitest'
import { RankingGraphEdge } from './ranking-graph-edge.ts'

// Exercise G6's actual path generation with fixed node boundaries, without a canvas.
class EdgeWithFixedEndpoints extends RankingGraphEdge {
  endpoints: [Point, Point] = [[86, 98], [86, 40]]

  override render(): void {
    // Only path generation is under test; skip canvas rendering in G6's constructor.
  }

  protected override getEndpoints(): [Point, Point] {
    return this.endpoints
  }

  protected override getControlPoints(attributes: Required<PolylineStyleProps>): Point[] {
    return attributes.controlPoints
  }

  path(controlPoints: Point[], radius = 4): PathArray {
    return this.getKeyPath({
      ...this.parsedAttributes,
      controlPoints,
      radius,
      router: false,
    })
  }
}

describe('ranking graph arrow paths', () => {
  it('keeps a nonzero final segment when Dagre repeats the node boundaries', () => {
    const edge = new EdgeWithFixedEndpoints({
      style: { sourceNode: 'worse', targetNode: 'better' },
    })

    expect(edge.path([[86, 98], [86, 69], [86, 40]])).toEqual([
      ['M', 86, 98],
      ['L', 86, 69],
      ['L', 86, 40],
    ])
  })

  it('preserves rounded bends and the approach to the preferred node', () => {
    const edge = new EdgeWithFixedEndpoints({
      style: { sourceNode: 'worse', targetNode: 'better' },
    })
    edge.endpoints = [[20, 100], [80, 20]]
    const bends: Point[] = [[20, 70], [80, 50]]
    const expected = edge.path(bends)

    expect(edge.path([[20, 100], ...bends, [80, 20]])).toEqual(expected)
    expect(expected.some(([command]) => command === 'Q')).toBe(true)
    expect(expected.at(-1)).toEqual(['L', 80, 20])
    expect(expected.at(-2)).not.toEqual(expected.at(-1))
  })

  it('tolerates rounding at node boundaries', () => {
    const edge = new EdgeWithFixedEndpoints({
      style: { sourceNode: 'worse', targetNode: 'better' },
    })
    const path = edge.path([[86, 98 + 1e-10], [86, 69], [86, 40 + 1e-10]])

    expect(path).toHaveLength(3)
    expect(path.at(-2)).toEqual(['L', 86, 69])
  })

  it('keeps distinct nearby points and does not mutate the layout data', () => {
    const edge = new EdgeWithFixedEndpoints({
      style: { sourceNode: 'worse', targetNode: 'better' },
    })
    const points: Point[] = [[86, 98], [86, 69], [86, 40.001], [86, 40]]
    const original = structuredClone(points)

    expect(edge.path(points, 0)).toContainEqual(['L', 86, 40.001])
    expect(points).toEqual(original)
  })

  it('recomputes paths after updates and undo without accumulating corrections', () => {
    const edge = new EdgeWithFixedEndpoints({
      style: { sourceNode: 'worse', targetNode: 'better' },
    })
    const points: Point[] = [[86, 98], [86, 69], [86, 40]]
    const original = edge.path(points)

    edge.path([[86, 98], [100, 69], [86, 40]])

    expect(edge.path(points)).toEqual(original)
    expect(edge.path([])).toEqual([['M', 86, 98], ['L', 86, 40]])
  })
})
