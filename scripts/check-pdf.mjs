import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { PDFDocument } from 'pdf-lib'

const course=JSON.parse(await readFile('public/course.json','utf8'))
const expected=new Map(course.lectures.map(l=>[l.id,l.slides.length]))
const roots = [path.resolve(process.argv[2]||'outputs/pdf/student')]
let checked = 0
for (const root of roots) {
  let entries = []
  try {
    entries = await readdir(root)
  } catch {
    continue
  }
  for (const entry of entries.filter((name) => name.endsWith('.pdf'))) {
    const file = path.join(root, entry)
    const pdf = await PDFDocument.load(await readFile(file))
    const count=expected.get(entry.replace(/\.pdf$/,''))
    if (!count||pdf.getPageCount() !== count) throw new Error(`${file}: expected ${count} pages, got ${pdf.getPageCount()}`)
    checked += 1
  }
}
if (!checked) throw new Error('No exported PDFs found')
console.log(`PDF page-count check passed: ${checked} files, current lecture lengths`)

