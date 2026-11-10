// Run: node --test src/lib/sanitize.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeHtml } from "./sanitize.ts";

test("keeps formatting, drops scripts, handlers and unknown tags", () => {
  const dirty = `<p class="x" onclick="evil()">متن <n>1</n></p><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">link</a><br/><STYLE>p{}</STYLE>`;
  assert.equal(sanitizeHtml(dirty), "<p>متن <n>1</n></p>link<br>");
});
