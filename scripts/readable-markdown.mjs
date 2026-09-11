import { JSDOM } from 'jsdom'

// The same rendered body used by the native HTML page, made readable without
// scripts, CSS or interactive widgets. No remote fetches or transcript synthesis.
export function readableMarkdown(html, baseUrl) {
  const doc = new JSDOM(html).window.document
  function render(node) {
    if (node.nodeType === 3) return node.textContent.replace(/\s+/g, ' ')
    if (node.nodeType !== 1) return ''
    const tag = node.tagName.toLowerCase()
    if (['script', 'style', 'iframe', 'noscript', 'template'].includes(tag) || node.hasAttribute('hidden') || node.getAttribute('aria-hidden') === 'true') return ''
    if (tag === 'svg') return node.getAttribute('aria-label') ? `\n\nDiagram: ${node.getAttribute('aria-label')}\n\n` : ''
    const children = () => [...node.childNodes].map(render).join('')
    const href = (value) => {
      try {
        const url = new URL(value, baseUrl)
        if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return ''
        if (url.origin === new URL(baseUrl).origin && !url.pathname.endsWith('/') && !/\.[\w]+$/.test(url.pathname)) url.pathname += '/'
        return url.href
      } catch { return '' }
    }
    if (tag === 'a') {
      const url = href(node.getAttribute('href') || '')
      return url ? `[${children().trim()}](${url})` : children()
    }
    if (tag === 'img') return node.getAttribute('alt') ? `\n\nImage: ${node.getAttribute('alt')}\n\n` : ''
    if (tag === 'pre') return `\n\n\`\`\`\n${node.textContent.trim()}\n\`\`\`\n\n`
    if (tag === 'code') return `\`${node.textContent}\``
    if (tag === 'br') return '\n'
    if (tag === 'hr') return '\n\n---\n\n'
    if (/^h[1-6]$/.test(tag)) return `\n\n${'#'.repeat(Number(tag[1]))} ${children().trim()}\n\n`
    if (['strong', 'b'].includes(tag)) return `**${children()}**`
    if (['em', 'i'].includes(tag)) return `*${children()}*`
    if (tag === 'li') return `\n${node.parentElement.tagName === 'OL' ? '1.' : '-'} ${children().trim()}\n`
    if (tag === 'td' || tag === 'th') return `${children().trim()} | `
    if (tag === 'tr') return `\n| ${children()}\n`
    if (tag === 'blockquote') return `\n\n> ${children().trim().replace(/\n/g, '\n> ')}\n\n`
    if (['p', 'div', 'section', 'figure', 'ul', 'ol', 'table'].includes(tag)) return `\n\n${children().trim()}\n\n`
    return children()
  }
  return [...doc.body.childNodes].map(render).join('').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}
