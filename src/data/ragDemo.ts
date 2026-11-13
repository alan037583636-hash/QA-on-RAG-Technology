export type KnowledgeDocument = {
  id: string
  category: string
  content: string
  score: number
  selected: boolean
}

export const question = '新人報到需要準備什麼？第一天幾點集合？'

export const questionVector = [
  ['報到', 0.92],
  ['時間', 0.76],
  ['錢', 0.12],
  ['設備', 0.08],
  ['規定', 0.21],
  ['地點', 0.83],
  ['證件', 0.74],
  ['餐飲', 0.05],
] as const

export const documents: KnowledgeDocument[] = [
  { id: 'D1', category: '報到資訊', content: '新人報到時間為第一天早上 08:30，請於 15A 廠區大廳交誼廳集合。', score: 0.96, selected: true },
  { id: 'D2', category: '廠區規範', content: '廠區內嚴禁攜帶具備照相、藍牙傳輸功能之個人智慧型手機及穿戴式裝置。', score: 0.52, selected: false },
  { id: 'D3', category: '識別證', content: '識別證若不慎遺失，須立即通報單位主管，並至人資部門繳交 500 元工本費補發。', score: 0.38, selected: false },
  { id: 'D4', category: '員工餐廳', content: '員工餐廳提供多樣化餐點，中午供餐時間為 11:30 到 13:30，晚餐為 17:30 到 19:30。', score: 0.24, selected: false },
  { id: 'D5', category: '員工餐廳', content: '用餐時可使用識別證感應扣款，每月薪資結算時會自動扣除餐費，也可使用悠遊卡。', score: 0.19, selected: false },
  { id: 'D6', category: '無塵室規範', content: '進入無塵室前，必須確實穿著無塵服，並佩戴識別證與靜電手環，嚴禁化妝與噴灑香水。', score: 0.44, selected: false },
  { id: 'D7', category: '交通停車', content: '廠區周邊設有員工專屬停車場，汽車停車證每半年收費 1200 元，機車免費但需上網登記。', score: 0.16, selected: false },
  { id: 'D8', category: '交通接駁', content: '公司提供跨廠區接駁車，每 15 分鐘一班，可往返 15A 廠區與高鐵站。', score: 0.31, selected: false },
  { id: 'D9', category: '報到文件', content: '報到當日請攜帶最高學歷畢業證書正本、身分證件以及兩吋大頭照以供查驗。', score: 0.91, selected: true },
  { id: 'D10', category: '員工宿舍', content: '宿舍申請需戶籍地距離廠區 30 公里以上，每月費用 2500 元，包含基本水電與網路。', score: 0.13, selected: false },
]

export const selectedDocuments = documents.filter((document) => document.selected)

export const answerCards = [
  {
    label: '有 RAG 的回答',
    text: '報到當日請於第一天早上 08:30，到 15A 廠區大廳交誼廳集合；並攜帶最高學歷畢業證書正本、身分證件及兩吋大頭照。［D1、D9］',
    sources: ['D1', 'D9'],
    kind: 'with-rag',
  },
  {
    label: '沒有 RAG 的回答 (幻覺示範)',
    text: '請於上午 09:00 到 15B 廠區報到，並攜帶健保卡與銀行存摺。此回答沒有參考知識庫，內容可能不正確。',
    sources: [],
    kind: 'without-rag',
  },
]

export const historyItems = [
  { time: '09:42:18', text: '新人報到需要準備什麼？第一天幾點集合？', count: '2 筆引用' },
  { time: '09:37:05', text: '員工餐廳的供餐時間是？', count: '2 筆引用' },
  { time: '09:31:42', text: '如何申請員工宿舍？', count: '1 筆引用' },
  { time: '09:24:11', text: '無塵室有哪些穿著規定？', count: '2 筆引用' },
  { time: '09:18:56', text: '高鐵站有接駁車嗎？', count: '1 筆引用' },
]

export const executionSteps = [
  { time: '00.000s', title: 'RANK', detail: '開始比較知識庫文件分數' },
  { time: '00.018s', title: 'SKIP', detail: 'D2–D8、D10 分數未進入 Top-K' },
  { time: '00.042s', title: 'SWAP', detail: 'D9 分數 0.91，更新最小堆堆頂' },
  { time: '00.051s', title: 'PASS', detail: '保留 D1（0.96）與 D9（0.91）' },
  { time: '00.061s', title: 'PROMPT', detail: '組合問題與 2 筆參考資料' },
  { time: '00.068s', title: 'DONE', detail: '完成檢索增強回答示意' },
]
