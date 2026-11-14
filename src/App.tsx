import { useRef, useState } from 'react'
import { Beaker20Regular } from '@fluentui/react-icons'
import { documents, question as initialQuestion, scenarios, type TrainingScenario } from './data/ragDemo'
import {
  getQuestionFeatureVectors,
  mockLlmAnswer,
  runRetrieval,
  scoreDocuments,
  simulateTopK,
  type RetrievalRun,
} from './data/ragEngine'
import DemoHeader from './components/DemoHeader'
import QueryVectorPanel from './components/QueryVectorPanel'
import KnowledgeBasePanel from './components/KnowledgeBasePanel'
import RetrievalResults from './components/RetrievalResults'
import DashboardPanel from './components/DashboardPanel'
import ExecutionLogPanel from './components/ExecutionLogPanel'
import MinHeapPanel from './components/MinHeapPanel'
import PromptPanel from './components/PromptPanel'

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

type SearchPhase = 'vectorizing' | 'scoring' | 'retrieving' | 'prompt' | 'generating' | 'complete' | 'error'
type AnimatedRetrieval = RetrievalRun & {
  phase: SearchPhase
  checkedCount: number
  excludedCount: number
  answer: string
}

export default function App() {
  const [question, setQuestion] = useState(initialQuestion)
  const [k, setK] = useState(scenarios[0].k)
  const [activeScenarioId, setActiveScenarioId] = useState<number | null>(scenarios[0].id)
  const [isSearching, setIsSearching] = useState(false)
  const searchLock = useRef(false)
  const [retrieval, setRetrieval] = useState<AnimatedRetrieval>(() => {
    const initialRun = runRetrieval(initialQuestion, scenarios[0].k)
    return {
      ...initialRun,
      phase: 'complete',
      checkedCount: documents.length,
      excludedCount: documents.length - initialRun.selectedDocuments.length,
      answer: mockLlmAnswer(initialQuestion, initialRun.selectedDocuments),
    }
  })

  const handleSearch = async (searchQuestion: string, searchK: number) => {
    if (searchLock.current) return

    searchLock.current = true
    setIsSearching(true)
    setRetrieval((current) => ({
      ...current,
      question: searchQuestion,
      queryVectors: getQuestionFeatureVectors(searchQuestion),
      results: [],
      selectedDocuments: [],
      heap: [],
      logs: [],
      maxScore: 0,
      checkedCount: 0,
      excludedCount: 0,
      answer: '',
      phase: 'vectorizing',
      k: searchK,
    }))

    try {
      await delay(600)
      setRetrieval((current) => ({ ...current, phase: 'scoring' }))
      await delay(600)
      const analysis = scoreDocuments(searchQuestion, searchK)
      setRetrieval((current) => ({ ...current, queryVectors: analysis.queryVectors }))
      const sortedScores = [...analysis.scoredDocuments].sort(
        (left, right) => right.score - left.score || left.document.id.localeCompare(right.document.id),
      )
      setRetrieval((current) => ({
        ...current,
        results: sortedScores,
        phase: 'retrieving',
      }))

      const simulation = simulateTopK(analysis.scoredDocuments, analysis.k)
      let outcome = simulation.next()
      while (outcome.done === false) {
        const step = outcome.value
        await delay(300)
        setRetrieval((current) => ({
          ...current,
          logs: [...current.logs, step.log],
          checkedCount: step.checkedCount,
          maxScore: step.maxScore,
          excludedCount: step.checkedCount - step.heap.length,
          heap: step.heap,
          phase: 'retrieving',
        }))
        outcome = simulation.next()
      }
      const plan = outcome.value

      await delay(800)
      setRetrieval((current) => ({
        ...current,
        results: plan.results,
        selectedDocuments: plan.selectedDocuments,
        heap: plan.heap,
        excludedCount: documents.length - plan.selectedDocuments.length,
        logs: [...current.logs, plan.promptLog],
        phase: 'prompt',
      }))

      await delay(300)
      setRetrieval((current) => ({ ...current, answer: '', phase: 'generating' }))
      const answer = mockLlmAnswer(searchQuestion, plan.selectedDocuments)
      for (const character of Array.from(answer)) {
        await delay(18)
        setRetrieval((current) => ({ ...current, answer: current.answer + character }))
      }

      setRetrieval((current) => ({
        ...current,
        logs: [...current.logs, plan.doneLog],
        phase: 'complete',
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('RAG retrieval animation failed.', error)
      setRetrieval((current) => ({
        ...current,
        phase: 'error',
        answer: `檢索失敗：${message}`,
      }))
    } finally {
      searchLock.current = false
      setIsSearching(false)
    }
  }

  const selectScenario = (scenario: TrainingScenario) => {
    if (searchLock.current) return
    setQuestion(scenario.question)
    setK(scenario.k)
    setActiveScenarioId(scenario.id)
    void handleSearch(scenario.question, scenario.k)
  }

  const changeK = (nextK: number) => {
    if (searchLock.current) return
    setK(nextK)
    setActiveScenarioId(null)
    void handleSearch(question, nextK)
  }

  return (
    <div className="app min-h-screen bg-slate-50 text-ink">
      <DemoHeader
        activeScenarioId={activeScenarioId}
        k={k}
        isSearching={isSearching}
        onKChange={changeK}
        onScenarioSelect={selectScenario}
      />
      <div className="page-shell workspace">
        <div className="primary-grid">
          <div className="left-column">
            <QueryVectorPanel
              question={question}
              queryVectors={retrieval.queryVectors}
              isSearching={isSearching}
              onSearch={() => void handleSearch(question, k)}
              onQuestionChange={(value) => {
                setQuestion(value)
                setActiveScenarioId(null)
                setRetrieval((current) => ({
                  ...current,
                  question: value,
                  queryVectors: getQuestionFeatureVectors(value),
                  results: [],
                  selectedDocuments: [],
                  heap: [],
                  logs: [],
                  maxScore: 0,
                  checkedCount: 0,
                  excludedCount: 0,
                  answer: '',
                }))
              }}
            />
            <KnowledgeBasePanel
              results={retrieval.results}
              threshold={retrieval.threshold}
              selectionReady={['prompt', 'generating', 'complete'].includes(retrieval.phase)}
            />
            <RetrievalResults
              answer={retrieval.answer}
              isGenerating={retrieval.phase === 'generating'}
              isPromptReady={retrieval.phase === 'prompt'}
              isSearching={isSearching}
            />
          </div>
          <div className="right-column">
            <DashboardPanel
              checkedCount={retrieval.checkedCount}
              excludedCount={retrieval.excludedCount}
              k={retrieval.k}
              maxScore={retrieval.maxScore}
            />
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
