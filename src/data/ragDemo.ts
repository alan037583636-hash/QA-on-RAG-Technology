export type KnowledgeDocument = {
  id: string
  category: string
  content: string
  vector: readonly [number, number, number, number, number, number, number, number]
}

export type TrainingScenario = {
  id: number
  title: string
  subtitle: string
  question: string
  k: number
  description: string
}

export const scenarios: TrainingScenario[] = [
  {
    id: 1,
    title: '基本',
    subtitle: '完整流程',
    question: '請問新人報到時間是幾點？',
    k: 2,
    description: '最標準的檢索，精準配對到 D1。',
  },
  {
    id: 2,
    title: '換句話',
    subtitle: '字面不同',
    question: '中午跟晚上什麼時候可以去吃飯？',
    k: 2,
    description: '字面上沒有「餐廳」或「供餐」，但向量相似度能抓到 D4。',
  },
  {
    id: 3,
    title: '滿分',
    subtitle: '第一名滿分',
    question: '廠區可以帶有照相功能的手機嗎？',
    k: 2,
    description: '與 D2 高度吻合，相似度極高。',
  },
  {
    id: 4,
    title: '無關',
    subtitle: '什麼都沒找到',
    question: '台積電股票今天多少錢？',
    k: 2,
    description: '相似度極低，全部被 Threshold 淘汰，回傳「找不到資料」。',
  },
  {
    id: 5,
    title: '有資料沒答案',
    subtitle: '相關但沒寫',
    question: '請問員工餐廳有提供素食嗎？',
    k: 2,
    description: '能檢索到 D4，但資料內未提及素食，LLM 應回答「資料未提及」。',
  },
  {
    id: 6,
    title: 'k=1',
    subtitle: '資料不夠',
    question: '請問接駁車多久一班？機車停車要錢嗎？',
    k: 1,
    description: '問題包含兩個考點，但 k=1 只能抓到 D8 或 D7 其中一個，導致 LLM 回答不完整。',
  },
  {
    id: 7,
    title: 'k=2',
    subtitle: '資料剛好',
    question: '請問接駁車多久一班？機車停車要錢嗎？',
    k: 2,
    description: '同樣的問題，將 k 設為 2 後，D7 與 D8 皆入選，LLM 能給出完整答案。',
  },
]

export const question = scenarios[0].question

export const vectorDimensions = ['報到', '時間', '錢', '設備', '規定', '地點', '證件', '餐飲'] as const

export const documents: KnowledgeDocument[] = [
  { id: 'D1', category: '報到資訊', content: '新人報到時間為第一天早上 08:30，請於 15A 廠區大廳交誼廳集合。', vector: [0.85, 0.85, 0, 0, 0.05, 0.7, 0.1, 0] },
  { id: 'D2', category: '廠區規範', content: '廠區內嚴禁攜帶具備照相、藍牙傳輸功能之個人智慧型手機及穿戴式裝置。', vector: [0, 0.05, 0, 1, 0.95, 0.05, 0, 0] },
  { id: 'D3', category: '識別證', content: '識別證若不慎遺失，須立即通報單位主管，並至人資部門繳交 500 元工本費補發。', vector: [0.2, 0.1, 0.75, 0, 0.7, 0.1, 0.9, 0] },
  { id: 'D4', category: '員工餐廳', content: '員工餐廳提供多樣化餐點，中午供餐時間為 11:30 到 13:30，晚餐為 17:30 到 19:30。', vector: [0, 0.85, 0, 0, 0.4, 0, 0, 1] },
  { id: 'D5', category: '員工餐廳', content: '用餐時可使用識別證感應扣款，每月薪資結算時會自動扣除餐費，也可使用悠遊卡。', vector: [0, 0.1, 0.9, 0, 0.1, 0, 0.5, 0.75] },
  { id: 'D6', category: '無塵室規範', content: '進入無塵室前，必須確實穿著無塵服，並佩戴識別證與靜電手環，嚴禁化妝與噴灑香水。', vector: [0, 0, 0, 0.8, 1, 0, 0.55, 0] },
  { id: 'D7', category: '交通停車', content: '廠區周邊設有員工專屬停車場，汽車停車證每半年收費 1200 元，機車免費但需上網登記。', vector: [0, 0, 0.85, 0.4, 0.95, 1, 0, 0] },
  { id: 'D8', category: '交通接駁', content: '公司提供跨廠區接駁車，每 15 分鐘一班，可往返 15A 廠區與高鐵站。', vector: [0, 0.85, 0, 0, 0.1, 0.9, 0, 0] },
  { id: 'D9', category: '報到文件', content: '報到當日請攜帶最高學歷畢業證書正本、身分證件以及兩吋大頭照以供查驗。', vector: [0.9, 0.1, 0, 0, 0.08, 0, 1, 0] },
  { id: 'D10', category: '員工宿舍', content: '宿舍申請需戶籍地距離廠區 30 公里以上，每月費用 2500 元，包含基本水電與網路。', vector: [0, 0, 0.6, 0, 0.2, 0.9, 0, 0] },
]

export const historyItems = [
  { time: '09:42:18', text: '新人報到需要準備什麼？第一天幾點集合？', count: '2 筆引用' },
  { time: '09:37:05', text: '員工餐廳的供餐時間是？', count: '2 筆引用' },
  { time: '09:31:42', text: '如何申請員工宿舍？', count: '1 筆引用' },
  { time: '09:24:11', text: '無塵室有哪些穿著規定？', count: '2 筆引用' },
  { time: '09:18:56', text: '高鐵站有接駁車嗎？', count: '1 筆引用' },
]
