/**
 * Renders structured data as a plain <script type="application/ld+json">.
 *
 * `JSON.stringify` does not escape anything that closes a script tag, and the
 * payloads here are built from user-editable content (event titles, profile
 * bios), so `<` is replaced with its unicode escape before the string reaches
 * the DOM — without that, `</script>` inside a bio is an XSS.
 *
 * next/script is deliberately not used: this is data, not executable code.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
