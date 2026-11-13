import { Badge } from '@fluentui/react-components'

export default function DemoHeader() {
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
            <p>RAG 會先從外部知識庫檢索與問題相關的資料，再將資料與問題一併交給語言模型，讓回答更有根據。</p>
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
              <select id="k-value" defaultValue="2" className="k-select">
                {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <nav className="level-nav" aria-label="闖關關卡">
              {['基本完整流程', '換句話問', '有資料沒答案', '低相似度', '調整 K 值', '堆積替換', '完成挑戰'].map((level, index) => (
                <button type="button" className={`level-button ${index === 0 ? 'active' : ''}`} key={level} aria-current={index === 0 ? 'step' : undefined}>
                  <span>{index + 1}</span><span className="level-name">{level}</span>
                </button>
              ))}
            </nav>
          </div>
        </section>
      </main>
    </>
  )
}
