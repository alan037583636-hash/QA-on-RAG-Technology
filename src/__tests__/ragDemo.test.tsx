import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import App from '../App'
import { documents, scenarios, vectorDimensions } from '../data/ragDemo'
import { cosineSimilarity, embedQuestion, runRetrieval } from '../data/ragEngine'

afterEach(cleanup)

describe('RAG training demo', () => {
  it('renders the Chinese onboarding RAG walkthrough and all ten source documents', () => {
    render(<App />)
    expect(screen.getByText('RAG 科技廠區新人問答')).toBeInTheDocument()
    const list = screen.getByLabelText('知識庫文件清單')
    for (const document of documents) {
      expect(within(list).getByText(document.id)).toBeInTheDocument()
      expect(within(list).getByText(document.content)).toBeInTheDocument()
    }
    expect(within(list).getAllByText('採用')).toHaveLength(1)
    expect(within(list).getAllByText('淘汰')).toHaveLength(9)
    for (const dimension of ['報到', '時間', '錢', '設備', '規定', '地點', '證件', '餐飲']) {
      expect(screen.getByText(dimension)).toBeInTheDocument()
    }
    expect(vectorDimensions).toHaveLength(8)
  })

  it('shows the question vector, result answers, dashboard, heap, history, and prompt', () => {
    render(<App />)
    expect(screen.getByText('8 dimensions')).toBeInTheDocument()
    expect(screen.getByText('有 RAG 的回答')).toBeInTheDocument()
    expect(screen.getByText('沒有 RAG 的回答 (幻覺示範)')).toBeInTheDocument()
    expect(screen.getByText('數據儀表板')).toBeInTheDocument()
    expect(screen.getByText('堆頂 · 目前最小分數')).toBeInTheDocument()
    expect(screen.getByText('最近查詢')).toBeInTheDocument()
    expect(screen.getByText('組合後的 Prompt')).toBeInTheDocument()
    expect(screen.getByText('READ ONLY')).toBeInTheDocument()
    for (const mode of ['演示模式', '闖關模式']) {
      expect(screen.getByRole('button', { name: mode })).toBeInTheDocument()
    }
    for (let level = 1; level <= 7; level += 1) {
      expect(screen.getByRole('button', { name: new RegExp(`^${level}`) })).toBeInTheDocument()
    }
  })

  it('updates the question and K value when a scenario is selected', () => {
    render(<App />)
    const questionInput = screen.getByRole('textbox', { name: '你的問題' })
    const kSelect = screen.getByRole('combobox', { name: 'K 值' })

    fireEvent.click(screen.getByRole('button', { name: /6 k=1 資料不夠/ }))
    expect(questionInput).toHaveValue('請問接駁車多久一班？機車停車要錢嗎？')
    expect(kSelect).toHaveValue('1')

    fireEvent.click(screen.getByRole('button', { name: /7 k=2 資料剛好/ }))
    expect(questionInput).toHaveValue('請問接駁車多久一班？機車停車要錢嗎？')
    expect(kSelect).toHaveValue('2')
  })

  it('calculates cosine similarity and retrieves D4 for the rephrased meal question', () => {
    const scenario = scenarios[1]
    const queryVector = embedQuestion(scenario.question)
    const result = runRetrieval(scenario.question, scenario.k)

    expect(queryVector).toHaveLength(8)
    expect(cosineSimilarity([1, 0], [1, 0])).toBe(1)
    expect(result.selectedDocuments[0]?.document.id).toBe('D4')
    expect(result.results[0]?.document.id).toBe('D4')
  })

  it('applies the threshold and retrieves both transport documents when k is two', () => {
    const onboarding = runRetrieval(scenarios[0].question, scenarios[0].k)
    const phonePolicy = runRetrieval(scenarios[2].question, scenarios[2].k)
    const unrelated = runRetrieval(scenarios[3].question, scenarios[3].k)
    const unanswered = runRetrieval(scenarios[4].question, scenarios[4].k)
    const limitedContext = runRetrieval(scenarios[5].question, scenarios[5].k)
    const enoughContext = runRetrieval(scenarios[6].question, scenarios[6].k)

    expect(onboarding.selectedDocuments[0]?.document.id).toBe('D1')
    expect(phonePolicy.selectedDocuments[0]?.document.id).toBe('D2')
    expect(unrelated.selectedDocuments).toHaveLength(0)
    expect(unanswered.selectedDocuments[0]?.document.id).toBe('D4')
    expect(limitedContext.selectedDocuments).toHaveLength(1)
    expect(['D7', 'D8']).toContain(limitedContext.selectedDocuments[0]?.document.id)
    expect(enoughContext.selectedDocuments.map(({ document }) => document.id)).toEqual(['D8', 'D7'])
  })

  it('updates vector, document scores, and execution log when a scenario runs', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /2 換句話 字面不同/ }))

    const list = screen.getByLabelText('知識庫文件清單')
    const d4Card = within(list).getByText('D4').closest('.document-card')
    const d1Card = within(list).getByText('D1').closest('.document-card')
    expect(d4Card).toHaveClass('is-selected')
    expect(d1Card).not.toHaveClass('is-selected')
    expect(Number(d4Card?.querySelector('.score-row strong')?.textContent))
      .toBeGreaterThan(Number(d1Card?.querySelector('.score-row strong')?.textContent))
    expect(screen.getByText(/組合問題與 D4 作為參考資料/)).toBeInTheDocument()
    expect(screen.getByText(/D4 分數 .*加入最小堆/)).toBeInTheDocument()
    expect(document.querySelector('.prompt-content')).toHaveTextContent('[D4]')
  })

  it('recomputes the retrieval after clicking the search button', () => {
    render(<App />)
    fireEvent.change(screen.getByRole('textbox', { name: '你的問題' }), {
      target: { value: '中午跟晚上什麼時候可以去吃飯？' },
    })
    fireEvent.click(screen.getByRole('button', { name: '開始檢索' }))

    const list = screen.getByLabelText('知識庫文件清單')
    expect(within(list).getByText('D4').closest('.document-card')).toHaveClass('is-selected')
    expect(document.querySelector('.prompt-content')).toHaveTextContent('[D4]')
  })
})
