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
    expect(result.selectedDocuments.map(({ document }) => document.id)).toContain('D6')
  })

  it('keeps high-signal matches while pruning distracting low-score documents with the dynamic top-k window', () => {
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

  it('returns the generic “資料未提及” message when the selected docs do not cover the asked detail', () => {
    const result = runRetrieval('請問員工宿舍有提供雙人房嗎？', 2)
    expect(result.selectedDocuments[0]?.document.id).toBe('D10')
    expect(mockLlmAnswer('請問員工宿舍有提供雙人房嗎？', result.selectedDocuments)).toBe('根據現有資料，未提及相關資訊。')
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
