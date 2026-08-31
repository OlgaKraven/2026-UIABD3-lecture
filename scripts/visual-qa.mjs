import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const port = 5393
const base = '/2026-UIABD3-lecture/'
const server = spawn(process.execPath, [path.resolve('node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  cwd: process.cwd(),
  stdio: 'ignore',
  windowsHide: true,
})
const baseUrl = `http://127.0.0.1:${port}${base}`
for (let attempt = 0; attempt < 80; attempt += 1) {
  try {
    const response = await fetch(baseUrl)
    if (response.ok) break
  } catch {
    // Preview is starting.
  }
  await new Promise((resolve) => setTimeout(resolve, 250))
}

const output = path.resolve('outputs', 'qa')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const page = await browser.newPage()
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 360, height: 800 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    await page.screenshot({ path: path.join(output, `catalog-${viewport.width}x${viewport.height}.png`), fullPage: true })
  }

  await page.setViewportSize({ width: 1366, height: 768 })
  for (const slide of [1, 13, 77, 85]) {
    await page.goto(`${baseUrl}?topic=s06-01-client-server-admin-role&slide=${slide}`, { waitUntil: 'networkidle' })
    await page.screenshot({ path: path.join(output, `slide-${slide}-1366x768.png`), fullPage: true })
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${baseUrl}?topic=s06-01-client-server-admin-role&slide=1`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: path.join(output, 'slide-1-390x844.png'), fullPage: true })
  console.log(output)
} finally {
  await browser.close()
  server.kill()
}

