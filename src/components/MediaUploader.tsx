import { useState } from 'react'
import type { MediaItem } from '../lib/types'

interface Props {
  value: MediaItem[]
  onChange: (items: MediaItem[]) => void
  disabled?: boolean
}

/**
 * 媒体 URL 列表编辑器（图片 + 视频）
 * - 每行一个 URL（图片或视频）
 * - 自动识别类型：扩展名为 mp4/mov/webm/m4v 的当视频，其余当图片
 * - 支持 mmbiz.qpic.cn（微信公众号素材）、任意公网图片/视频直链
 */
export default function MediaUploader({ value, onChange, disabled }: Props) {
  const [text, setText] = useState('')

  const isVideoUrl = (url: string) =>
    /\.(mp4|mov|webm|m4v|avi|mkv)(\?|#|$)/i.test(url)

  const parseText = (raw: string): MediaItem[] => {
    const lines = raw
      .split(/[\n\r]+/)
      .map((l) => l.trim())
      .filter(Boolean)
    return lines.map((url) => ({
      type: isVideoUrl(url) ? 'video' : 'image',
      url,
    }))
  }

  const handleApply = () => {
    if (!text.trim()) return
    const newItems = parseText(text)
    onChange([...value, ...newItems])
    setText('')
  }

  const handleReplaceAll = () => {
    if (!text.trim()) {
      onChange([])
      return
    }
    onChange(parseText(text))
    setText('')
  }

  const removeAt = (idx: number) => {
    if (!confirm('确认删除这条媒体？')) return
    onChange(value.filter((_, i) => i !== idx))
  }

  // 拖拽排序
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
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

  const setAsMain = (idx: number) => {
    if (idx === 0) return
    const next = [...value]
    ;[next[0], next[idx]] = [next[idx], next[0]]
    onChange(next)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="label !mb-0">实拍图 / 视频 URL（每行一个，第一条为主图）</label>
      </div>

      {/* URL 粘贴区 */}
      <div
        className={`border-2 border-dashed rounded-lg p-3 ${
          disabled ? 'opacity-50 pointer-events-none' : 'border-slate-200'
        }`}
      >
        <textarea
          className="input min-h-[100px] font-mono text-xs"
          placeholder={
            '一行一个 URL，例如：\nhttps://mmbiz.qpic.cn/.../640?wx_fmt=jpeg\nhttps://example.com/video.mp4\n\n（粘贴后点下方「追加」按钮）'
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
        />
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={handleApply}
            disabled={disabled || !text.trim()}
            className="text-xs px-3 py-1.5 rounded bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
          >
            追加到列表
          </button>
          <button
            type="button"
            onClick={handleReplaceAll}
            disabled={disabled || (value.length > 0 && !text.trim())}
            className="text-xs px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            title="用粘贴的内容替换整个列表（textarea 为空时 = 清空列表）"
          >
            替换全部
          </button>
        </div>
        <div className="text-[11px] text-slate-400 mt-2">
          💡 推荐用微信公众号「素材管理」上传图片后复制 URL（永久免费）。其他公网图片直链也支持。
        </div>
      </div>

      {/* 已添加的媒体列表 */}
      {value.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-slate-500 mb-2">已添加 {value.length} 条（可拖拽排序，悬停显示主图/删除按钮）</div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
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
                title={m.url}
              >
                {m.type === 'image' ? (
                  <img
                    src={m.url}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white text-3xl">
                    ▶
                  </div>
                )}
                {idx === 0 && (
                  <div className="absolute top-1 left-1 bg-brand-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                    主图
                  </div>
                )}
                {m.type === 'video' && (
                  <div className="absolute top-1 right-1 bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                    视频
                  </div>
                )}
                <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => setAsMain(idx)}
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
        </div>
      )}
    </div>
  )
}
