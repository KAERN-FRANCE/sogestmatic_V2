import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Chemin des données (Railway Volume ou local)
const DATA_PATH = process.env.DATA_PATH || path.join(process.cwd(), 'data')
const filePath = path.join(DATA_PATH, 'detected-sources.json')

interface DetectedSource {
  id: string
  url: string
  title: string
  detectedAt: string
  context: string
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(DATA_PATH, { recursive: true })
  }
}

function readSources(): DetectedSource[] {
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

function writeSources(sources: DetectedSource[]) {
  ensureDataDir()
  fs.writeFileSync(filePath, JSON.stringify({ sources }, null, 2))
}

// GET - Récupérer toutes les sources détectées
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

// POST - Effacer toutes les sources
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

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
