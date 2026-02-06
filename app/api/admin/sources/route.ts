import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, isFirebaseConfigured } from '@/lib/firebase-admin'

export interface AISource {
  id: string
  title: string
  category: string
  type: 'pdf' | 'url'
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'error'
  url?: string
  fileName?: string
  fileData?: string // Base64 encoded PDF
  submittedBy: string
  submittedByEmail: string
  submittedAt: string
  processedAt?: string
  processedBy?: string
  rejectedAt?: string
  rejectedBy?: string
  chunkCount?: number
  chunkIds?: string[]
  errorMessage?: string
}

/**
 * POST /api/admin/sources - Create a new source
 */
export async function POST(request: NextRequest) {
  try {
    if (!isFirebaseConfigured()) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 })
    }

    const formData = await request.formData()
    const title = formData.get('title') as string
    const category = formData.get('category') as string || ''
    const type = formData.get('type') as 'pdf' | 'url'
    const url = formData.get('url') as string || ''
    const submittedBy = formData.get('submittedBy') as string || 'admin'
    const submittedByEmail = formData.get('submittedByEmail') as string || 'admin@sogestmatic.com'
    const file = formData.get('file') as File | null

    // Validation
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (type === 'url' && !url) {
      return NextResponse.json({ error: 'URL is required for URL sources' }, { status: 400 })
    }

    if (type === 'pdf' && !file) {
      return NextResponse.json({ error: 'File is required for PDF sources' }, { status: 400 })
    }

    // Prepare source data
    const sourceData: Omit<AISource, 'id'> = {
      title,
      category,
      type,
      status: 'pending',
      url: url || undefined,
      submittedBy,
      submittedByEmail,
      submittedAt: new Date().toISOString(),
    }

    // Handle PDF upload
    if (type === 'pdf' && file) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      sourceData.fileData = buffer.toString('base64')
      sourceData.fileName = file.name
    }

    // Save to Firestore
    const db = getAdminDb()
    const docRef = await db.collection('ai_sources').add(sourceData)

    const source: AISource = {
      id: docRef.id,
      ...sourceData,
    }

    return NextResponse.json({ success: true, source })
  } catch (error) {
    console.error('Error creating source:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create source' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/sources - List sources
 */
export async function GET(request: NextRequest) {
  try {
    if (!isFirebaseConfigured()) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const limitParam = parseInt(searchParams.get('limit') || '50', 10)

    const db = getAdminDb()
    let query = db.collection('ai_sources').orderBy('submittedAt', 'desc')

    if (status !== 'all') {
      query = query.where('status', '==', status)
    }

    query = query.limit(limitParam)

    const snapshot = await query.get()
    const sources: AISource[] = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      sources.push({
        id: doc.id,
        title: data.title,
        category: data.category,
        type: data.type,
        status: data.status,
        url: data.url,
        fileName: data.fileName,
        submittedBy: data.submittedBy,
        submittedByEmail: data.submittedByEmail,
        submittedAt: data.submittedAt,
        processedAt: data.processedAt,
        processedBy: data.processedBy,
        rejectedAt: data.rejectedAt,
        rejectedBy: data.rejectedBy,
        chunkCount: data.chunkCount,
        chunkIds: data.chunkIds,
        errorMessage: data.errorMessage,
      })
    })

    return NextResponse.json({ success: true, sources })
  } catch (error) {
    console.error('Error listing sources:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list sources' },
      { status: 500 }
    )
  }
}
