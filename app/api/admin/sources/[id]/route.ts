import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, isFirebaseConfigured } from '@/lib/firebase-admin'
import { removeSource } from '@/lib/rag-indexer'

/**
 * DELETE /api/admin/sources/[id] - Delete a source and its chunks
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isFirebaseConfigured()) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 })
    }

    const { id } = await params

    const db = getAdminDb()
    const docRef = db.collection('ai_sources').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 })
    }

    const sourceData = doc.data()!

    // If source was approved, remove chunks from RAG index
    if (sourceData.status === 'approved' && sourceData.chunkIds && sourceData.chunkIds.length > 0) {
      await removeSource(sourceData.chunkIds)
    }

    // Delete the Firestore document
    await docRef.delete()

    return NextResponse.json({
      success: true,
      message: 'Source deleted',
      chunksRemoved: sourceData.chunkIds?.length || 0,
    })
  } catch (error) {
    console.error('Error deleting source:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete source' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/sources/[id] - Get a single source
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isFirebaseConfigured()) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 })
    }

    const { id } = await params

    const db = getAdminDb()
    const doc = await db.collection('ai_sources').doc(id).get()

    if (!doc.exists) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 })
    }

    const data = doc.data()!

    return NextResponse.json({
      success: true,
      source: {
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
        errorMessage: data.errorMessage,
      },
    })
  } catch (error) {
    console.error('Error getting source:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get source' },
      { status: 500 }
    )
  }
}
