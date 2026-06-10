import { useRef, useState } from 'react'
import type { MediaItem } from '../lib/types'
import { uploadFile } from '../lib/upload'

interface Props {
  value: MediaItem[]
  onChange: (items: MediaItem[]) => void
  /** 是否禁用（保存中） */
  disabled?: boolean
}

/**
 * 媒体上传组件（图片 + 视频）
 * - 拖拽 / 点选上传
 * - 列表项可拖拽排序、删除、设为主图（第一张）
 * - 上传中显示 loading 状态
 */
export default function MediaUploader({ value, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)

  const onPick = () => inputRef.current?.click()

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setUploading(true)
    setUploadError(null)
    try {
      const newItems: MediaItem[] = []
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i]
        try {
          const item = await uploadFile(f)
          newItems.push(item)
        } catch (e: any) {
          setUploadError(`${f.name}: ${e.message || '上传失败'}`)
          break
        }
      }
      if (newItems.length > 0) {
        onChange([...value, ...newItems])
      }
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const removeAt = (idx: number) => {
    if (!confirm('确认删除这张媒体？')) return
    const next = value.filter((_, i) => i !== idx)
    onChange(next)
  }

  // 拖拽排序
  const onItemDragStart = (e: React.DragEvent, idx: number) => {
    setDraggingIndex(idx)
    e.dataTransfer.effectAllowed = 'move'
  }
  const onItemDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  const onItemDrop = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault()
    if (draggingIndex === null || draggingIndex === dropIdx) {
      setDraggingIndex(null)
      return
    }
    const next = [...value]
    const [moved] = next.splice(draggingIndex, 1)
    next.splice(dropIdx, 0, moved)
    onChange(next)
    setDraggingIndex(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="label !mb-0">实拍图 / 视频（拖拽可排序，第一张为主图）</label>
        <button
          type="button"
          onClick={onPick}
          disabled={disabled || uploading}
          className="text-xs px-2 py-1 rounded bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {uploading ? '上传中…' : '+ 添加文件'}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* 拖拽上传区 */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFiles(e.dataTransfer.files)
        }}
        onClick={onPick}
        className={`border-2 border-dashed rounded-lg p-4 text-center text-sm cursor-pointer transition ${
          dragOver
            ? 'border-brand-500 bg-brand-50 text-brand-700'
            : 'border-slate-200 text-slate-500 hover:border-brand-300'
        } ${disabled || uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {uploading ? '⏳ 上传中…' : '📁 拖拽文件到这里 / 点击选择（图片 + 视频，单文件 ≤ 4MB）'}
      </div>

      {uploadError && (
        <div className="text-xs text-red-500 mt-1">{uploadError}</div>
      )}

      {/* 已上传的媒体列表 */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
          {value.map((m, idx) => (
            <div
              key={m.url + idx}
              draggable
              onDragStart={(e) => onItemDragStart(e, idx)}
              onDragOver={onItemDragOver}
              onDrop={(e) => onItemDrop(e, idx)}
              className={`relative group rounded-lg overflow-hidden border-2 cursor-move bg-slate-50 ${
                idx === 0 ? 'border-brand-500' : 'border-slate-200'
              } ${draggingIndex === idx ? 'opacity-50' : ''}`}
              style={{ aspectRatio: '1' }}
            >
              {m.type === 'image' ? (
                <img
                  src={m.url}
                  alt={m.name || ''}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white text-3xl">
                  ▶
                  <video
                    src={m.url}
                    className="absolute inset-0 w-full h-full object-cover opacity-70"
                    muted
                  />
                </div>
              )}
              {idx === 0 && (
                <div className="absolute top-1 left-1 bg-brand-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                  主图
                </div>
              )}
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...value]
                      ;[next[0], next[idx]] = [next[idx], next[0]]
                      onChange(next)
                    }}
                    className="bg-white/90 text-slate-700 text-xs px-1.5 py-0.5 rounded"
                    title="设为主图"
                  >
                    ★
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="bg-white/90 text-red-500 text-xs px-1.5 py-0.5 rounded"
                  title="删除"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
