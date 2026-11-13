import { selectedDocuments, question } from '../data/ragDemo'

const assembledPrompt = `你是一位親切、準確的公司新人報到助理。請只根據以下參考資料回答；若資料未提及，請清楚說明。\n\n[使用者問題]\n${question}\n\n[參考資料]\n${selectedDocuments.map((doc) => `[${doc.id}] ${doc.content}`).join('\n')}\n\n[回答要求]\n以繁體中文簡潔回答，並在相關資訊後標註來源文件編號。`

export default function PromptPanel() {
  return (
    <section className="panel bg-white shadow-sm detail-panel prompt-panel">
      <div className="compact-heading"><div><span className="section-kicker">GENERATION CONTEXT</span><h2>組合後的 Prompt</h2></div><span className="read-only"><i /> READ ONLY</span></div>
      <p className="panel-description">將問題與 Top-K 參考文件組合，作為生成階段的上下文。</p>
      <pre className="prompt-content">{assembledPrompt}</pre>
      <div className="prompt-footer"><span>UTF-8 · 繁體中文</span><span>{assembledPrompt.length} chars</span></div>
    </section>
  )
}
