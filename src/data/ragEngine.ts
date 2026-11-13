import { documents, vectorDimensions, type KnowledgeDocument } from './ragDemo'

const dimensionKeywords: readonly (readonly string[])[] = [
  ['新人', '報到', '新進', '第一天'],
  ['時間', '幾點', '什麼時候', '何時', '早上', '上午', '中午', '晚上', '午餐', '晚餐', '供餐', '多久', '一班'],
  ['多少錢', '要錢', '費用', '收費', '多少', '免費', '扣款', '薪資', '餐費', '價格', '花費'],
  ['手機', '照相', '藍牙', '穿戴', '無塵服', '靜電手環', '設備', '智慧型', '機車', '汽車', '裝置'],
  ['可以', '能不能', '可否', '嚴禁', '必須', '規定', '攜帶', '化妝', '香水', '提供', '申請', '登記', '機車', '停車'],
  ['廠區', '大廳', '交誼廳', '集合', '地點', '哪裡', '停車', '接駁', '高鐵', '宿舍', '往返', '機車', '周邊'],
  ['證件', '識別證', '身分證', '畢業證書', '照片', '大頭照', '證書'],
  ['餐廳', '吃飯', '用餐', '供餐', '餐點', '餐飲', '素食', '中午', '晚上', '午餐', '晚餐', '餐費'],
]

export const SIMILARITY_THRESHOLD = 0.72

export type RankedDocument = {
  document: KnowledgeDocument
  score: number
  selected: boolean
}

export type ExecutionStep = {
  time: string
  title: 'RANK' | 'PASS' | 'SKIP' | 'SWAP' | 'PROMPT' | 'DONE'
  detail: string
}

export type RetrievalRun = {
  question: string
  queryVector: number[]
  results: RankedDocument[]
  selectedDocuments: RankedDocument[]
  heap: RankedDocument[]
  logs: ExecutionStep[]
  k: number
  maxScore: number
  threshold: number
}

export type RetrievalAnalysis = {
  question: string
  queryVector: number[]
  scoredDocuments: RankedDocument[]
  k: number
  maxScore: number
  threshold: number
}

export type RetrievalProgressStep = {
  log: ExecutionStep
  checkedCount: number
  maxScore: number
  heap: RankedDocument[]
}

export type RetrievalPlan = {
  steps: RetrievalProgressStep[]
  results: RankedDocument[]
  selectedDocuments: RankedDocument[]
  heap: RankedDocument[]
  promptLog: ExecutionStep
  doneLog: ExecutionStep
}

export function embedQuestion(question: string): number[] {
  const normalizedQuestion = question.toLocaleLowerCase()
  const vector = dimensionKeywords.map((keywords) =>
    keywords.reduce(
      (count, keyword) => count + Number(normalizedQuestion.includes(keyword)),
      0,
    ),
  )
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0))

  return magnitude === 0 ? vector : vector.map((value) => value / magnitude)
}

export function cosineSimilarity(left: readonly number[], right: readonly number[]): number {
  if (left.length !== right.length || left.length === 0) return 0

  let dotProduct = 0
  let leftMagnitudeSquared = 0
  let rightMagnitudeSquared = 0

  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index]
    const rightValue = right[index]
    if (leftValue === undefined || rightValue === undefined) return 0

    dotProduct += leftValue * rightValue
    leftMagnitudeSquared += leftValue * leftValue
    rightMagnitudeSquared += rightValue * rightValue
  }

  if (leftMagnitudeSquared === 0 || rightMagnitudeSquared === 0) return 0
  return dotProduct / Math.sqrt(leftMagnitudeSquared * rightMagnitudeSquared)
}

export function scoreDocuments(
  question: string,
  queryVector: number[],
  requestedK: number,
): RetrievalAnalysis {
  const k = Math.max(1, Math.floor(requestedK))
  const scoredDocuments = documents.map((document) => ({
    document,
    score: cosineSimilarity(queryVector, document.vector),
    selected: false,
  }))
  const maxScore = Math.max(0, ...scoredDocuments.map(({ score }) => score))

  return {
    question,
    queryVector,
    scoredDocuments,
    k,
    maxScore,
    threshold: SIMILARITY_THRESHOLD,
  }
}

export function analyzeQuestion(question: string, requestedK: number): RetrievalAnalysis {
  return scoreDocuments(question, embedQuestion(question), requestedK)
}

export function* simulateTopK(
  scoredDocuments: RankedDocument[],
  requestedK: number,
): Generator<RetrievalProgressStep, Omit<RetrievalPlan, 'steps'>> {
  const k = Math.max(1, Math.floor(requestedK))
  const heap: RankedDocument[] = []
  let checkedCount = 0
  let maxScore = 0
  let elapsedSteps = 0

  const createLog = (title: ExecutionStep['title'], detail: string): ExecutionStep => {
    const log = { time: `${(elapsedSteps * 0.012).toFixed(3)}s`, title, detail }
    elapsedSteps += 1
    return log
  }
  const createProgressStep = (title: ExecutionStep['title'], detail: string): RetrievalProgressStep => ({
      log: createLog(title, detail),
      checkedCount,
      maxScore,
      heap: [...heap],
  })
  const swap = (first: number, second: number) => {
    const firstItem = heap[first]
    const secondItem = heap[second]
    if (!firstItem || !secondItem) return
    heap[first] = secondItem
    heap[second] = firstItem
  }
  const siftUp = (index: number) => {
    let childIndex = index
    while (childIndex > 0) {
      const parentIndex = Math.floor((childIndex - 1) / 2)
      const child = heap[childIndex]
      const parent = heap[parentIndex]
      if (!child || !parent || parent.score <= child.score) break
      swap(childIndex, parentIndex)
      childIndex = parentIndex
    }
  }
  const siftDown = (index: number) => {
    let parentIndex = index
    while (true) {
      const leftIndex = parentIndex * 2 + 1
      const rightIndex = leftIndex + 1
      let smallestIndex = parentIndex
      const parent = heap[parentIndex]
      const left = heap[leftIndex]
      const right = heap[rightIndex]

      if (parent && left && left.score < parent.score) smallestIndex = leftIndex
      const smallest = heap[smallestIndex]
      if (smallest && right && right.score < smallest.score) smallestIndex = rightIndex
      if (smallestIndex === parentIndex) break

      swap(parentIndex, smallestIndex)
      parentIndex = smallestIndex
    }
  }

  yield createProgressStep('RANK', `開始將 ${documents.length} 筆文件放入容量 ${k} 的最小堆進行比對。`)

  const candidates = [...scoredDocuments].sort(
    (left, right) => left.document.id.localeCompare(right.document.id, undefined, { numeric: true }),
  )

  for (const candidate of candidates) {
    checkedCount += 1
    maxScore = Math.max(maxScore, candidate.score)

    if (candidate.score < SIMILARITY_THRESHOLD) {
      yield createProgressStep('SKIP', `${candidate.document.id} 分數 ${candidate.score.toFixed(2)} 低於門檻 ${SIMILARITY_THRESHOLD.toFixed(2)}。`)
      continue
    }

    if (heap.length < k) {
      heap.push(candidate)
      siftUp(heap.length - 1)
      yield createProgressStep('PASS', `${candidate.document.id} 分數 ${candidate.score.toFixed(2)}，加入最小堆。`)
      continue
    }

    const root = heap[0]
    if (root && candidate.score > root.score) {
      heap[0] = candidate
      siftDown(0)
      yield createProgressStep('SWAP', `${candidate.document.id} (${candidate.score.toFixed(2)}) 取代堆頂 ${root.document.id} (${root.score.toFixed(2)})。`)
    } else {
      yield createProgressStep('SKIP', `${candidate.document.id} 分數 ${candidate.score.toFixed(2)} 未進入目前 Top-K。`)
    }
  }

  const selectedIds = new Set(heap.map(({ document }) => document.id))
  const results = [...scoredDocuments]
    .sort((left, right) => right.score - left.score || left.document.id.localeCompare(right.document.id))
    .map((result) => ({ ...result, selected: selectedIds.has(result.document.id) }))
  const selectedDocuments = results.filter(({ selected }) => selected)
  const promptLog = createLog(
    'PROMPT',
    selectedDocuments.length > 0
      ? `組合問題與 ${selectedDocuments.map(({ document }) => document.id).join('、')} 作為參考資料。`
      : '沒有文件通過相似度門檻，Prompt 不包含參考資料。',
  )
  const doneLog = createLog('DONE', `檢索完成：採用 ${selectedDocuments.length} 筆，未進入 Top-K ${documents.length - selectedDocuments.length} 筆。`)

  return { results, selectedDocuments, heap: [...heap], promptLog, doneLog }
}

export function buildTopKPlan(
  scoredDocuments: RankedDocument[],
  requestedK: number,
): RetrievalPlan {
  const simulation = simulateTopK(scoredDocuments, requestedK)
  const steps: RetrievalProgressStep[] = []
  let outcome = simulation.next()

  while (outcome.done === false) {
    steps.push(outcome.value)
    outcome = simulation.next()
  }

  return { ...outcome.value, steps }
}

export function mockLlmAnswer(question: string, selectedDocuments: RankedDocument[]): string {
  if (selectedDocuments.length === 0) {
    return '找不到符合相似度門檻的資料，請改寫問題或補充知識庫內容。'
  }

  const documentIds = new Set(selectedDocuments.map(({ document }) => document.id))

  if (question.includes('素食') && documentIds.has('D4')) {
    return '知識庫提到員工餐廳提供多樣餐點與供餐時間，但未提及是否提供素食。資料未提及，建議向餐廳或人資確認。［D4］'
  }

  if (question.includes('接駁車') && question.includes('機車')) {
    const shuttle = selectedDocuments.find(({ document }) => document.id === 'D8')
    const parking = selectedDocuments.find(({ document }) => document.id === 'D7')
    return [
      shuttle && `接駁車每 15 分鐘一班。［${shuttle.document.id}］`,
      parking && `機車停車免費，但需上網登記。［${parking.document.id}］`,
      (!shuttle || !parking) && '其餘問題在目前檢索到的資料中沒有答案。',
    ].filter(Boolean).join(' ')
  }

  return selectedDocuments
    .map(({ document }) => `${document.content}［${document.id}］`)
    .join('\n')
}

export function runRetrieval(question: string, requestedK: number): RetrievalRun {
  const analysis = analyzeQuestion(question, requestedK)
  const plan = buildTopKPlan(analysis.scoredDocuments, analysis.k)

  return {
    question,
    queryVector: analysis.queryVector,
    results: plan.results,
    selectedDocuments: plan.selectedDocuments,
    heap: plan.heap,
    logs: [...plan.steps.map(({ log }) => log), plan.promptLog, plan.doneLog],
    k: analysis.k,
    maxScore: analysis.maxScore,
    threshold: analysis.threshold,
  }
}
