import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, isFirebaseConfigured } from '@/lib/firebase-admin'

/**
 * POST /api/admin/sources/[id]/reject - Reject a source
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

    // Get admin info and reason from request body
    let adminId = 'admin'
    let reason = ''
    try {
      const body = await request.json()
      if (body.adminId) adminId = body.adminId
      if (body.reason) reason = body.reason
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

    if (sourceData.status !== 'pending' && sourceData.status !== 'error') {
      return NextResponse.json(
        { error: `Cannot reject source with status: ${sourceData.status}` },
        { status: 400 }
      )
    }

    // Update source as rejected
    await docRef.update({
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: adminId,
      rejectionReason: reason || undefined,
      // Remove fileData to save space
      fileData: null,
    })

    return NextResponse.json({
      success: true,
      message: 'Source rejected',
    })
  } catch (error) {
    console.error('Error rejecting source:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reject source' },
      { status: 500 }
    )
  }
}
