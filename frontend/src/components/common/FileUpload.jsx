import { useState, useRef } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from './GlassCard';

export const FileUpload = ({ onFileSelect, accept, label, className }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    setFile(selectedFile);
    onFileSelect(selectedFile);
    
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={cn("w-full", className)}>
      {label && <label className="block text-sm font-medium text-white/80 mb-1.5">{label}</label>}
      
      <GlassCard
        className={cn(
          "relative flex flex-col items-center justify-center p-6 border-2 border-dashed cursor-pointer transition-colors",
          dragActive ? "border-brand-purple bg-brand-purple/10" : "border-white/20 hover:border-white/40",
          file ? "p-2" : "p-8"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
        
        {file ? (
          <div className="relative w-full flex items-center gap-4 p-2">
            {preview ? (
              <img src={preview} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-white/10" />
            ) : (
              <div className="w-16 h-16 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                <UploadCloud className="w-8 h-8 text-white/40" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{file.name}</p>
              <p className="text-xs text-white/50">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={removeFile}
              className="p-2 rounded-full hover:bg-red-500/20 text-red-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud className="w-10 h-10 text-white/40 mb-3" />
            <p className="text-sm text-white/80 font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-white/40 mt-1">SVG, PNG, JPG or PDF (max. 5MB)</p>
          </>
        )}
      </GlassCard>
    </div>
  );
};
