// Tafseer HTML comes from a third-party site and is inserted with dangerouslySetInnerHTML,
// so only plain formatting tags survive, with no attributes.
const ALLOWED = new Set(["p", "br", "n", "b", "strong", "i", "em", "span", "sup", "sub"]);

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<(script|style|iframe|object|embed|template|noscript)[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (tag, name: string) => {
      const n = name.toLowerCase();
      if (!ALLOWED.has(n)) return "";
      return tag.startsWith("</") ? `</${n}>` : n === "br" ? "<br>" : `<${n}>`;
    });
}
