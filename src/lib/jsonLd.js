// Safely serializes a value for embedding in a <script type="application/ld+json">
// tag via dangerouslySetInnerHTML. JSON.stringify does not escape `<`, so a value
// containing user-submitted text like `</script><script>...` can break out of the
// tag and execute arbitrary JS. Escaping `<` prevents the tag from ever closing early.
export function safeJsonLd(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
