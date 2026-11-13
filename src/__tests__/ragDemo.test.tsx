import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import App from '../App'
import { documents } from '../data/ragDemo'

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
    expect(within(list).getAllByText('採用')).toHaveLength(2)
    expect(within(list).getAllByText('淘汰')).toHaveLength(8)
    for (const dimension of ['報到', '時間', '錢', '設備', '規定', '地點', '證件', '餐飲']) {
      expect(screen.getByText(dimension)).toBeInTheDocument()
    }
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
})
