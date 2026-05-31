/**
 * Pre-render public pages to static HTML for SEO.
 * Runs after `vite build` — spins up a local server, navigates to each
 * public route with Puppeteer, captures the rendered HTML, and writes
 * it to dist/ so Googlebot sees real content.
 *
 * Usage: node scripts/prerender.mjs
 */

import { readFile, writeFile, mkdir } from 'fs/promises'
import { resolve as pathResolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'http'
import puppeteer from 'puppeteer'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = pathResolve(__dirname, '../dist')

const ROUTES = [
  { path: '/', file: 'index.html' },
  { path: '/privacy', file: 'privacy/index.html' },
  { path: '/terms', file: 'terms/index.html' },
  { path: '/docs', file: 'docs/index.html' },
  { path: '/quick-score', file: 'quick-score/index.html' },
]

const MIME_TYPES = {
  html: 'text/html',
  js: 'application/javascript',
  css: 'text/css',
  png: 'image/png',
  svg: 'image/svg+xml',
  json: 'application/json',
  wasm: 'application/wasm',
  ico: 'image/x-icon',
}

// Tiny static file server for dist/
function serveDist() {
  return new Promise((resolveServer) => {
    const server = createServer(async (req, res) => {
      const urlPath = (req.url || '/').split('?')[0]
      let filePath = pathResolve(DIST, '.' + urlPath)

      // If the path doesn't have an extension, serve index.html (SPA fallback)
      if (!urlPath.includes('.')) {
        filePath = pathResolve(DIST, 'index.html')
      }

      try {
        const data = await readFile(filePath)
        const ext = filePath.split('.').pop()
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' })
        res.end(data)
      } catch {
        // SPA fallback
        const fallback = await readFile(pathResolve(DIST, 'index.html'))
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(fallback)
      }
    })

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      resolveServer({ server, port })
    })
  })
}

async function prerender() {
  console.log('[prerender] Starting...')

  const { server, port } = await serveDist()
  const baseUrl = `http://127.0.0.1:${port}`

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })

  for (const route of ROUTES) {
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800 })

    const url = `${baseUrl}${route.path}`
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })

    // Wait for React to mount
    await page.waitForSelector('#root > *', { timeout: 10000 }).catch(() => {
      console.log(`[prerender] Warning: #root empty for ${route.path}`)
    })

    // Small delay for any lazy content
    await new Promise(r => setTimeout(r, 500))

    const html = await page.content()

    // Ensure directory exists, then write
    const outPath = pathResolve(DIST, route.file)
    await mkdir(dirname(outPath), { recursive: true })
    await writeFile(outPath, html, 'utf-8')
    console.log(`[prerender] ${route.file} — ${(html.length / 1024).toFixed(1)}KB`)

    await page.close()
  }

  await browser.close()
  server.close()
  console.log('[prerender] Done —', ROUTES.length, 'pages pre-rendered')
}

prerender().catch(err => {
  console.error('[prerender] Failed:', err.message)
  process.exit(1)
})
