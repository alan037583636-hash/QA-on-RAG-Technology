import type { RankedDocument } from '../data/ragEngine'

type MinHeapPanelProps = {
  heap: RankedDocument[]
  k: number
}

export default function MinHeapPanel({ heap, k }: MinHeapPanelProps) {
  const root = heap[0]

  return (
    <section className="panel bg-white shadow-sm detail-panel heap-panel">
      <div className="compact-heading"><div><span className="section-kicker">SELECTION ALGORITHM</span><h2>Min-Heap · Top-K</h2></div><span className="heap-k">K = {k}</span></div>
      <p className="panel-description">以容量 {k} 的最小堆保留目前相似度最高的文件。</p>
      <div className="heap-root-label">
        <span className="root-dot" />
        堆頂 · 目前最小分數
        <b>{root ? root.score.toFixed(4) : '—'}</b>
      </div>
      <div className="heap-tree" aria-label="最小堆陣列">
        {heap.length > 0 ? heap.map(({ document, score }, index) => (
          <div className={`heap-node ${index === 0 ? 'root-node' : 'child-node'}`} key={document.id}>
            <small className="heap-array-index">索引 {index}</small>
            <span className="heap-doc">{document.id}</span>
            <strong>{score.toFixed(4)}</strong>
            <small>{index === 0 ? '堆頂' : '資料'}</small>
          </div>
        )) : <p className="heap-empty">沒有文件通過相似度門檻</p>}
      </div>
      <div className="heap-explainer">
        <span className="heap-index">ARRAY</span><span>目前保留</span>
        <b>{heap.map(({ document }) => document.id).join('、') || '無'}</b>
        <span>{heap.length} 筆</span>
      </div>
      <div className="heap-note">遍歷文件時，若新分數高於堆頂，便替換根節點並重新平衡。</div>
    </section>
  )
}
