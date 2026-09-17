import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import Button from './Button';

const ACCEPTED_TYPES = '.pdf,.docx';

export default function FileUpload({ onSelect, uploading, error }) {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState('');

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    onSelect(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleChange}
        className="hidden"
        id="resume-upload-input"
      />
      <div className="flex items-center gap-3">
        <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <Upload size={16} className="mr-2" />
          {uploading ? 'Uploading...' : 'Choose file'}
        </Button>
        {fileName && <span className="text-sm text-gray-600">{fileName}</span>}
      </div>
      <p className="text-xs text-gray-500">PDF or DOCX, up to 5MB.</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
