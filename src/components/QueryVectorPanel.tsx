import { Button, Input, Spinner } from '@fluentui/react-components'
import { ArrowUpRight20Regular, Sparkle20Regular } from '@fluentui/react-icons'

type QueryVectorPanelProps = {
  question: string
  queryVector: number[]
  isSearching: boolean
  onQuestionChange: (value: string) => void
  onSearch: () => void
}

export default function QueryVectorPanel({
  question,
  queryVector,
  isSearching,
  onQuestionChange,
  onSearch,
}: QueryVectorPanelProps) {
  const featureCells = queryVector.length > 0 ? queryVector.slice(0, 6) : [0]

  return (
    <section className="panel bg-white shadow-sm query-panel">
      <div className="panel-heading">
        <div className="heading-icon blue"><Sparkle20Regular /></div>
        <div><h2>查詢問題</h2><p>輸入問題，查看字元 n-gram 特徵</p></div>
        <span className="step-pill">01 / QUERY</span>
      </div>
      <label className="field-label" htmlFor="question">自己問</label>
      <div className="query-input-row">
        <Input
          id="question"
          className="query-input"
          value={question}
          disabled={isSearching}
          onChange={(_, data) => onQuestionChange(data.value)}
          aria-label="你的問題"
        />
        <Button
          appearance="primary"
          icon={isSearching ? <Spinner size="tiny" /> : <ArrowUpRight20Regular />}
          aria-label={isSearching ? '檢索中' : '開始檢索'}
          disabled={isSearching}
          onClick={onSearch}
        >
          {isSearching ? '檢索中...' : '開始檢索'}
        </Button>
      </div>
      <div className="vector-heading">
        <div><span className="tiny-label">CHAR N-GRAM TF-IDF</span><span className="vector-count">{featureCells.length} features</span></div>
        <span className="vector-model">bigram · tfidf</span>
      </div>
      <div className="vector-grid">
        {featureCells.map((value, index) => (
          <div className="vector-cell" key={`${value}-${index}`}>
            <span className="vector-index">F{String(index + 1).padStart(2, '0')}</span>
            <span className="vector-word">char-{index + 1}</span>
            <strong>{value.toFixed(2)}</strong>
          </div>
        ))}
      </div>
      <div className="vector-caption"><span className="accent-square" /> 使用字元 bi-gram TF-IDF 作為檢索特徵，避免僅用粗糙的 8 維關鍵字列舉。</div>
    </section>
  )
}
