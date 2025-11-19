import MarkdownIt from "markdown-it"

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: false,
})

export function renderMarkdownToSafeHtml(text: string): string {
  const safeText = typeof text === "string" ? text : String(text ?? "")
  try {
    return md.render(safeText)
  } catch {
    // En cas d'erreur, retourner du texte échappé minimalement
    return md.render(safeText.replace(/</g, "&lt;").replace(/>/g, "&gt;"))
  }
}


