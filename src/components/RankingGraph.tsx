import type { Graph as G6Graph, GraphData } from '@antv/g6'
import { useEffect, useMemo, useRef, useState } from 'react'
import { copyByLanguage, type Language } from '../i18n.ts'
import type { RankingGraph as RankingGraphData } from '../ranking/types.ts'
import './RankingGraph.css'

interface RankingGraphProps {
  readonly activeItemIds?: readonly string[]
  readonly graph: RankingGraphData
  readonly language: Language
}

interface GraphPalette {
  readonly accent: string
  readonly edge: string
  readonly edgeLatest: string
  readonly label: string
  readonly labelFontFamily: string
  readonly nodeFill: string
  readonly nodeStroke: string
}

interface RenderQueue {
  readonly graph: G6Graph
  destroyed: boolean
  lastRequestedData: GraphData | null
  pendingData: GraphData | null
  running: boolean
}

function getCssValue(styles: CSSStyleDeclaration, property: string, fallback: string): string {
  return styles.getPropertyValue(property).trim() || fallback
}

function readGraphPalette(container: HTMLElement): GraphPalette {
  const styles = getComputedStyle(container)

  return {
    accent: getCssValue(styles, '--graph-accent', '#2450e6'),
    edge: getCssValue(styles, '--graph-edge', '#777c74'),
    edgeLatest: getCssValue(styles, '--graph-edge-latest', '#2450e6'),
    label: getCssValue(styles, '--graph-label', '#1d211d'),
    labelFontFamily: getCssValue(
      styles,
      '--font-ui',
      '"Avenir Next", Avenir, ui-sans-serif, system-ui, sans-serif',
    ),
    nodeFill: getCssValue(styles, '--graph-node-fill', '#f8f5ec'),
    nodeStroke: getCssValue(styles, '--graph-node-stroke', '#7f847c'),
  }
}

async function createGraph(
  container: HTMLElement,
  palette: GraphPalette,
  prefersReducedMotion: boolean,
): Promise<G6Graph> {
  const { Graph } = await import('@antv/g6')

  return new Graph({
    container,
    data: { nodes: [], edges: [] },
    padding: 32,
    zoomRange: [0.45, 1.55],
    animation: prefersReducedMotion
      ? false
      : { duration: 340, easing: 'ease-out' },
    layout: {
      type: 'dagre',
      rankdir: 'BT',
      ranker: 'network-simplex',
      nodesep: 30,
      ranksep: 56,
      nodeSize: [172, 50],
      animation: !prefersReducedMotion,
    },
    node: {
      type: 'rect',
      style: {
        size: [172, 50],
        radius: 2,
        fill: palette.nodeFill,
        stroke: palette.nodeStroke,
        lineWidth: 1.25,
        labelText: (node) => {
          const label = node.data?.label
          return typeof label === 'string' ? label : node.id
        },
        labelPlacement: 'center',
        labelFill: palette.label,
        labelFontFamily: palette.labelFontFamily,
        labelFontSize: 14,
        labelFontWeight: 600,
        labelMaxWidth: 144,
        labelTextOverflow: 'ellipsis',
      },
      state: {
        current: {
          stroke: palette.accent,
          lineWidth: 2.5,
        },
      },
      animation: prefersReducedMotion
        ? false
        : { enter: 'fade', update: 'translate', exit: 'fade' },
    },
    edge: {
      type: 'polyline',
      style: {
        radius: 2,
        stroke: palette.edge,
        strokeOpacity: 0.48,
        lineWidth: 1.25,
        endArrow: true,
        endArrowType: 'triangle',
        endArrowSize: 8,
      },
      state: {
        latest: {
          stroke: palette.edgeLatest,
          strokeOpacity: 1,
          lineWidth: 2.5,
        },
      },
      animation: prefersReducedMotion
        ? false
        : { enter: 'fade', update: 'translate', exit: 'fade' },
    },
    behaviors: ['drag-canvas', 'zoom-canvas'],
  })
}

function enqueueRender(
  queue: RenderQueue,
  data: GraphData,
  prefersReducedMotion: boolean,
  onError: () => void,
): void {
  if (queue.destroyed || queue.lastRequestedData === data) {
    return
  }

  queue.lastRequestedData = data
  queue.pendingData = data

  if (queue.running) {
    return
  }

  queue.running = true

  const flush = async () => {
    try {
      while (!queue.destroyed && queue.pendingData !== null) {
        const nextData = queue.pendingData
        queue.pendingData = null
        queue.graph.setData(nextData)
        await queue.graph.render()

        if ((nextData.nodes?.length ?? 0) > 0) {
          await queue.graph.fitView(
            { when: 'always', direction: 'both' },
            prefersReducedMotion ? false : { duration: 260, easing: 'ease-out' },
          )
        }
      }
    } catch {
      if (!queue.destroyed) {
        onError()
      }
    } finally {
      queue.running = false
    }
  }

  void flush()
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [query])

  return matches
}

export function RankingGraph({
  activeItemIds = [],
  graph,
  language,
}: RankingGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<G6Graph | null>(null)
  const renderQueueRef = useRef<RenderQueue | null>(null)
  const latestDataRef = useRef<GraphData>({ nodes: [], edges: [] })
  const [hasRenderError, setHasRenderError] = useState(false)
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const activeItemIdSet = useMemo(() => new Set(activeItemIds), [activeItemIds])
  const graphData = useMemo<GraphData>(
    () => ({
      nodes: graph.nodes.map((node) => ({
        id: node.id,
        data: { label: node.label },
        states: activeItemIdSet.has(node.id) ? ['current'] : [],
      })),
      edges: graph.edges.map((edge) => ({
        id: edge.id,
        source: edge.sourceItemId,
        target: edge.targetItemId,
        states: edge.isLatest ? ['latest'] : [],
      })),
    }),
    [activeItemIdSet, graph.edges, graph.nodes],
  )
  const hasNodes = graph.nodes.length > 0
  const copy = copyByLanguage[language].graph

  useEffect(() => {
    latestDataRef.current = graphData
  }, [graphData])

  useEffect(() => {
    const container = containerRef.current
    if (container === null || !hasNodes) {
      return
    }

    let isCancelled = false
    let instance: G6Graph | null = null
    let queue: RenderQueue | null = null
    let resizeObserver: ResizeObserver | null = null

    const setup = async () => {
      try {
        const nextInstance = await createGraph(
          container,
          readGraphPalette(container),
          prefersReducedMotion,
        )

        if (isCancelled) {
          nextInstance.destroy()
          return
        }

        setHasRenderError(false)
        instance = nextInstance
        queue = {
          graph: nextInstance,
          destroyed: false,
          lastRequestedData: null,
          pendingData: null,
          running: false,
        }
        graphRef.current = nextInstance
        renderQueueRef.current = queue
        enqueueRender(queue, latestDataRef.current, prefersReducedMotion, () => {
          setHasRenderError(true)
        })

        resizeObserver = new ResizeObserver(() => nextInstance.resize())
        resizeObserver.observe(container)
      } catch {
        if (!isCancelled) {
          setHasRenderError(true)
        }
      }
    }

    void setup()

    return () => {
      isCancelled = true
      resizeObserver?.disconnect()

      if (queue !== null) {
        queue.destroyed = true
        queue.pendingData = null
      }
      instance?.destroy()

      if (instance !== null && graphRef.current === instance) {
        graphRef.current = null
      }
      if (queue !== null && renderQueueRef.current === queue) {
        renderQueueRef.current = null
      }
    }
  }, [hasNodes, prefersDarkMode, prefersReducedMotion])

  useEffect(() => {
    const queue = renderQueueRef.current
    if (queue !== null) {
      enqueueRender(queue, graphData, prefersReducedMotion, () => {
        setHasRenderError(true)
      })
    }
  }, [graphData, prefersReducedMotion])

  const changeZoom = (ratio: number) => {
    const instance = graphRef.current
    if (instance !== null) {
      void instance.zoomBy(
        ratio,
        prefersReducedMotion ? false : { duration: 180, easing: 'ease-out' },
      )
    }
  }

  const fitGraph = () => {
    const instance = graphRef.current
    if (instance !== null) {
      void instance.fitView(
        { when: 'always', direction: 'both' },
        prefersReducedMotion ? false : { duration: 220, easing: 'ease-out' },
      )
    }
  }

  const graphDescription = hasNodes
    ? copy.description(graph.nodes.length, graph.edges.length)
    : copy.emptyDescription

  return (
    <section className="graph-panel" aria-labelledby="graph-title">
      <div className="graph-panel__header">
        <div>
          <p className="section-kicker">{copy.kicker}</p>
          <h2 id="graph-title">{copy.title}</h2>
        </div>

        <div className="graph-controls" aria-label={copy.controlsLabel}>
          <button
            type="button"
            className="graph-control"
            onClick={() => changeZoom(0.82)}
            disabled={!hasNodes}
            aria-label={copy.zoomOut}
          >
            −
          </button>
          <button
            type="button"
            className="graph-control"
            onClick={() => changeZoom(1.22)}
            disabled={!hasNodes}
            aria-label={copy.zoomIn}
          >
            +
          </button>
          <button
            type="button"
            className="graph-control graph-control--fit"
            onClick={fitGraph}
            disabled={!hasNodes}
          >
            {copy.fit}
          </button>
        </div>
      </div>

      <div className="graph-stage">
        <div className="graph-canvas-frame">
          <div
            ref={containerRef}
            className="graph-canvas"
            role="img"
            aria-label={graphDescription}
          />
        </div>

        {!hasNodes && (
          <div className="graph-empty" aria-hidden="true">
            <span className="graph-empty__node graph-empty__node--top" />
            <span className="graph-empty__line" />
            <span className="graph-empty__node graph-empty__node--bottom" />
            <p>{copy.emptyMessage}</p>
          </div>
        )}

        {hasRenderError && (
          <p className="graph-error" role="status">
            {copy.renderError}
          </p>
        )}
      </div>

      <p className="graph-legend">
        <span aria-hidden="true">↑</span> {copy.legend}
      </p>
    </section>
  )
}
