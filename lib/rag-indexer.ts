import fs from 'fs'
import path from 'path'
import OpenAI from 'openai'

// Types
interface IndexEntry {
  id: string
  source: string
  text: string
  embedding: number[]
}

interface RAGIndex {
  model: string
  index: IndexEntry[]
}

// Lazy OpenAI client initialization
let _client: OpenAI | null = null
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    })
  }
  return _client
}

const INDEX_PATH = path.join(process.cwd(), 'data', 'index.json')
const EMBEDDING_MODEL = 'text-embedding-3-small'
const CHUNK_SIZE = 800
const CHUNK_OVERLAP = 100

/**
 * Load the current RAG index
 */
export async function loadIndex(): Promise<RAGIndex> {
  if (!fs.existsSync(INDEX_PATH)) {
    return { model: EMBEDDING_MODEL, index: [] }
  }
  const content = fs.readFileSync(INDEX_PATH, 'utf8')
  return JSON.parse(content) as RAGIndex
}

/**
 * Save the RAG index (atomic write via temp file)
 */
export async function saveIndex(index: RAGIndex): Promise<void> {
  const tempPath = INDEX_PATH + '.tmp'
  fs.writeFileSync(tempPath, JSON.stringify(index, null, 2), 'utf8')
  fs.renameSync(tempPath, INDEX_PATH)
}

/**
 * Extract text from a URL
 */
export async function extractFromUrl(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Sogestmatic/1.0)',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
  }

  const html = await response.text()

  // Simple HTML to text extraction
  let text = html
    // Remove scripts and styles
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()

  return text
}

/**
 * Extract text from a PDF buffer
 */
export async function extractFromPdf(buffer: Buffer): Promise<string> {
  // Dynamic import to avoid issues with server-side rendering
  const pdfParse = (await import('pdf-parse')).default
  const data = await pdfParse(buffer)
  return data.text
}

/**
 * Chunk text with overlap
 */
export function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    const chunk = text.slice(start, end).trim()

    if (chunk.length > 50) { // Minimum chunk size
      chunks.push(chunk)
    }

    start += chunkSize - overlap
  }

  return chunks
}

/**
 * Generate embeddings for text chunks
 */
export async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
  if (chunks.length === 0) return []

  // OpenAI allows up to 2048 inputs per request
  const batchSize = 100
  const allEmbeddings: number[][] = []
  const client = getClient()

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    })

    for (const item of response.data) {
      allEmbeddings.push(item.embedding)
    }
  }

  return allEmbeddings
}

/**
 * Add a source to the RAG index
 * Returns the chunk IDs created
 */
export async function addSource(sourceId: string, sourceName: string, text: string): Promise<string[]> {
  const chunks = chunkText(text)

  if (chunks.length === 0) {
    throw new Error('No valid chunks could be created from the text')
  }

  const embeddings = await generateEmbeddings(chunks)

  const index = await loadIndex()
  const chunkIds: string[] = []

  for (let i = 0; i < chunks.length; i++) {
    const chunkId = `${sourceId}::${i}`
    chunkIds.push(chunkId)

    index.index.push({
      id: chunkId,
      source: sourceName,
      text: chunks[i],
      embedding: embeddings[i],
    })
  }

  await saveIndex(index)

  return chunkIds
}

/**
 * Remove chunks from the RAG index by their IDs
 */
export async function removeSource(chunkIds: string[]): Promise<void> {
  if (chunkIds.length === 0) return

  const index = await loadIndex()
  const idsSet = new Set(chunkIds)

  index.index = index.index.filter(entry => !idsSet.has(entry.id))

  await saveIndex(index)
}

/**
 * Check if a source already exists in the index
 */
export async function sourceExists(sourceId: string): Promise<boolean> {
  const index = await loadIndex()
  return index.index.some(entry => entry.id.startsWith(`${sourceId}::`))
}
