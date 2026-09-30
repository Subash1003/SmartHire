import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export default function ResumeViewerModal({ open, onClose, resumeUrl, fileName, fileType }) {
  const [state, setState] = useState({ status: 'loading', kind: null, content: null });

  useEffect(() => {
    if (!open || !resumeUrl) return undefined;

    let cancelled = false;
    let objectUrl = null;
    setState({ status: 'loading', kind: null, content: null });

    fetch(resumeUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch resume');
        return res.blob();
      })
      .then(async (blob) => {
        if (cancelled) return;

        if (fileType === 'application/pdf') {
          // Cloudinary serves raw uploads as application/octet-stream, so the
          // fetched blob doesn't know it's a PDF. Re-tag it before creating the
          // object URL — otherwise the browser has no way to know it should
          // render it inline instead of showing a blank frame.
          const pdfBlob = new Blob([blob], { type: 'application/pdf' });
          objectUrl = URL.createObjectURL(pdfBlob);
          setState({ status: 'success', kind: 'pdf', content: objectUrl });
        } else if (fileType === DOCX_MIME) {
          const [{ default: mammoth }, arrayBuffer] = await Promise.all([import('mammoth'), blob.arrayBuffer()]);
          const result = await mammoth.convertToHtml({ arrayBuffer });
          if (!cancelled) setState({ status: 'success', kind: 'html', content: result.value });
        } else {
          setState({ status: 'unsupported', kind: null, content: null });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', kind: null, content: null });
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, resumeUrl, fileType]);

  return (
    <Modal open={open} onClose={onClose} title={fileName || 'Resume preview'} size="wide">
      <div className="resume-viewer__body">
        {state.status === 'loading' && <div className="resume-viewer__status">Loading resume preview...</div>}

        {state.status === 'error' && (
          <div className="resume-viewer__status">Unable to load a preview for this resume.</div>
        )}

        {state.status === 'unsupported' && (
          <div className="resume-viewer__status">Preview isn't available for this file type.</div>
        )}

        {state.status === 'success' && state.kind === 'pdf' && (
          <iframe src={state.content} title={fileName || 'Resume preview'} className="resume-viewer__frame" />
        )}

        {state.status === 'success' && state.kind === 'html' && (
          <div className="resume-viewer__docx" dangerouslySetInnerHTML={{ __html: state.content }} />
        )}
      </div>

      <div className="resume-viewer__footer">
        <a href={resumeUrl} className="btn btn--secondary">
          Download Resume
        </a>
      </div>
    </Modal>
  );
}
