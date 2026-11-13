import { Badge } from '@fluentui/react-components'
import { ArrowRight20Regular } from '@fluentui/react-icons'

type RetrievalResultsProps = {
  answer: string
  isGenerating: boolean
  isPromptReady: boolean
  isSearching: boolean
}

export default function RetrievalResults({ answer, isGenerating, isPromptReady, isSearching }: RetrievalResultsProps) {
  return (
    <section className="panel bg-white shadow-sm results-panel">
      <div className="panel-heading results-heading">
        <div className="heading-icon violet"><ArrowRight20Regular /></div>
        <div><h2>輸出結果</h2><p>有檢索依據與無檢索依據的回答對照</p></div>
        <Badge appearance="tint" color="success">Mock LLM</Badge>
      </div>
      <div className="answer-cards">
        <article className="answer-card with-rag">
          <div className="answer-card-top">
            <span>有 RAG 的回答</span>
          </div>
          <p className="answer-reference" aria-live="polite">
            {answer || (
              isGenerating
                ? '正在生成回答...'
                : isPromptReady
                  ? '參考資料已組裝，準備生成回答...'
                  : isSearching
                    ? '正在逐步檢索知識庫...'
                    : '按下「開始檢索」以產生回答。'
            )}
            {isGenerating && <span className="typing-cursor" aria-hidden="true">▍</span>}
          </p>
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
