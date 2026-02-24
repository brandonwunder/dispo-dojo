import puppeteer from 'puppeteer'
import { mkdirSync, readdirSync } from 'fs'
import { join } from 'path'

const url = process.argv[2] || 'http://localhost:3000'
const label = process.argv[3] || ''
const width = parseInt(process.argv[4]) || 1440
const height = parseInt(process.argv[5]) || 900

const dir = './temporary screenshots'
mkdirSync(dir, { recursive: true })

const existing = readdirSync(dir).filter(f => f.startsWith('screenshot-'))
const nextNum = existing.length > 0
  ? Math.max(...existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0'))) + 1
  : 1

const filename = label
  ? `screenshot-${nextNum}-${label}.png`
  : `screenshot-${nextNum}.png`

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width, height })
await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 })
await new Promise(r => setTimeout(r, 2000))
await page.screenshot({ path: join(dir, filename), fullPage: true })
await browser.close()

console.log(`Screenshot saved: ${join(dir, filename)}`)
