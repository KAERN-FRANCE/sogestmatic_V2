import { getAdminDb, isFirebaseConfigured } from '@/lib/firebase-admin'

/**
 * Extract URLs from AI response text (markdown links)
 */
export function extractUrlsFromResponse(text: string): Array<{ title: string; url: string }> {
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g
  const results: Array<{ title: string; url: string }> = []
  const seenUrls = new Set<string>()

  let match
  while ((match = linkRegex.exec(text)) !== null) {
    const [, title, url] = match

    // Normalize URL (remove trailing slashes, query params for dedup)
    const normalizedUrl = url.split('?')[0].replace(/\/$/, '')

    if (!seenUrls.has(normalizedUrl)) {
      seenUrls.add(normalizedUrl)
      results.push({ title: title.trim(), url })
    }
  }

  return results
}

/**
 * Check if a URL is from an allowed domain (official sources only)
 */
export function isAllowedSource(url: string): boolean {
  const allowedDomains = [
    'legifrance.gouv.fr',
    'service-public.fr',
    'urssaf.fr',
    'ameli.fr',
    'travail-emploi.gouv.fr',
    'securite-sociale.fr',
    'impots.gouv.fr',
    'eur-lex.europa.eu',
    'journal-officiel.gouv.fr',
    'gouvernement.fr',
    'economie.gouv.fr',
    'transports.gouv.fr',
    'ecologie.gouv.fr',
    'data.gouv.fr',
    'insee.fr',
  ]

  const loweredUrl = url.toLowerCase()
  return allowedDomains.some(domain => loweredUrl.includes(domain))
}

/**
 * Submit a URL source found by AI for admin validation
 * Returns true if submitted, false if already exists or skipped
 */
export async function submitAISource(
  url: string,
  title: string,
  category: string = 'auto-detected'
): Promise<{ submitted: boolean; reason?: string }> {
  if (!isFirebaseConfigured()) {
    return { submitted: false, reason: 'Firebase not configured' }
  }

  // Only submit allowed official sources
  if (!isAllowedSource(url)) {
    return { submitted: false, reason: 'Source not from allowed domain' }
  }

  try {
    const db = getAdminDb()

    // Check if URL already exists (any status)
    const existing = await db.collection('ai_sources')
      .where('url', '==', url)
      .limit(1)
      .get()

    if (!existing.empty) {
      return { submitted: false, reason: 'URL already exists' }
    }

    // Submit new source
    await db.collection('ai_sources').add({
      title,
      category,
      type: 'url',
      status: 'pending',
      url,
      submittedBy: 'ai-assistant',
      submittedByEmail: 'ia@sogestmatic.com',
      submittedAt: new Date().toISOString(),
    })

    console.log(`📥 [AI] Source soumise pour validation: ${url}`)
    return { submitted: true }
  } catch (error) {
    console.error('Error submitting AI source:', error)
    return { submitted: false, reason: 'Database error' }
  }
}

/**
 * Process AI response and submit found sources for validation
 * Called after each AI response
 */
export async function processAndSubmitSources(responseText: string): Promise<number> {
  const urls = extractUrlsFromResponse(responseText)
  let submittedCount = 0

  for (const { title, url } of urls) {
    const result = await submitAISource(url, title)
    if (result.submitted) {
      submittedCount++
    }
  }

  if (submittedCount > 0) {
    console.log(`📊 [AI] ${submittedCount} nouvelle(s) source(s) soumise(s) pour validation`)
  }

  return submittedCount
}
