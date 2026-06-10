// 媒体上传封装
// 把前端 File 读取成 data URL（base64），POST 给 cloud function 的 upload_media 接口
// 限制 4MB（图片和短视频都够用）

import { callFunction } from './http'
import type { MediaItem } from './types'

interface UploadResult {
  url: string
  download_url: string
  cloudPath: string
  size: number
  mediaType: 'image' | 'video'
}

/** 把 File 转成 data URL（base64） */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

/** 根据 MIME / 文件名判断是图片还是视频 */
function detectMediaType(file: File): 'image' | 'video' {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  // 兜底按扩展名判断
  const lower = file.name.toLowerCase()
  if (/\.(mp4|mov|webm|m4v|avi|mkv)$/.test(lower)) return 'video'
  return 'image'
}

/** 上传单个文件，返回 MediaItem（可塞进 Property.media） */
export async function uploadFile(file: File): Promise<MediaItem> {
  const mediaType = detectMediaType(file)
  // 4MB 预检：避免读完整个大文件才报错
  if (file.size > 4 * 1024 * 1024) {
    throw new Error(
      `文件 ${(file.size / 1024 / 1024).toFixed(1)}MB 超过 4MB 上限，请压缩后再上传`,
    )
  }
  const dataUrl = await fileToDataUrl(file)
  const result = await callFunction<UploadResult>(
    'properties',
    {
      action: 'upload_media',
      fileName: file.name,
      dataUrl,
      mediaType,
    },
    { requireAuth: true },
  )
  return {
    type: mediaType,
    url: result.download_url,
    name: file.name,
  }
}

/** 批量上传 */
export async function uploadFiles(files: File[]): Promise<MediaItem[]> {
  const out: MediaItem[] = []
  for (const f of files) {
    out.push(await uploadFile(f))
  }
  return out
}
