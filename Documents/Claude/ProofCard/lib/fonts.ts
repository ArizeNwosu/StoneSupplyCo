// lib/fonts.ts
import { readFile } from 'fs/promises'
import nodePath from 'path'

let interRegular: ArrayBuffer | null = null
let interBold: ArrayBuffer | null = null

export async function getFonts() {
  if (!interRegular) {
    const buf = await readFile(nodePath.join(process.cwd(), 'public/fonts/Inter-Regular.woff'))
    interRegular = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
  }
  if (!interBold) {
    const buf = await readFile(nodePath.join(process.cwd(), 'public/fonts/Inter-Bold.woff'))
    interBold = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
  }
  return [
    { name: 'Inter', data: interRegular, weight: 400 as const, style: 'normal' as const },
    { name: 'Inter', data: interBold,    weight: 900 as const, style: 'normal' as const },
  ]
}
