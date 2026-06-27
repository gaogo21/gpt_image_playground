import { useEffect, useMemo, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  MarkerType,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useReactFlow,
  useViewport,
  type Edge,
  type Node,
  type OnNodeDrag,
} from '@xyflow/react'
import { useStore } from '../store'
import { buildCanvasGraph, type CanvasGraphNodeData } from '../lib/canvasGraph'
import {
  clearCanvasLayoutPositions,
  mergeCanvasLayoutPositions,
  readCanvasLayoutPositions,
  setCanvasLayoutPosition,
  writeCanvasLayoutPositions,
  type CanvasLayoutPositions,
} from '../lib/canvasLayout'
import CanvasNode from './CanvasNode'
import { ChevronLeftIcon, ChevronRightIcon, RefreshIcon } from './icons'
import '@xyflow/react/dist/style.css'

type CanvasNodeType = Node<CanvasGraphNodeData, 'canvasTask'>

function getCanvasLayoutStorage() {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

function CanvasViewportToolbar({
  nodeCount,
  edgeCount,
  hasGraph,
  hasManualLayout,
  onResetLayout,
}: {
  nodeCount: number
  edgeCount: number
  hasGraph: boolean
  hasManualLayout: boolean
  onResetLayout: () => void
}) {
  const { zoomIn, zoomOut, fitView } = useReactFlow<CanvasNodeType, Edge>()
  const { zoom } = useViewport()

  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-full border border-white/10 bg-[#0c0f15]/92 px-2 py-2 text-slate-200 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <button
        type="button"
        onClick={() => void zoomOut({ duration: 180 })}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-white/[0.04] text-slate-200 transition hover:border-white/15 hover:bg-white/[0.07]"
        aria-label="缩小"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      <div className="inline-flex h-9 min-w-16 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300">
        {Math.round(zoom * 100)}%
      </div>
      <button
        type="button"
        onClick={() => void zoomIn({ duration: 180 })}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-white/[0.04] text-slate-200 transition hover:border-white/15 hover:bg-white/[0.07]"
        aria-label="放大"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => void fitView({ padding: 0.18, duration: 240 })}
        className="inline-flex h-9 min-w-16 items-center justify-center rounded-full border border-white/8 bg-white/[0.04] px-3 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-300 transition hover:border-white/15 hover:bg-white/[0.07]"
        aria-label="适配画布"
        disabled={!hasGraph}
      >
        Fit view
      </button>
      <button
        type="button"
        onClick={onResetLayout}
        className="inline-flex h-9 items-center justify-center rounded-full border border-white/8 bg-white/[0.04] px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300 transition hover:border-white/15 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-45"
        aria-label="重置布局"
        disabled={!hasGraph || !hasManualLayout}
      >
        <RefreshIcon className="mr-1.5 h-4 w-4" />
        Reset layout
      </button>
      <div className="ml-1 hidden items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-400 sm:flex">
        <span>{nodeCount} 节点</span>
        <span className="text-slate-600">/</span>
        <span>{edgeCount} 边</span>
      </div>
    </div>
  )
}

function CanvasWorkspaceSurface() {
  const tasks = useStore((s) => s.tasks)
  const searchQuery = useStore((s) => s.searchQuery)
  const filterStatus = useStore((s) => s.filterStatus)
  const filterFavorite = useStore((s) => s.filterFavorite)
  const activeFavoriteCollectionId = useStore((s) => s.activeFavoriteCollectionId)
  const setDetailTaskId = useStore((s) => s.setDetailTaskId)

  const graph = useMemo(() => buildCanvasGraph(tasks, {
    searchQuery,
    filterStatus,
    filterFavorite,
    activeFavoriteCollectionId,
  }), [tasks, searchQuery, filterStatus, filterFavorite, activeFavoriteCollectionId])

  const nodeTypes = useMemo(() => ({ canvasTask: CanvasNode }), [])
  const [layoutPositions, setLayoutPositions] = useState<CanvasLayoutPositions>(() => readCanvasLayoutPositions(getCanvasLayoutStorage()))
  const baseNodes = useMemo<CanvasNodeType[]>(
    () => graph.nodes.map((node) => ({ ...node, draggable: true })),
    [graph.nodes],
  )
  const mergedNodes = useMemo<CanvasNodeType[]>(
    () => mergeCanvasLayoutPositions(baseNodes, layoutPositions),
    [baseNodes, layoutPositions],
  )
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNodeType>(mergedNodes)
  const hasGraph = nodes.length > 0
  const hasManualLayout = Object.keys(layoutPositions).length > 0

  useEffect(() => {
    setNodes(mergedNodes)
  }, [mergedNodes, setNodes])

  const handleNodeClick = (_: React.MouseEvent, node: CanvasNodeType) => {
    setDetailTaskId(node.id)
  }

  const handleNodeDragStop: OnNodeDrag<CanvasNodeType> = (_, node) => {
    setLayoutPositions((current) => {
      const next = setCanvasLayoutPosition(current, node.id, node.position)
      if (next === current) return current

      if (!writeCanvasLayoutPositions(getCanvasLayoutStorage(), next)) {
        setNodes(mergedNodes)
        return current
      }

      return next
    })
  }

  const handleResetLayout = () => {
    setLayoutPositions((current) => {
      if (Object.keys(current).length === 0) return current
      clearCanvasLayoutPositions(getCanvasLayoutStorage())
      return {}
    })
  }

  return (
    <section className="canvas-shell relative mt-4 min-h-[calc(100vh-220px)] overflow-hidden rounded-[30px] border border-white/10 text-white shadow-[0_28px_110px_rgba(0,0,0,0.48)]">
      <div className="pointer-events-none absolute inset-0 canvas-shell-backdrop" />
      <div className="pointer-events-none absolute inset-0 canvas-shell-grid opacity-55" />

      <div className="relative h-[calc(100vh-220px)] min-h-[36rem]">
        <ReactFlow
          nodes={nodes}
          edges={graph.edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onNodeClick={handleNodeClick}
          onNodeDragStop={handleNodeDragStop}
          fitView
          fitViewOptions={{ padding: 0.18, minZoom: 0.2, maxZoom: 1.2 }}
          nodesDraggable={hasGraph}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag
          panOnScroll
          zoomOnScroll
          zoomOnPinch
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: 'smoothstep',
            style: {
              stroke: 'rgba(96, 165, 250, 0.28)',
              strokeWidth: 1.6,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: 'rgba(96, 165, 250, 0.35)',
            },
          }}
          className="canvas-flow h-full w-full bg-transparent"
        >
          <Background
            id="canvas-bg"
            variant={BackgroundVariant.Dots}
            gap={28}
            size={1}
            color="rgba(148, 163, 184, 0.16)"
          />
          <Panel position="top-right" className="m-4">
            <CanvasViewportToolbar
              nodeCount={nodes.length}
              edgeCount={graph.edges.length}
              hasGraph={hasGraph}
              hasManualLayout={hasManualLayout}
              onResetLayout={handleResetLayout}
            />
          </Panel>
          <Panel position="top-left" className="m-4 max-w-[20rem]">
            <div className="pointer-events-auto rounded-[22px] border border-white/10 bg-[#0c0f15]/80 px-4 py-3 text-slate-200 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Canvas Mode</div>
              <div className="mt-1 text-sm font-semibold text-white">TaskRecord lineage board</div>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                拖拽节点做本地排布，点击节点打开详情。任务关系仍然来自现有历史、收藏和 Agent 数据。
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-300">
                <span className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1">{nodes.length} 节点</span>
                <span className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1">{graph.edges.length} 边</span>
                {hasManualLayout && <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-2.5 py-1 text-sky-200">本地布局已启用</span>}
                {searchQuery.trim() && <span className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1">搜索中</span>}
                {filterFavorite && <span className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1">收藏过滤</span>}
              </div>
            </div>
          </Panel>

          {!hasGraph && (
            <Panel position="bottom-center" className="pointer-events-none mb-6">
              <div className="pointer-events-auto max-w-md rounded-[28px] border border-white/10 bg-[#0c0f15]/90 px-6 py-5 text-center text-slate-300 shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <div className="text-sm font-semibold text-white">画布里还没有节点</div>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  这里会把现有任务展开成无限画布。若当前搜索或收藏筛选过窄，先放宽筛选再试。
                </p>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </section>
  )
}

export default function CanvasWorkspace() {
  return (
    <ReactFlowProvider>
      <CanvasWorkspaceSurface />
    </ReactFlowProvider>
  )
}
