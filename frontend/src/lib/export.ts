export function copyAsMarkdown(text: string): void {
  navigator.clipboard.writeText(text);
}

export function copyAsPlainText(text: string): void {
  const plain = text.replace(/[#*_`~\[\]]/g, '');
  navigator.clipboard.writeText(plain);
}

export function copyAsJSON(data: Record<string, unknown>): void {
  navigator.clipboard.writeText(JSON.stringify(data, null, 2));
}

export function downloadAsFile(content: string, filename: string, type: string = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadAsTxt(text: string, filename: string = 'content.txt') {
  downloadAsFile(text, filename, 'text/plain');
}

export function downloadAsMd(text: string, filename: string = 'content.md') {
  downloadAsFile(text, filename, 'text/markdown');
}

export function downloadAsJSON(data: Record<string, unknown>, filename: string = 'content.json') {
  downloadAsFile(JSON.stringify(data, null, 2), filename, 'application/json');
}

export function exportQueueAsJSON(queue: Array<Record<string, unknown>>) {
  downloadAsJSON({ exportedAt: new Date().toISOString(), items: queue }, `mint-publish-queue-${Date.now()}.json`);
}
