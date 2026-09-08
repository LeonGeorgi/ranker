import { ExtensionCategory, Polyline, register, type Point, type PolylineStyleProps } from '@antv/g6'

export class RankingGraphEdge extends Polyline {
  protected override getPoints(attributes: Required<PolylineStyleProps>): Point[] {
    // G6 5.1.1 passes Dagre's endpoints as control points, then adds them again.
    // A zero-length final segment makes the arrow face sideways. Allow for
    // rounding when the node boundary is calculated again during layout.
    return super.getPoints(attributes).filter((point, index, points) => {
      const previous = points[index - 1]
      return previous === undefined || point.slice(0, 2).some(
        (coordinate, axis) => Math.abs(coordinate - (previous[axis] ?? Infinity)) > 1e-6,
      )
    })
  }
}

register(ExtensionCategory.EDGE, 'ranking-polyline', RankingGraphEdge)
