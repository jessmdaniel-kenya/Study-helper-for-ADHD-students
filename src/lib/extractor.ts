// src/lib/extractor.ts
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

const MAX_FILE_BYTES = 25 * 1024 * 1024
type ExtractProgress = (message: string) => void

async function extractPdf(file: File, onProgress?: ExtractProgress) {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = `${pdfWorkerUrl}?v=2`
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
  const pdf = await loadingTask.promise
  const pages: string[] = []
  let ocrWorker: import('tesseract.js').Worker | null = null

  try {
    for (let index = 1; index <= pdf.numPages; index += 1) {
      onProgress?.(`Reading PDF page ${index} of ${pdf.numPages}…`)
      const page = await pdf.getPage(index)
      const content = await page.getTextContent()
      let text = content.items.map((item) => ('str' in item ? item.str : '')).join(' ').trim()

      if (text.length < 25) {
        onProgress?.(`Recognizing text on scanned PDF page ${index} of ${pdf.numPages}…`)
        if (!ocrWorker) {
          const { default: Tesseract } = await import('tesseract.js')
          ocrWorker = await Tesseract.createWorker('eng')
        }
        const baseViewport = page.getViewport({ scale: 1.5 })
        const scale = Math.min(1, 3_000 / Math.max(baseViewport.width, baseViewport.height))
        const viewport = page.getViewport({ scale: 1.5 * scale })
        const canvas = document.createElement('canvas')
        canvas.width = Math.ceil(viewport.width)
        canvas.height = Math.ceil(viewport.height)
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Your browser could not prepare a scanned PDF page for text recognition.')
        await page.render({ canvas, canvasContext: context, viewport }).promise
        const result = await ocrWorker.recognize(canvas)
        text = result.data.text.trim()
        canvas.width = 0
        canvas.height = 0
      }

      pages.push(text)
      page.cleanup()
    }
  } finally {
    if (ocrWorker) await ocrWorker.terminate()
    await loadingTask.destroy()
  }
  return pages.join('\n\n')
}

export async function extractText(file: File, onProgress?: ExtractProgress): Promise<string> {
  if (file.size > MAX_FILE_BYTES) throw new Error('Files must be 25 MB or smaller.')
  const name = file.name.toLowerCase()
  let text = ''

  if (/\.(png|jpe?g|webp)$/.test(name)) {
    onProgress?.('Recognizing text in image…')
    const { default: Tesseract } = await import('tesseract.js')
    const result = await Tesseract.recognize(file, 'eng')
    text = result.data.text
  } else if (name.endsWith('.txt') || name.endsWith('.md')) {
    onProgress?.('Reading text file…')
    text = await file.text()
  } else if (name.endsWith('.docx')) {
    onProgress?.('Reading Word document…')
    const { default: mammoth } = await import('mammoth/mammoth.browser')
    const r = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    text = r.value
  } else if (name.endsWith('.pdf')) {
    text = await extractPdf(file, onProgress)
  } else {
    throw new Error('Please use a PDF, Word (.docx), TXT, MD, PNG, JPG, or WEBP file. Older .doc files need saving as .docx first.')
  }

  if (text.trim().length < 50) {
    throw new Error('We couldn’t find enough readable text in that file. Check that the pages are clear, or paste the text instead.')
  }
  return text
}
