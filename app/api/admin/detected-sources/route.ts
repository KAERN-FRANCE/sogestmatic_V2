import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Chemin des données (Railway Volume ou local)
const DATA_PATH = process.env.DATA_PATH || path.join(process.cwd(), 'data')
const filePath = path.join(DATA_PATH, 'sources.json')

// Source unifiée : détectée automatiquement ou soumise manuellement
interface Source {
  id: string
  title: string
  url?: string
  type: 'url' | 'pdf' | 'detected'  // detected = source citée par l'IA
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'error'

  // Champs pour sources détectées automatiquement
  detectedAt?: string
  context?: string

  // Champs pour sources soumises manuellement
  category?: string
  fileName?: string
  fileData?: string  // PDF en base64
  submittedBy?: string
  submittedByEmail?: string
  submittedAt?: string

  // Champs après traitement
  processedAt?: string
  processedBy?: string
  rejectedAt?: string
  rejectedBy?: string
  chunkCount?: number
  chunkIds?: string[]
  errorMessage?: string
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(DATA_PATH, { recursive: true })
  }
}

function readSources(): Source[] {
  try {
    ensureDataDir()
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      return data.sources || []
    }
  } catch (error) {
    console.error('Erreur lecture sources:', error)
  }
  return []
}

function writeSources(sources: Source[]) {
  ensureDataDir()
  fs.writeFileSync(filePath, JSON.stringify({ sources }, null, 2))
}

// GET - Récupérer toutes les sources
export async function GET() {
  const sources = readSources()
  return NextResponse.json({ ok: true, sources })
}

// DELETE - Supprimer une source par ID
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID requis' }, { status: 400 })
    }

    const sources = readSources()
    const filtered = sources.filter(s => s.id !== id)
    writeSources(filtered)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erreur suppression source:', error)
    return NextResponse.json({ ok: false, error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Ajouter une source ou action spéciale
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    // Gestion du FormData (upload de fichier)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const title = formData.get('title') as string
      const category = formData.get('category') as string
      const type = formData.get('type') as 'url' | 'pdf'
      const url = formData.get('url') as string | null
      const submittedBy = formData.get('submittedBy') as string
      const submittedByEmail = formData.get('submittedByEmail') as string
      const file = formData.get('file') as File | null

      if (!title) {
        return NextResponse.json({ ok: false, error: 'Titre requis' }, { status: 400 })
      }

      if (type === 'url' && !url) {
        return NextResponse.json({ ok: false, error: 'URL requise' }, { status: 400 })
      }

      const sources = readSources()
      const newSource: Source = {
        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
        title,
        type,
        status: 'approved', // Sources manuelles directement approuvées
        category,
        url: url || undefined,
        submittedBy,
        submittedByEmail,
        submittedAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
        processedBy: submittedBy,
      }

      // Si c'est un PDF, lire et encoder en base64
      if (type === 'pdf' && file) {
        const buffer = Buffer.from(await file.arrayBuffer())
        newSource.fileData = buffer.toString('base64')
        newSource.fileName = file.name
      }

      sources.unshift(newSource)
      writeSources(sources)

      return NextResponse.json({ ok: true, source: newSource })
    }

    // Gestion du JSON classique
    const body = await request.json()
    const { action } = body

    if (action === 'clear-all') {
      writeSources([])
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, error: 'Action inconnue' }, { status: 400 })
  } catch (error) {
    console.error('Erreur action sources:', error)
    return NextResponse.json({ ok: false, error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour le status d'une source (approve/reject)
export async function PUT(request: NextRequest) {
  try {
    const { id, action, adminId, adminEmail } = await request.json()

    if (!id || !action) {
      return NextResponse.json({ ok: false, error: 'ID et action requis' }, { status: 400 })
    }

    const sources = readSources()
    const sourceIndex = sources.findIndex(s => s.id === id)

    if (sourceIndex === -1) {
      return NextResponse.json({ ok: false, error: 'Source non trouvée' }, { status: 404 })
    }

    if (action === 'approve') {
      sources[sourceIndex].status = 'approved'
      sources[sourceIndex].processedAt = new Date().toISOString()
      sources[sourceIndex].processedBy = adminId || 'admin'
    } else if (action === 'reject') {
      sources[sourceIndex].status = 'rejected'
      sources[sourceIndex].rejectedAt = new Date().toISOString()
      sources[sourceIndex].rejectedBy = adminId || 'admin'
    } else if (action === 'processing') {
      sources[sourceIndex].status = 'processing'
    } else if (action === 'error') {
      sources[sourceIndex].status = 'error'
      sources[sourceIndex].errorMessage = adminEmail || 'Erreur inconnue'
    } else {
      return NextResponse.json({ ok: false, error: 'Action invalide' }, { status: 400 })
    }

    writeSources(sources)
    return NextResponse.json({ ok: true, source: sources[sourceIndex] })
  } catch (error) {
    console.error('Erreur mise à jour source:', error)
    return NextResponse.json({ ok: false, error: 'Erreur serveur' }, { status: 500 })
  }
}
