import { documents, type KnowledgeDocument } from './ragDemo'

const STOP_WORDS = new Set([
  '的', '了', '是', '嗎', '請', '問', '我', '你', '他', '她', '它', '在', '與', '和', '也', '可', '可否', '可以', '是否',
  '到', '這', '那', '哪', '什麼', '怎麼', '為', '因', '稍微', '有', '沒', '能', '會', '要', '但', '並', '如果', '一點',
  '請問', '多少', '幾點', '多久', '什麼時候', '哪裡', '有沒有', '怎樣', '怎麼樣', '員工', '提供', '可以', '能否',
])

const TOP_SCORE_WINDOW = 0.15
export const SIMILARITY_THRESHOLD = 0.4

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

function getCorpusVocabulary(corpus: string[]): string[] {
  const vocabulary = new Set<string>()

  for (const text of corpus) {
    for (const gram of buildCharacterBigrams(text)) {
      if (gram.length >= 2) {
        vocabulary.add(gram)
      }
    }
  }

  return Array.from(vocabulary)
}

function buildTfIdfVector(targetText: string, vocabulary: string[], corpus: string[]): number[] {
  if (vocabulary.length === 0) return []

  const tfMap = new Map<string, number>()
  const totalGrams = buildCharacterBigrams(targetText).length || 1

  for (const gram of buildCharacterBigrams(targetText)) {
    tfMap.set(gram, (tfMap.get(gram) ?? 0) + 1)
  }

  const documentFrequency = new Map<string, number>()
  for (const text of corpus) {
    const seen = new Set<string>()
    for (const gram of buildCharacterBigrams(text)) {
      if (!seen.has(gram)) {
        seen.add(gram)
        documentFrequency.set(gram, (documentFrequency.get(gram) ?? 0) + 1)
      }
    }
  }

  return vocabulary.map((term) => {
    const termFrequency = tfMap.get(term) ?? 0
    const docFrequency = documentFrequency.get(term) ?? 0
    const tf = termFrequency / totalGrams
    const idf = Math.log((corpus.length + 1) / (docFrequency + 1)) + 1
    return tf * idf
  })
}

function keywordOverlapRatio(question: string, content: string): number {
  const questionTerms = getCoreQuestionTerms(question)
  if (questionTerms.length === 0) return 0

  const normalizedContent = normalizeText(content)
  let matched = 0
  for (const term of questionTerms) {
    if (normalizedContent.includes(term)) {
      matched += 1
    }
  }

  return matched / questionTerms.length
}

export function embedQuestion(question: string): number[] {
  const corpus = [question, ...documents.map(({ content }) => content)]
  const vocabulary = getCorpusVocabulary(corpus)
  return buildTfIdfVector(question, vocabulary, corpus)
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

function computeCharBigramSimilarity(question: string, content: string): number {
  const normalizedQuestion = normalizeText(question)
  const normalizedContent = normalizeText(content)
  const questionBigrams = buildCharacterBigrams(normalizedQuestion)
  const contentBigrams = buildCharacterBigrams(normalizedContent)

  if (questionBigrams.length === 0 || contentBigrams.length === 0) {
    return 0
  }

  const questionCounts = new Map<string, number>()
  const contentCounts = new Map<string, number>()
  for (const gram of questionBigrams) {
    questionCounts.set(gram, (questionCounts.get(gram) ?? 0) + 1)
  }
  for (const gram of contentBigrams) {
    contentCounts.set(gram, (contentCounts.get(gram) ?? 0) + 1)
  }

  const vocabulary = Array.from(new Set([...questionBigrams, ...contentBigrams]))

  let dotProduct = 0
  let questionMagnitudeSquared = 0
  let contentMagnitudeSquared = 0

  for (const gram of vocabulary) {
    const questionWeight = (questionCounts.get(gram) ?? 0) / questionBigrams.length
    const contentWeight = (contentCounts.get(gram) ?? 0) / contentBigrams.length

    dotProduct += questionWeight * contentWeight
    questionMagnitudeSquared += questionWeight * questionWeight
    contentMagnitudeSquared += contentWeight * contentWeight
  }

  const cosine = questionMagnitudeSquared === 0 || contentMagnitudeSquared === 0
    ? 0
    : dotProduct / (Math.sqrt(questionMagnitudeSquared) * Math.sqrt(contentMagnitudeSquared))

  const questionTerms = getCoreQuestionTerms(question)
  const overlapRatio = questionTerms.length === 0
    ? 0
    : questionTerms.filter((term) => normalizedContent.includes(term)).length / questionTerms.length

  const lexicalAnchors = new Set<string>()
  for (let length = 2; length <= Math.min(5, normalizedQuestion.length); length += 1) {
    for (let index = 0; index + length <= normalizedQuestion.length; index += 1) {
      const chunk = normalizedQuestion.slice(index, index + length)
      if (chunk.length >= 2 && !STOP_WORDS.has(chunk)) {
        lexicalAnchors.add(chunk)
      }
    }
  }
  const anchorOverlap = lexicalAnchors.size === 0
    ? 0
    : Array.from(lexicalAnchors).filter((term) => normalizedContent.includes(term)).length / lexicalAnchors.size

  const directPhraseWeight = questionTerms.some((term) => normalizedContent.includes(term)) ? 0.4 : 0
  const exactAnchorMatches = Array.from(lexicalAnchors).filter((term) => normalizedContent.includes(term))
  const anchorMatchBonus = exactAnchorMatches.length === 0
    ? 0
    : Math.min(0.45, exactAnchorMatches.length * 0.18 + 0.12)
  const finalScore = Math.min(1, cosine * 0.55 + overlapRatio * 0.2 + anchorOverlap * 0.45 + directPhraseWeight + anchorMatchBonus)

  return Number(finalScore.toFixed(4))
}

export function scoreDocuments(
  question: string,
  queryVector: number[],
  requestedK: number,
): RetrievalAnalysis {
  const k = Math.max(1, Math.floor(requestedK))
  const corpus = [question, ...documents.map(({ content }) => content)]
  const vocabulary = getCorpusVocabulary(corpus)
  const queryFeatureVector = queryVector.length > 0 ? queryVector : buildTfIdfVector(question, vocabulary, corpus)

  const scoredDocuments = documents.map((document) => {
    const score = computeCharBigramSimilarity(question, document.content)
    return {
      document,
      score,
      selected: false,
    }
  })

  const maxScore = Math.max(0, ...scoredDocuments.map(({ score }) => score))

  return {
    question,
    queryVector: queryFeatureVector,
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

  const ranked = [...scoredDocuments].sort((left, right) => right.score - left.score || left.document.id.localeCompare(right.document.id))
  const topScore = ranked[0]?.score ?? 0
  const minimumAllowedScore = Math.max(SIMILARITY_THRESHOLD, topScore - TOP_SCORE_WINDOW)
  const selectedIds = new Set(
    ranked
      .filter(({ score }) => score >= minimumAllowedScore && score >= SIMILARITY_THRESHOLD)
      .slice(0, k)
      .map(({ document }) => document.id),
  )

  const results = [...scoredDocuments]
    .sort((left, right) => right.score - left.score || left.document.id.localeCompare(right.document.id))
    .map((result) => ({ ...result, selected: selectedIds.has(result.document.id) }))
  const selectedDocuments = results.filter(({ selected }) => selected)
  const finalHeap = ranked.filter(({ document }) => selectedIds.has(document.id))

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

  const questionKeywords = getCoreQuestionTerms(question)
  const priorityKeywords = questionKeywords.filter((term) => term.length >= 3)

  const candidateDocs = selectedDocuments.filter(({ document }) => {
    const content = normalizeText(document.content)
    const matchedTerms = questionKeywords.filter((term) => content.includes(term))

    if (matchedTerms.length >= 2) {
      return true
    }

    if (priorityKeywords.length > 0) {
      return priorityKeywords.some((term) => content.includes(term))
    }

    return matchedTerms.some((term) => term.length >= 3)
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
