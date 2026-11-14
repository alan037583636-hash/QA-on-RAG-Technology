import { Button, Input, Spinner } from '@fluentui/react-components'
import { ArrowUpRight20Regular, Sparkle20Regular } from '@fluentui/react-icons'
import { getQuestionFeatureTerms } from '../data/ragEngine'

type QueryVectorPanelProps = {
  question: string
  queryVectors: number[][]
  isSearching: boolean
  onQuestionChange: (value: string) => void
  onSearch: () => void
}

export default function QueryVectorPanel({
  question,
  queryVectors,
  isSearching,
  onQuestionChange,
  onSearch,
}: QueryVectorPanelProps) {
  const featureTerms = getQuestionFeatureTerms(question)
  const featureCells = queryVectors.map((queryVector) =>
    queryVector
      .flatMap((value, index) => value > 0
        ? [{ term: featureTerms[index] ?? `feature-${index + 1}`, value, index }]
        : [])
      .slice(0, 6),
  )
  const visibleFeatureCount = featureCells.reduce((sum, cells) => sum + cells.length, 0)

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
        <div><span className="tiny-label">CHAR N-GRAM TF-IDF</span><span className="vector-count">{queryVectors.length} 個子問題 · 顯示 {visibleFeatureCount} 個特徵</span></div>
        <span className="vector-model">bigram · tfidf</span>
      </div>
      {featureCells.length > 0 ? featureCells.map((cells, clauseIndex) => (
        <div className="vector-grid" key={`clause-${clauseIndex}`} aria-label={`子問題 ${clauseIndex + 1} 的 TF-IDF 特徵`}>
          {cells.map(({ term, value, index }) => (
            <div className="vector-cell" key={`${term}-${index}`}>
              <span className="vector-index">F{String(index + 1).padStart(2, '0')}</span>
              <span className="vector-word">{term}</span>
              <strong>{value.toFixed(4)}</strong>
            </div>
          ))}
        </div>
      )) : <span className="vector-word">輸入問題後顯示特徵</span>}
      <div className="vector-caption"><span className="accent-square" /> 顯示每個子問題實際用於 TF-IDF 餘弦計分的特徵與權重。</div>
    </section>
  )
}
