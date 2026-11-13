import { selectedDocuments } from '../data/ragDemo'

export default function MinHeapPanel() {
  return (
    <section className="panel bg-white shadow-sm detail-panel heap-panel">
      <div className="compact-heading"><div><span className="section-kicker">SELECTION ALGORITHM</span><h2>Min-Heap · Top-K</h2></div><span className="heap-k">K = 2</span></div>
      <p className="panel-description">以容量 2 的最小堆保留目前相似度最高的文件。</p>
      <div className="heap-root-label"><span className="root-dot" /> 堆頂 · 目前最小分數 <b>0.91</b></div>
      <div className="heap-tree" aria-label="兩格陣列最小堆">
        <div className="heap-node root-node"><small className="heap-array-index">索引 0</small><span className="heap-doc">D9</span><strong>0.91</strong><small>堆頂</small></div>
        <div className="heap-node child-node"><small className="heap-array-index">索引 1</small><span className="heap-doc">D1</span><strong>0.96</strong><small>資料</small></div>
      </div>
      <div className="heap-explainer"><span className="heap-index">01</span><span>目前保留</span><b>{selectedDocuments.map((doc) => doc.id).join('、')}</b><span>兩篇 Top-K 文件</span></div>
      <div className="heap-note">遍歷其餘文件時，若新分數高於 root，便替換根節點並重新平衡。</div>
    </section>
  )
}
