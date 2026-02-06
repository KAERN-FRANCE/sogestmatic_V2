import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, isFirebaseConfigured } from '@/lib/firebase-admin'
import { addSource, extractFromUrl, extractFromPdf } from '@/lib/rag-indexer'

/**
 * POST /api/admin/sources/[id]/approve - Approve and index a source
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isFirebaseConfigured()) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 })
    }

    const { id } = await params

    // Get admin info from request body (optional)
    let adminId = 'admin'
    let adminEmail = 'admin@sogestmatic.com'
    try {
      const body = await request.json()
      if (body.adminId) adminId = body.adminId
      if (body.adminEmail) adminEmail = body.adminEmail
    } catch {
      // No body provided, use defaults
    }

    const db = getAdminDb()
    const docRef = db.collection('ai_sources').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 })
    }

    const sourceData = doc.data()!

    if (sourceData.status !== 'pending') {
      return NextResponse.json(
        { error: `Source is already ${sourceData.status}` },
        { status: 400 }
      )
    }

    // Set status to processing
    await docRef.update({ status: 'processing' })

    try {
      let text: string

      if (sourceData.type === 'url') {
        // Extract text from URL
        if (!sourceData.url) {
          throw new Error('URL is missing')
        }
        text = await extractFromUrl(sourceData.url)
      } else if (sourceData.type === 'pdf') {
        // Extract text from PDF
        if (!sourceData.fileData) {
          throw new Error('PDF data is missing')
        }
        const buffer = Buffer.from(sourceData.fileData, 'base64')
        text = await extractFromPdf(buffer)
      } else {
        throw new Error('Unknown source type')
      }

      if (!text || text.length < 100) {
        throw new Error('Extracted text is too short (minimum 100 characters)')
      }

      // Add to RAG index
      const sourceName = sourceData.type === 'pdf'
        ? sourceData.fileName || sourceData.title
        : sourceData.url || sourceData.title

      const chunkIds = await addSource(id, sourceName, text)

      // Update source as approved
      await docRef.update({
        status: 'approved',
        processedAt: new Date().toISOString(),
        processedBy: adminId,
        chunkCount: chunkIds.length,
        chunkIds: chunkIds,
        // Remove fileData to save space (optional)
        fileData: null,
      })

      return NextResponse.json({
        success: true,
        message: `Source approved and indexed with ${chunkIds.length} chunks`,
        chunkCount: chunkIds.length,
      })
    } catch (processingError) {
      // Mark as error
      await docRef.update({
        status: 'error',
        errorMessage: processingError instanceof Error
          ? processingError.message
          : 'Unknown processing error',
      })

      return NextResponse.json(
        {
          error: 'Processing failed',
          details: processingError instanceof Error ? processingError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error approving source:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to approve source' },
      { status: 500 }
    )
  }
}
