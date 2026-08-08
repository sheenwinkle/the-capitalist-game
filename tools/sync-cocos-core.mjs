import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = resolve(root, 'packages/core/src')
const target = resolve(root, 'apps/cocos/the-capitalist-cocos/assets/scripts/core')

rmSync(target, { recursive: true, force: true })
mkdirSync(target, { recursive: true })
cpSync(source, target, {
  recursive: true,
  filter: (path) => !basename(path).endsWith('.test.ts'),
})

console.log(`Synced Cocos core scripts to ${target}`)
