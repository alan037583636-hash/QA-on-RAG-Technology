import { Badge } from '@fluentui/react-components'
import { ArrowRight20Regular } from '@fluentui/react-icons'
import type { RankedDocument } from '../data/ragEngine'

type RetrievalResultsProps = {
  selectedDocuments: RankedDocument[]
  threshold: number
}

export default function RetrievalResults({ selectedDocuments, threshold }: RetrievalResultsProps) {
  const groundedAnswer = selectedDocuments.length > 0
    ? selectedDocuments.map(({ document }) => `[${document.id}] ${document.content}`).join('\n')
    : `找不到相似度達到 ${threshold.toFixed(2)} 門檻的資料，請改寫問題或確認知識庫內容。`

  return (
    <section className="panel bg-white shadow-sm results-panel">
      <div className="panel-heading results-heading">
        <div className="heading-icon violet"><ArrowRight20Regular /></div>
        <div><h2>輸出結果</h2><p>有檢索依據與無檢索依據的回答對照</p></div>
        <Badge appearance="tint" color={selectedDocuments.length > 0 ? 'success' : 'informative'}>
          {selectedDocuments.length} 篇已選取
        </Badge>
      </div>
      <div className="answer-cards">
        <article className="answer-card with-rag">
          <div className="answer-card-top">
            <span>有 RAG 的回答</span>
            <span>{selectedDocuments.map(({ document }) => <b key={document.id}>{document.id}</b>)}</span>
          </div>
          <p className="answer-reference">{groundedAnswer}</p>
        </article>
        <article className="answer-card without-rag">
          <div className="answer-card-top"><span>沒有 RAG 的回答 (幻覺示範)</span></div>
          <p>請於上午 09:00 到 15B 廠區報到，並攜帶健保卡與銀行存摺。此回答沒有參考知識庫，內容可能不正確。</p>
        </article>
      </div>
      <div className="disclaimer"><span>ⓘ</span> RAG 區塊展示本次實際檢索到的參考內容；不連接外部 LLM。</div>
    </section>
  )
}
