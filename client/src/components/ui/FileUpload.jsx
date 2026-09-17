import { useRef, useState } from 'react';
import { UploadCloud, FileText } from 'lucide-react';

const ACCEPTED_TYPES = '.pdf,.docx';

export default function FileUpload({ onSelect, uploading, error, currentFileName }) {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState(currentFileName || '');
  const [dragActive, setDragActive] = useState(false);

  const selectFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    onSelect(file);
  };

  const handleChange = (e) => selectFile(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (uploading) return;
    selectFile(e.dataTransfer.files?.[0]);
  };

  const dropzoneClassName = [
    'file-dropzone',
    uploading ? 'file-dropzone--disabled' : '',
    dragActive ? 'file-dropzone--active' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="stack stack--gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleChange}
        className="file-dropzone__native-input"
        id="resume-upload-input"
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !uploading) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        aria-disabled={uploading}
        className={dropzoneClassName}
      >
        {fileName ? (
          <FileText size={22} className="file-dropzone__icon--accent" />
        ) : (
          <UploadCloud size={22} className="file-dropzone__icon--muted" />
        )}
        <div className="file-dropzone__text">
          {uploading ? (
            'Uploading...'
          ) : fileName ? (
            <span className="file-dropzone__filename">{fileName}</span>
          ) : (
            <>
              <span className="file-dropzone__cta">Click to upload</span> or drag and drop
            </>
          )}
        </div>
        <p className="file-dropzone__hint">PDF or DOCX, up to 5MB</p>
      </div>
      {error && <p className="form-field__error">{error}</p>}
    </div>
  );
}
