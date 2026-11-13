import { useState } from 'react'
import { Beaker20Regular } from '@fluentui/react-icons'
import { question as initialQuestion, scenarios, type TrainingScenario } from './data/ragDemo'
import { runRetrieval } from './data/ragEngine'
import DemoHeader from './components/DemoHeader'
import QueryVectorPanel from './components/QueryVectorPanel'
import KnowledgeBasePanel from './components/KnowledgeBasePanel'
import RetrievalResults from './components/RetrievalResults'
import DashboardPanel from './components/DashboardPanel'
import ExecutionLogPanel from './components/ExecutionLogPanel'
import MinHeapPanel from './components/MinHeapPanel'
import PromptPanel from './components/PromptPanel'

export default function App() {
  const [question, setQuestion] = useState(initialQuestion)
  const [k, setK] = useState(scenarios[0].k)
  const [activeScenarioId, setActiveScenarioId] = useState<number | null>(scenarios[0].id)
  const [retrieval, setRetrieval] = useState(() => runRetrieval(initialQuestion, scenarios[0].k))

  const executeSearch = (searchQuestion: string, searchK: number) => {
    setRetrieval(runRetrieval(searchQuestion, searchK))
  }

  const selectScenario = (scenario: TrainingScenario) => {
    setQuestion(scenario.question)
    setK(scenario.k)
    setActiveScenarioId(scenario.id)
    executeSearch(scenario.question, scenario.k)
  }

  const changeK = (nextK: number) => {
    setK(nextK)
    setActiveScenarioId(null)
    executeSearch(question, nextK)
  }

  return (
    <div className="app min-h-screen bg-slate-50 text-ink">
      <DemoHeader
        activeScenarioId={activeScenarioId}
        k={k}
        onKChange={changeK}
        onScenarioSelect={selectScenario}
      />
      <div className="page-shell workspace">
        <div className="primary-grid">
          <div className="left-column">
            <QueryVectorPanel
              question={question}
              queryVector={retrieval.queryVector}
              onSearch={() => executeSearch(question, k)}
              onQuestionChange={(value) => {
                setQuestion(value)
                setActiveScenarioId(null)
              }}
            />
            <KnowledgeBasePanel results={retrieval.results} threshold={retrieval.threshold} />
            <RetrievalResults selectedDocuments={retrieval.selectedDocuments} threshold={retrieval.threshold} />
          </div>
          <div className="right-column">
            <DashboardPanel k={retrieval.k} maxScore={retrieval.maxScore} selectedCount={retrieval.selectedDocuments.length} />
            <ExecutionLogPanel steps={retrieval.logs} />
            <MinHeapPanel heap={retrieval.heap} k={retrieval.k} />
            <PromptPanel question={retrieval.question} selectedDocuments={retrieval.selectedDocuments} />
          </div>
        </div>
      </div>
      <footer className="app-footer">
        <span><span className="footer-mark"><Beaker20Regular /></span> RAG Playground <span className="footer-separator">/</span> Onboarding Knowledge Assistant</span>
        <span>純前端互動示範 <i /> 不連接 API 或外部服務</span>
      </footer>
    </div>
  )
}
