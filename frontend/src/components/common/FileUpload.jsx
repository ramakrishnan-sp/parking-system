import { useEffect, useRef, useState } from 'react'
import { Upload, X, FileText, Image } from 'lucide-react'

export default function FileUpload({
  label,
  name,
  accept = 'image/*',
  required = false,
  onChange,
  error,
  helpText = 'JPG, PNG or PDF up to 10MB',
}) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [fileName, setFileName] = useState(null)

  const handleChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    if (file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file))
    } else {
      setPreview(null)
    }
    onChange?.(file)
  }

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
        <label className="label">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-4 cursor-pointer transition-colors ${
          error
            ? 'border-red-400 bg-red-50'
            : 'border-gray-300 hover:border-primary-400 bg-gray-50 hover:bg-primary-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept={accept}
          className="hidden"
          onChange={handleChange}
          required={required}
        />

        {preview ? (
          <div className="flex items-center gap-3">
            <img
              src={preview}
              alt="preview"
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{fileName}</p>
              <p className="text-xs text-gray-500">Click to change</p>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-200 rounded-full"
            >
              <X size={14} />
            </button>
          </div>
        ) : fileName ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{fileName}</p>
              <p className="text-xs text-gray-500">Click to change</p>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-200 rounded-full"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <Upload size={18} className="text-gray-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-primary-600">Click to upload</p>
              <p className="text-xs text-gray-500">{helpText}</p>
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
