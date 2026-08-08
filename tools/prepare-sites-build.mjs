import {
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
const client = resolve(dist, 'client')
const server = resolve(dist, 'server')

if (!existsSync(dist)) {
  throw new Error('Vite output is missing. Run this script after vite build.')
}

mkdirSync(client, { recursive: true })

for (const entry of readdirSync(dist)) {
  if (entry === 'client' || entry === 'server') continue
  renameSync(resolve(dist, entry), resolve(client, entry))
}

mkdirSync(server, { recursive: true })
writeFileSync(
  resolve(server, 'index.js'),
  `const worker = {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request)
    if (response.status !== 404 || request.method !== 'GET') return response
    return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request))
  },
}

export default worker
`,
  'utf8',
)
