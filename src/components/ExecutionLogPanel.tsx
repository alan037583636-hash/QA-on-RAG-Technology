import { historyItems } from '../data/ragDemo'
import type { ExecutionStep } from '../data/ragEngine'

type ExecutionLogPanelProps = {
  steps: ExecutionStep[]
}

export default function ExecutionLogPanel({ steps }: ExecutionLogPanelProps) {
  return (
    <section className="panel bg-white shadow-sm detail-panel log-panel">
      <div className="compact-heading"><div><span className="section-kicker">PIPELINE</span><h2>執行紀錄</h2></div><span className="mock-badge">LIVE SIMULATION</span></div>
      <div className="execution-log custom-scrollbar" aria-label="檢索動畫歷程">
        {steps.map((step, index) => (
          <div className="log-entry" key={step.time}>
            <span className={`log-node ${index === steps.length - 1 ? 'complete' : ''}`} />
            <span className="log-time">{step.time}</span>
            <div><strong>{step.title}</strong><p>{step.detail}</p></div>
            <span className="log-done">{step.title}</span>
          </div>
        ))}
      </div>
      <div className="history-heading"><span>最近查詢</span><span>本機示範紀錄</span></div>
      <div className="history-list custom-scrollbar">
        {historyItems.map((item) => (
          <div className="history-item" key={item.time}>
            <span className="history-time">{item.time}</span><p>{item.text}</p><span className="history-count">{item.count}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
