import { useEffect, useRef, useState } from 'react'
import { Upload, X, FileText } from 'lucide-react'
import { cn } from '../../lib/utils'

export default function FileUpload({
  label,
  accept = 'image/*',
  required = false,
  onChange,
  error,
  helpText = 'JPG, PNG or PDF up to 10MB',
}) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [fileName, setFileName] = useState(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = (file) => {
    if (!file) return
    setFileName(file.name)
    if (file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file))
    } else {
      setPreview(null)
    }
    onChange?.(file)
  }

  const handleChange = (e) => handleFile(e.target.files?.[0])
  const handleDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]) }
  const handleClear = (e) => {
    e.stopPropagation()
    setPreview(null)
    setFileName(null)
    if (inputRef.current) inputRef.current.value = ''
    onChange?.(null)
  }

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-4 cursor-pointer transition-colors',
          dragging ? 'border-brand bg-brand/5'
            : error ? 'border-destructive bg-destructive/5'
            : 'border-border hover:border-brand/50 bg-muted/50 hover:bg-brand/5'
        )}
      >
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} required={required} />
        {fileName ? (
          <div className="flex items-center gap-3">
            {preview
              ? <img src={preview} alt="preview" className="size-14 rounded-lg object-cover shrink-0" />
              : <div className="size-14 bg-brand/10 rounded-lg flex items-center justify-center shrink-0"><FileText className="size-6 text-brand" /></div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileName}</p>
              <p className="text-xs text-muted-foreground">Click to change</p>
            </div>
            <button type="button" onClick={handleClear} className="p-1.5 rounded-full hover:bg-muted transition-colors">
              <X className="size-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-3">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center">
              <Upload className="size-5 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-brand">{dragging ? 'Drop here' : 'Click to upload or drag & drop'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{helpText}</p>
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
