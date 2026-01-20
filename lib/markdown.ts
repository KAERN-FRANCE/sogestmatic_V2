import MarkdownIt from "markdown-it"

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true, // Convertir les sauts de ligne simples en <br>
  typographer: true, // Améliorer la typographie (guillemets, tirets, etc.)
})

// Ouvrir tous les liens dans un nouvel onglet pour éviter de perdre la conversation
const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, _env, self) {
  return self.renderToken(tokens, idx, options)
}

md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
  const token = tokens[idx]
  // Ajouter target="_blank" et rel="noopener noreferrer" à tous les liens
  token.attrSet('target', '_blank')
  token.attrSet('rel', 'noopener noreferrer')
  return defaultRender(tokens, idx, options, env, self)
}

export function renderMarkdownToSafeHtml(text: string): string {
  const safeText = typeof text === "string" ? text : String(text ?? "")
  try {
    return md.render(safeText)
  } catch {
    // En cas d'erreur, retourner du texte échappé minimalement
    return md.render(safeText.replace(/</g, "&lt;").replace(/>/g, "&gt;"))
  }
}


