import { Badge } from '@fluentui/react-components'
import { Database20Regular, CheckmarkCircle20Filled } from '@fluentui/react-icons'
import type { RankedDocument } from '../data/ragEngine'

type KnowledgeBasePanelProps = {
  results: RankedDocument[]
  threshold: number
}

export default function KnowledgeBasePanel({ results, threshold }: KnowledgeBasePanelProps) {
  return (
    <section className="panel bg-white shadow-sm knowledge-panel">
      <div className="panel-heading">
        <div className="heading-icon teal"><Database20Regular /></div>
        <div><h2>知識庫文件</h2><p>新人報到手冊 · 靜態資料集</p></div>
        <div className="knowledge-count"><strong>10</strong><span>DOCUMENTS</span></div>
      </div>
      <div className="document-scroll custom-scrollbar" aria-label="知識庫文件清單">
        {results.map(({ document: doc, score, selected }) => (
          <article className={`document-card ${selected ? 'is-selected' : ''}`} key={doc.id}>
            <div className="document-topline">
              <span className="document-id">{doc.id}</span>
              <Badge appearance="tint" color={selected ? 'success' : 'informative'}>{doc.category}</Badge>
              <span className={`document-status ${selected ? 'adopted' : 'rejected'}`}>
                {selected && <CheckmarkCircle20Filled aria-hidden="true" />}
                {selected ? '採用' : '淘汰'}
              </span>
            </div>
            <p>{doc.content}</p>
            <div className="score-row">
              <span>相似度</span>
              <div className="score-track"><i style={{ width: `${score * 100}%` }} /></div>
              <strong className={selected ? 'score-selected' : ''}>{score.toFixed(2)}</strong>
              {selected && <span className="retrieved-tag">TOP-K</span>}
            </div>
          </article>
        ))}
      </div>
      <div className="knowledge-footer">
        <span><i className="legend-selected" /> 已進入 Top-K</span>
        <span>門檻 {threshold.toFixed(2)} · 依相似度排序</span>
      </div>
    </section>
  )
}
