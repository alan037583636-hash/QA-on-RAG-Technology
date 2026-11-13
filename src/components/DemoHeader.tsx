import { Badge } from '@fluentui/react-components'
import { scenarios, type TrainingScenario } from '../data/ragDemo'

type DemoHeaderProps = {
  activeScenarioId: number | null
  k: number
  isSearching: boolean
  onKChange: (value: number) => void
  onScenarioSelect: (scenario: TrainingScenario) => void
}

export default function DemoHeader({
  activeScenarioId,
  k,
  isSearching,
  onKChange,
  onScenarioSelect,
}: DemoHeaderProps) {
  const activeScenario: TrainingScenario | undefined = scenarios.find(
    ({ id }) => id === activeScenarioId,
  )

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">R</div>
          <span>知識工作台</span>
          <span className="brand-divider" />
          <span className="brand-section">AI Lab</span>
        </div>
        <div className="topbar-right">
          <span className="live-dot" /> 靜態示範環境
          <div className="avatar">林</div>
        </div>
      </header>
      <main className="page-shell">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> RETRIEVAL AUGMENTED GENERATION</div>
            <h1>RAG 科技廠區新人問答</h1>
            <p className="rag-concept">
              語言模型的知識受限於訓練資料，無法掌握私有或最新的資訊，也可能生成看似合理但錯誤的內容 (幻覺)。RAG (檢索增強生成) 的概念是：在讓模型生成答案前，先將使用者的問題轉為向量，從外部知識庫找出最相似的資料段落，最後把這些段落當作『參考資料』餵給模型，限制它只能根據這些資料來回答，從而解決幻覺與私有資料的問題。
            </p>
            <div className="tech-tags" aria-label="技術標籤">
              <Badge appearance="outline" color="informative">核心結構：向量 + 最小堆積</Badge>
              <Badge appearance="outline" color="informative">難度：中等</Badge>
              <Badge appearance="outline" color="informative">時間複雜度：O(n log k)</Badge>
              <Badge appearance="outline" color="informative">空間複雜度：O(k)</Badge>
            </div>
          </div>
          <div className="hero-side">
            <div className="mode-switch" aria-label="模式切換">
              <button type="button" className="mode-button active" aria-pressed="true">演示模式</button>
              <button type="button" className="mode-button" aria-pressed="false">闖關模式</button>
            </div>
            <label className="k-select-label" htmlFor="k-value">K 值
              <select
                id="k-value"
                value={k}
                className="k-select"
                disabled={isSearching}
                onChange={(event) => onKChange(Number(event.currentTarget.value))}
              >
                {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          </div>
        </section>
        <nav className="scenario-nav" aria-label="情境關卡">
          {scenarios.map((scenario) => (
            <button
              type="button"
              className={`scenario-button ${activeScenarioId === scenario.id ? 'active' : ''}`}
              key={scenario.id}
              aria-pressed={activeScenarioId === scenario.id}
              disabled={isSearching}
              onClick={() => onScenarioSelect(scenario)}
            >
              <span className="scenario-number">{scenario.id}</span>
              <span className="scenario-label">
                <strong>{scenario.title}</strong>
                <small>{scenario.subtitle}</small>
              </span>
            </button>
          ))}
        </nav>
        {activeScenario && (
          <p className="scenario-description" aria-live="polite">
            <strong>關卡 {activeScenario.id}｜{activeScenario.title}：</strong>
            {activeScenario.description}
          </p>
        )}
      </main>
    </>
  )
}
