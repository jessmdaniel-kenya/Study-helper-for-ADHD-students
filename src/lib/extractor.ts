import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import mammoth from 'mammoth/mammoth.browser'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

// Reads the text out of a PDF, Word (.docx), TXT or MD file, in the browser.
export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  let text = ''

  if (file.type.startsWith('image/')) {
    throw new Error('Images can’t be read yet because text-in-image reading isn’t built. Paste the text instead, or use a PDF, Word or TXT file.')
  }

  if (name.endsWith('.txt') || name.endsWith('.md')) {
    text = await file.text()
  } else if (name.endsWith('.docx')) {
    const r = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    text = r.value
  } else if (name.endsWith('.pdf')) {
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
    const pages: string[] = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const content = await (await pdf.getPage(i)).getTextContent()
      pages.push(content.items.map((it) => ('str' in it ? it.str : '')).join(' '))
    }
    text = pages.join('\n\n')
  } else {
    throw new Error('Please use a PDF, Word (.docx), TXT or MD file. Older .doc files need saving as .docx first.')
  }

  if (text.trim().length < 50) {
    throw new Error('We couldn’t find readable text in that file. Scanned pages are pictures, so paste the text instead.')
  }
  return text
}