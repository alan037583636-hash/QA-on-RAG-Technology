import { ArrowTrending20Regular, Database20Regular, DocumentBulletList20Regular, Filter20Regular } from '@fluentui/react-icons'
import { documents } from '../data/ragDemo'

type DashboardPanelProps = {
  k: number
  maxScore: number
  selectedCount: number
}

export default function DashboardPanel({ k, maxScore, selectedCount }: DashboardPanelProps) {
  const metrics = [
    { icon: <DocumentBulletList20Regular />, label: '已比對數量', value: documents.length.toString(), unit: '筆', note: '知識庫文件' },
    { icon: <ArrowTrending20Regular />, label: '最高分', value: maxScore.toFixed(2), unit: '', note: '最高 cosine score' },
    { icon: <Filter20Regular />, label: 'K 值設定', value: k.toString().padStart(2, '0'), unit: '筆', note: 'Top-K 容量' },
    { icon: <Database20Regular />, label: '被擠掉數量', value: (documents.length - selectedCount).toString().padStart(2, '0'), unit: '筆', note: '未進入 Top-K' },
  ]

  return (
    <section className="dashboard">
      <div className="section-title"><div><span className="section-kicker">OVERVIEW</span><h2>數據儀表板</h2></div><span className="updated-label"><i /> DEMO DATA</span></div>
      <div className="metric-grid">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <div className="metric-top"><span className="metric-icon">{metric.icon}</span><span className="metric-note">{metric.note}</span></div>
            <div className="metric-value">{metric.value}<small>{metric.unit}</small></div>
            <div className="metric-label">{metric.label}</div>
          </article>
        ))}
      </div>
    </section>
  )
}
