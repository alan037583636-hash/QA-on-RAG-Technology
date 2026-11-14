import { documents, type KnowledgeDocument } from './ragDemo'

const STOP_WORDS = new Set([
  '的', '了', '是', '嗎', '請', '問', '我', '你', '他', '她', '它', '在', '與', '和', '也', '可', '可否', '可以', '是否',
  '到', '這', '那', '哪', '什麼', '怎麼', '為', '因', '稍微', '有', '沒', '能', '會', '要', '但', '並', '如果', '一點',
  '請問', '多少', '幾點', '多久', '什麼時候', '哪裡', '有沒有', '怎樣', '怎麼樣', '員工', '提供', '可以', '能否',
  '跟', '去', '什麼', '當日',
])

export const synonyms: Readonly<Record<string, readonly string[]>> = {
  '吃飯': ['供餐', '餐點', '餐廳', '午餐', '晚餐'],
  '多少錢': ['元', '費用', '收費', '錢'],
  '文件': ['畢業證書', '身分證件', '應備文件'],
  '掉了': ['遺失', '補發', '不見'],
}

const TOP_SCORE_RATIO = 0.7
export const SIMILARITY_THRESHOLD = 0.03

const QUESTION_TOPICS = [
  { id: 'dormitory', questionTerms: ['宿舍'], documentTerms: ['宿舍'] },
  { id: 'dining', questionTerms: ['餐廳', '午餐', '晚餐', '吃飯', '用餐', '供餐'], documentTerms: ['餐廳', '午餐', '晚餐', '供餐', '餐點'] },
  { id: 'parking', questionTerms: ['停車', '機車', '汽車'], documentTerms: ['停車', '機車', '汽車'] },
  { id: 'onboarding', questionTerms: ['報到', '新人'], documentTerms: ['報到', '新人'] },
  { id: 'badge', questionTerms: ['識別證'], documentTerms: ['識別證'] },
] as const

const DETAIL_KEYWORDS = [
  { terms: ['雙人房'], synonyms: ['雙人房', '兩人房', '雙床房'], topicIds: ['dormitory'] },
  { terms: ['素食'], synonyms: ['素食', '蔬食'], topicIds: ['dining'] },
  { terms: ['多少錢', '費用', '收費', '價錢', '價格'], synonyms: ['元', '費用', '收費', '免費', '價格', '金額'], topicIds: ['dormitory', 'dining', 'parking', 'badge'] },
  { terms: ['文件'], synonyms: ['應備文件', '畢業證書', '身分證件', '文件'], topicIds: ['onboarding'] },
  { terms: ['掉了', '不見', '遺失'], synonyms: ['遺失', '補發', '不見'], topicIds: ['badge'] },
] as const

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
  queryVectors: number[][]
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
  queryVectors: number[][]
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

function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/[\s\u3000\t\n\r，。！？、：；（）【】「」『』“”‘’\-—_]/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
}

function buildCharacterBigrams(value: string): string[] {
  const normalized = normalizeText(value)
  if (normalized.length < 2) {
    return normalized ? [normalized] : []
  }

  const grams: string[] = []
  for (let index = 0; index < normalized.length - 1; index += 1) {
    grams.push(normalized.slice(index, index + 2))
  }

  return grams
}

function buildQuestionBigrams(question: string): string[][] {
  const stopWords = Array.from(STOP_WORDS).sort((left, right) => right.length - left.length)
  const clauses = question.split(/[？?。！!；;\n]+/)

  return clauses.flatMap((clause) => {
    const normalizedClause = normalizeText(clause)
    let cleanedClause = normalizedClause
    for (const stopWord of stopWords) {
      cleanedClause = cleanedClause.replace(new RegExp(stopWord, 'g'), '')
    }

    if (!cleanedClause) return []

    const expansions = Object.entries(synonyms)
      .filter(([phrase]) => normalizedClause.includes(normalizeText(phrase)))
      .flatMap(([, alternatives]) => alternatives.map(normalizeText))
    return [buildCharacterBigrams(`${cleanedClause}${expansions.join('')}`)]
  })
}

function getCoreQuestionTerms(question: string): string[] {
  let cleaned = normalizeText(question)
  const stopWords = Array.from(STOP_WORDS).sort((left, right) => right.length - left.length)
  for (const stopWord of stopWords) {
    cleaned = cleaned.replace(new RegExp(stopWord, 'g'), '')
  }

  if (!cleaned) return []

  const uniqueTerms = new Set<string>()
  for (let segmentLength = 2; segmentLength <= Math.min(6, cleaned.length); segmentLength += 1) {
    for (let index = 0; index + segmentLength <= cleaned.length; index += 1) {
      const term = cleaned.slice(index, index + segmentLength)
      if (term.length >= 2 && !STOP_WORDS.has(term)) {
        uniqueTerms.add(term)
      }
    }
  }

  return Array.from(uniqueTerms).sort((left, right) => right.length - left.length).slice(0, 40)
}

function getCorpusVocabulary(question: string): string[] {
  const vocabulary = new Set<string>()

  for (const clauseGrams of buildQuestionBigrams(question)) {
    for (const gram of clauseGrams) {
      vocabulary.add(gram)
    }
  }
  for (const { content } of documents) {
    for (const gram of buildCharacterBigrams(content)) {
      vocabulary.add(gram)
    }
  }

  return Array.from(vocabulary)
}

function getDocumentFrequencies(): Map<string, number> {
  const documentFrequency = new Map<string, number>()
  for (const { content } of documents) {
    const seen = new Set<string>()
    for (const gram of buildCharacterBigrams(content)) {
      if (!seen.has(gram)) {
        seen.add(gram)
        documentFrequency.set(gram, (documentFrequency.get(gram) ?? 0) + 1)
      }
    }
  }
  return documentFrequency
}

function buildTfIdfVector(
  text: string,
  vocabulary: string[],
  documentFrequency: Map<string, number>,
  isQuestion = false,
): number[] {
  if (vocabulary.length === 0) return []

  const gramGroups = isQuestion ? buildQuestionBigrams(text) : [buildCharacterBigrams(text)]
  const clauseVectors = gramGroups.map((grams) => {
    const counts = new Map<string, number>()
    for (const gram of grams) {
      counts.set(gram, (counts.get(gram) ?? 0) + 1)
    }

    const vector = vocabulary.map((term) => {
      const termFrequency = (counts.get(term) ?? 0) / (grams.length || 1)
      const frequency = documentFrequency.get(term) ?? 0
      const inverseDocumentFrequency = Math.log((documents.length + 1) / (frequency + 1)) + 1
      return termFrequency * inverseDocumentFrequency
    })
    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0))
    return magnitude === 0 ? vector : vector.map((value) => value / magnitude)
  })

  return vocabulary.map((_, index) =>
    clauseVectors.reduce((sum, vector) => sum + (vector[index] ?? 0), 0) / (clauseVectors.length || 1),
  )
}

export function getQuestionFeatureTerms(question: string): string[] {
  return getCorpusVocabulary(question)
}

export function getQuestionFeatureVectors(question: string): number[][] {
  return getQuestionDocumentVectors(question).queryVectors
}

function getQuestionDocumentVectors(question: string): {
  queryVectors: number[][]
  documentVectors: number[][]
} {
  const vocabulary = getCorpusVocabulary(question)
  const documentFrequency = getDocumentFrequencies()
  const clauses = question.split(/[？?。！!；;\n]+/).filter((clause) => normalizeText(clause))
  const clauseVectors = (clauses.length > 0 ? clauses : [question])
    .map((clause) => buildTfIdfVector(clause, vocabulary, documentFrequency, true))
  const documentVectors = documents.map(({ content }) => buildTfIdfVector(content, vocabulary, documentFrequency))

  return {
    queryVectors: clauseVectors,
    documentVectors,
  }
}

function getMatchedQuestionTerms(question: string, content: string): string[] {
  const normalizedQuestion = normalizeText(question)
  const normalizedContent = normalizeText(content)
  const activeSynonymGroups = Object.entries(synonyms).filter(([phrase]) =>
    normalizedQuestion.includes(normalizeText(phrase)),
  )

  if (activeSynonymGroups.length > 0) {
    const allGroupsMatched = activeSynonymGroups.every(([, alternatives]) =>
      alternatives.some((alternative) => normalizedContent.includes(normalizeText(alternative))),
    )
    if (!allGroupsMatched) return []
  }

  const terms = new Set(getCoreQuestionTerms(question))

  for (const [phrase, alternatives] of activeSynonymGroups) {
    if (normalizedQuestion.includes(normalizeText(phrase))) {
      terms.add(normalizeText(phrase))
      for (const alternative of alternatives) {
        terms.add(normalizeText(alternative))
      }
    }
  }

  return Array.from(terms).filter((term) => term && normalizedContent.includes(term))
}

function getDetailMatch(
  question: string,
  content: string,
): { asked: false } | { asked: true; matched: boolean } {
  const normalizedQuestion = normalizeText(question)
  const detail = DETAIL_KEYWORDS.find(({ terms }) =>
    terms.some((term) => normalizedQuestion.includes(normalizeText(term))),
  )

  if (!detail) return { asked: false }

  const normalizedContent = normalizeText(content)
  const questionTopics = QUESTION_TOPICS.filter(({ id, questionTerms }) =>
    detail.topicIds.includes(id) &&
    questionTerms.some((term) => normalizedQuestion.includes(normalizeText(term))),
  )
  const topicMatched = questionTopics.some(({ documentTerms }) =>
    documentTerms.some((term) => normalizedContent.includes(normalizeText(term))),
  )
  const detailMatched = detail.synonyms.some((term) =>
    normalizedContent.includes(normalizeText(term)),
  )

  return { asked: true, matched: topicMatched && detailMatched }
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
  requestedK: number,
): RetrievalAnalysis {
  const k = Math.max(1, Math.floor(requestedK))
  const { queryVectors, documentVectors } = getQuestionDocumentVectors(question)
  const scoredDocuments = documents.map((document, index) => ({
    document,
    score: Math.max(
      0,
      ...queryVectors.map((clauseVector) => cosineSimilarity(clauseVector, documentVectors[index] ?? [])),
    ),
    selected: false,
  }))

  const maxScore = Math.max(0, ...scoredDocuments.map(({ score }) => score))

  return {
    question,
    queryVectors,
    scoredDocuments,
    k,
    maxScore,
    threshold: Math.max(SIMILARITY_THRESHOLD, maxScore * TOP_SCORE_RATIO),
  }
}

export function analyzeQuestion(question: string, requestedK: number): RetrievalAnalysis {
  return scoreDocuments(question, requestedK)
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

  const ranked = [...scoredDocuments].sort((left, right) => right.score - left.score || left.document.id.localeCompare(right.document.id))
  const topScore = Math.max(0, ...heap.map(({ score }) => score))
  const minimumAllowedScore = Math.max(SIMILARITY_THRESHOLD, topScore * TOP_SCORE_RATIO)
  const selectedIds = new Set(
    heap
      .filter(({ score }) => score >= minimumAllowedScore && score >= SIMILARITY_THRESHOLD)
      .map(({ document }) => document.id),
  )

  const results = [...scoredDocuments]
    .sort((left, right) => right.score - left.score || left.document.id.localeCompare(right.document.id))
    .map((result) => ({ ...result, selected: selectedIds.has(result.document.id) }))
  const selectedDocuments = results.filter(({ selected }) => selected)
  const finalHeap = heap
    .filter(({ document }) => selectedIds.has(document.id))
    .sort((left, right) => left.score - right.score || left.document.id.localeCompare(right.document.id))

  const promptLog = createLog(
    'PROMPT',
    selectedDocuments.length > 0
      ? `組合問題與 ${selectedDocuments.map(({ document }) => document.id).join('、')} 作為參考資料。`
      : '沒有文件通過相似度門檻，Prompt 不包含參考資料。',
  )
  const doneLog = createLog('DONE', `檢索完成：採用 ${selectedDocuments.length} 筆（動態 Top-k 篩選後），未進入候選 ${documents.length - selectedDocuments.length} 筆。`)

  return { results, selectedDocuments, heap: finalHeap, promptLog, doneLog }
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

  const detailResults = selectedDocuments.map((rankedDocument) => ({
    rankedDocument,
    detailMatch: getDetailMatch(question, rankedDocument.document.content),
  }))
  const hasDetailQuestion = detailResults.some(({ detailMatch }) => detailMatch.asked)

  if (hasDetailQuestion) {
    const detailDocuments = detailResults
      .filter(({ detailMatch }) => detailMatch.asked && detailMatch.matched)
      .map(({ rankedDocument }) => rankedDocument)

    if (detailDocuments.length === 0) {
      return '根據現有資料，未提及相關細節資訊。'
    }

    const documentIds = detailDocuments.map(({ document }) => document.id).join('、')
    const content = detailDocuments
      .map(({ document }) => `${document.content}［${document.id}］`)
      .join(' ')
    return `依據 ${documentIds} 的內容，相關資訊整理如下：${content}`
  }

  const candidateDocs = selectedDocuments.filter(({ document }) => {
    return getMatchedQuestionTerms(question, document.content).length > 0
  })

  if (candidateDocs.length === 0) {
    return '根據現有資料，未提及相關資訊。'
  }

  const idText = candidateDocs.map(({ document }) => document.id).join('、')
  const contentSummary = candidateDocs
    .map(({ document }) => `${document.content}［${document.id}］`)
    .join(' ')

  return `依據 ${idText} 的內容，相關資訊整理如下：${contentSummary}`
}

export function runRetrieval(question: string, requestedK: number): RetrievalRun {
  const analysis = analyzeQuestion(question, requestedK)
  const plan = buildTopKPlan(analysis.scoredDocuments, analysis.k)

  return {
    question,
    queryVectors: analysis.queryVectors,
    results: plan.results,
    selectedDocuments: plan.selectedDocuments,
    heap: plan.heap,
    logs: [...plan.steps.map(({ log }) => log), plan.promptLog, plan.doneLog],
    k: analysis.k,
    maxScore: analysis.maxScore,
    threshold: analysis.threshold,
  }
}
