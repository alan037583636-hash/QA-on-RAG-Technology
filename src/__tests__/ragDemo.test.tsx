import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import App from '../App'
import { documents, scenarios } from '../data/ragDemo'
import { mockLlmAnswer, runRetrieval } from '../data/ragEngine'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('RAG training demo', () => {
  it('renders the onboarding walkthrough, includes all source documents, and hides the old mode toggle', () => {
    render(<App />)
    expect(screen.getByText('RAG 科技廠區新人問答')).toBeInTheDocument()
    expect(screen.getByText('黃奕舜')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '闖關模式' })).not.toBeInTheDocument()

    const list = screen.getByLabelText('知識庫文件清單')
    for (const document of documents) {
      expect(within(list).getByText(document.id)).toBeInTheDocument()
      expect(within(list).getByText(document.content)).toBeInTheDocument()
    }

    for (const scenario of scenarios) {
      expect(screen.getByRole('button', { name: new RegExp(scenario.title) })).toBeInTheDocument()
    }
  })

  it('shows the updated real-world intake scenarios and the RAG output panels', () => {
    render(<App />)
    expect(screen.getByText('有 RAG 的回答')).toBeInTheDocument()
    expect(screen.getByText('沒有 RAG 的回答 (幻覺示範)')).toBeInTheDocument()
    expect(screen.getByText('數據儀表板')).toBeInTheDocument()
    expect(screen.getByText('堆頂 · 目前最小分數')).toBeInTheDocument()
    expect(screen.getByText('最近查詢')).toBeInTheDocument()
    expect(screen.getByText('組合後的 Prompt')).toBeInTheDocument()
    expect(screen.getByText('READ ONLY')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '演示模式' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /門禁與遺失通報/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /無塵室規範/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /跨廠區交通/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /複合查詢/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /資料外問題/ })).toBeInTheDocument()
  })

  it('retrieves the correct document for the lost identification card scenario', () => {
    const result = runRetrieval('我不小心把識別證弄掉了怎麼辦？', 2)
    expect(result.selectedDocuments[0]?.document.id).toBe('D3')
    expect(result.selectedDocuments.map(({ document }) => document.id)).not.toContain('D5')
    expect(result.selectedDocuments.map(({ document }) => document.id)).not.toContain('D6')
    const answer = mockLlmAnswer('我不小心把識別證弄掉了怎麼辦？', result.selectedDocuments)
    expect(answer).toContain('D3')
    expect(answer).not.toContain('D6')
  })

  it('keeps high-signal matches while pruning distracting documents with the 70% top-score cutoff', () => {
    const missingId = runRetrieval('我不小心把識別證弄掉了怎麼辦？', 2)
    const dustRoom = runRetrieval('進無塵室可以稍微擦一點香水嗎？', 2)
    const transit = runRetrieval('請問高鐵站有車可以到 15A 廠區嗎？', 2)
    const combined = runRetrieval('請問報到時間是幾點？中午餐廳幾點開？', 2)

    expect(missingId.selectedDocuments[0]?.document.id).toBe('D3')
    expect(dustRoom.selectedDocuments[0]?.document.id).toBe('D6')
    expect(transit.selectedDocuments.map(({ document }) => document.id)).toContain('D8')
    expect(combined.selectedDocuments.map(({ document }) => document.id)).toContain('D1')
    expect(combined.selectedDocuments.map(({ document }) => document.id)).toContain('D4')
  })

  it('validates topic and detail separately and declines unsupported details', () => {
    const result = runRetrieval('請問員工宿舍有提供雙人房嗎？', 2)
    expect(result.selectedDocuments.map(({ document }) => document.id)).toContain('D10')
    expect(mockLlmAnswer('宿舍一個月多少錢？', result.selectedDocuments)).toContain('2500 元')
    expect(mockLlmAnswer('請問員工宿舍有提供雙人房嗎？', result.selectedDocuments))
      .toBe('根據現有資料，未提及相關細節資訊。')
    const dining = runRetrieval('請問員工餐廳有提供素食嗎？', 2)
    expect(mockLlmAnswer('請問員工餐廳有提供素食嗎？', dining.selectedDocuments))
      .toBe('根據現有資料，未提及相關細節資訊。')
    expect(mockLlmAnswer('請問公司有游泳池嗎？', result.selectedDocuments)).toBe('根據現有資料，未提及相關資訊。')
  })

  it('passes ten synonym-aware retrieval and answer cases without unrelated documents', () => {
    const cases = [
      { question: '中午跟晚上什麼時候可以去吃飯？', documentIds: ['D4'], excludedIds: ['D1', 'D2', 'D3', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10'] },
      { question: '宿舍一個月多少錢？', documentIds: ['D10'], excludedIds: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9'] },
      { question: '新人報到要帶什麼文件？', documentIds: ['D9'], excludedIds: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D10'] },
      { question: '識別證掉了怎麼辦？', documentIds: ['D3'], excludedIds: ['D1', 'D2', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10'] },
      { question: '進無塵室可以稍微擦一點香水嗎？', documentIds: ['D6'], excludedIds: ['D1', 'D2', 'D3', 'D4', 'D5', 'D7', 'D8', 'D9', 'D10'] },
      { question: '請問高鐵站有車可以到 15A 廠區嗎？', documentIds: ['D8'], excludedIds: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D9', 'D10'] },
      { question: '請問報到時間是幾點？中午餐廳幾點開？', documentIds: ['D1', 'D4'], excludedIds: ['D2', 'D3', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10'] },
      { question: '機車停車要多少錢？', documentIds: ['D7'], excludedIds: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D8', 'D9', 'D10'] },
      { question: '廠區可以帶有照相功能的手機嗎？', documentIds: ['D2'], excludedIds: ['D1', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10'] },
      { question: '接駁車多久一班？', documentIds: ['D8'], excludedIds: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D9', 'D10'] },
    ]

    for (const { question, documentIds, excludedIds } of cases) {
      const result = runRetrieval(question, 3)
      const selectedIds = result.selectedDocuments.map(({ document }) => document.id)
      const answer = mockLlmAnswer(question, result.selectedDocuments)

      expect(result.threshold).toBeCloseTo(Math.max(0.03, result.maxScore * 0.7))
      expect(result.selectedDocuments.every(({ score }) => score >= result.threshold)).toBe(true)
      for (const documentId of documentIds) {
        expect(selectedIds, question).toContain(documentId)
      }
      for (const documentId of excludedIds) {
        expect(selectedIds, question).not.toContain(documentId)
      }
      expect(answer, question).not.toContain('未提及')
    }
  })

  it('uses non-saturated pure TF-IDF cosine scores for retrieval ranking', () => {
    const result = runRetrieval('新人報到要帶什麼文件？', 3)
    expect(result.results[0]?.document.id).toBe('D9')
    expect(result.results.every(({ score }) => score >= 0 && score < 1)).toBe(true)
    expect(result.results[0]?.score).toBeGreaterThan(result.results.find(({ document }) => document.id === 'D1')?.score ?? 0)
  })

  it('locks controls during an animated search and then restores them after completion', async () => {
    vi.useFakeTimers()
    render(<App />)
    const input = screen.getByRole('textbox', { name: '你的問題' })
    const startButton = screen.getByRole('button', { name: '開始檢索' })

    fireEvent.change(input, { target: { value: '請問高鐵站有車可以到 15A 廠區嗎？' } })
    fireEvent.click(startButton)

    expect(startButton).toBeDisabled()
    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(startButton).toBeEnabled()
    expect(screen.getAllByText('D8').length).toBeGreaterThan(0)
  })
})
