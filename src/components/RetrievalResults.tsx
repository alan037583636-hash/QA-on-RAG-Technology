import { Badge } from '@fluentui/react-components'
import { ArrowRight20Regular } from '@fluentui/react-icons'
import { answerCards } from '../data/ragDemo'

export default function RetrievalResults() {
  return (
    <section className="panel bg-white shadow-sm results-panel">
      <div className="panel-heading results-heading">
        <div className="heading-icon violet"><ArrowRight20Regular /></div>
        <div><h2>輸出結果</h2><p>有檢索依據與無檢索依據的回答對照</p></div>
        <Badge appearance="tint" color="success">2 篇已選取</Badge>
      </div>
      <div className="answer-cards">
        {answerCards.map((answer) => (
          <article className={`answer-card ${answer.kind}`} key={answer.label}>
            <div className="answer-card-top"><span>{answer.label}</span><span>{answer.sources.map((source) => <b key={source}>{source}</b>)}</span></div>
            <p>{answer.text}</p>
          </article>
        ))}
      </div>
      <div className="disclaimer"><span>ⓘ</span> 無 RAG 範例為虛構示意；正確回答以知識庫文件為準。</div>
    </section>
  )
}
