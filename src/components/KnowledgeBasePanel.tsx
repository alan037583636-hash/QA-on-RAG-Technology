import { Badge } from '@fluentui/react-components'
import { Database20Regular, CheckmarkCircle20Filled } from '@fluentui/react-icons'
import { documents } from '../data/ragDemo'

export default function KnowledgeBasePanel() {
  return (
    <section className="panel bg-white shadow-sm knowledge-panel">
      <div className="panel-heading">
        <div className="heading-icon teal"><Database20Regular /></div>
        <div><h2>知識庫文件</h2><p>新人報到手冊 · 靜態資料集</p></div>
        <div className="knowledge-count"><strong>10</strong><span>DOCUMENTS</span></div>
      </div>
      <div className="document-scroll custom-scrollbar" aria-label="知識庫文件清單">
        {documents.map((doc) => (
          <article className={`document-card ${doc.selected ? 'is-selected' : ''}`} key={doc.id}>
            <div className="document-topline">
              <span className="document-id">{doc.id}</span>
              <Badge appearance="tint" color={doc.selected ? 'success' : 'informative'}>{doc.category}</Badge>
              <span className={`document-status ${doc.selected ? 'adopted' : 'rejected'}`}>
                {doc.selected && <CheckmarkCircle20Filled aria-hidden="true" />}
                {doc.selected ? '採用' : '淘汰'}
              </span>
            </div>
            <p>{doc.content}</p>
            <div className="score-row">
              <span>相似度</span>
              <div className="score-track"><i style={{ width: `${doc.score * 100}%` }} /></div>
              <strong className={doc.selected ? 'score-selected' : ''}>{doc.score.toFixed(2)}</strong>
              {doc.selected && <span className="retrieved-tag">TOP-K</span>}
            </div>
          </article>
        ))}
      </div>
      <div className="knowledge-footer"><span><i className="legend-selected" /> 已進入 Top-K</span><span>依相似度排序 · 高至低</span></div>
    </section>
  )
}
