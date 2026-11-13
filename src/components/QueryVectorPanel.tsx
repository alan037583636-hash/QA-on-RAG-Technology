import { Button, Input } from '@fluentui/react-components'
import { ArrowUpRight20Regular, Sparkle20Regular } from '@fluentui/react-icons'
import { questionVector } from '../data/ragDemo'

type QueryVectorPanelProps = {
  question: string
  onQuestionChange: (value: string) => void
}

export default function QueryVectorPanel({ question, onQuestionChange }: QueryVectorPanelProps) {
  return (
    <section className="panel bg-white shadow-sm query-panel">
      <div className="panel-heading">
        <div className="heading-icon blue"><Sparkle20Regular /></div>
        <div><h2>查詢問題</h2><p>輸入問題，查看語意向量表示</p></div>
        <span className="step-pill">01 / QUERY</span>
      </div>
      <label className="field-label" htmlFor="question">自己問</label>
      <div className="query-input-row">
        <Input
          id="question"
          className="query-input"
          value={question}
          onChange={(_, data) => onQuestionChange(data.value)}
          aria-label="你的問題"
        />
        <Button appearance="primary" icon={<ArrowUpRight20Regular />} aria-label="開始檢索">開始檢索</Button>
      </div>
      <div className="vector-heading">
        <div><span className="tiny-label">QUESTION VECTOR</span><span className="vector-count">8 dimensions</span></div>
        <span className="vector-model">embedding · mock</span>
      </div>
      <div className="vector-grid">
        {questionVector.map(([word, value], index) => (
          <div className="vector-cell" key={word}>
            <span className="vector-index">D{String(index + 1).padStart(2, '0')}</span>
            <span className="vector-word">{word}</span>
            <strong>{value.toFixed(2)}</strong>
          </div>
        ))}
      </div>
      <div className="vector-caption"><span className="accent-square" /> 語意特徵以示意數值呈現，不會呼叫 embedding 服務。</div>
    </section>
  )
}
