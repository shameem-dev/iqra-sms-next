'use client';

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  FileText, Upload, Trash2, Loader2, CheckCircle2,
  AlertCircle, Download, File, X, Eye,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface StaffDocument {
  id: string;
  staff_id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useStaffDocuments(
  staffId: string | undefined,
  supabase: ReturnType<typeof createBrowserClient>
) {
  const [docs, setDocs] = useState<StaffDocument[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDocs = async () => {
    if (!staffId) return;
    setLoading(true);
    const { data } = await supabase
      .from('staff_documents')
      .select('*')
      .eq('staff_id', staffId)
      .order('uploaded_at', { ascending: false });
    if (data) setDocs(data);
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, [staffId]); // eslint-disable-line

  return { docs, loading, refetch: fetchDocs };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF PREVIEW MODAL
// ─────────────────────────────────────────────────────────────────────────────

interface PreviewModalProps {
  url: string;
  title: string;
  fileName: string;
  fileSize: number;
  onClose: () => void;
  onDownload: () => void;
}

function PdfPreviewModal({ url, title, fileName, fileSize, onClose, onDownload }: PreviewModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex flex-col w-full h-full max-w-4xl mx-auto my-4 sm:my-8 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
        <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-red-500/20 rounded-lg shrink-0">
              <FileText className="w-4 h-4 text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">{title}</p>
              <p className="text-xs text-slate-400 truncate">
                {fileName} · {formatBytes(fileSize)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-slate-800 overflow-hidden">
          <iframe
            src={`${url}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
            className="w-full h-full border-0"
            title={title}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface DocumentsTabProps {
  staffId: string | undefined;
  supabase: ReturnType<typeof createBrowserClient>;
  docs: StaffDocument[];
  docsLoading: boolean;
  onRefetch: () => void;
}

export function DocumentsTab({
  staffId, supabase, docs, docsLoading, onRefetch,
}: DocumentsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<StaffDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);

  const inputCls = 'w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-400';

  useEffect(() => {
    setTitle('');
    setSelectedFile(null);
    setError('');
    setSuccess('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [staffId]);

  const getSignedUrl = async (doc: StaffDocument, ttl = 300): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from('staff-documents')
      .createSignedUrl(doc.file_path, ttl);
    return error ? null : (data?.signedUrl ?? null);
  };

 const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.type !== 'application/pdf') {
    setError('Only PDF files are supported.');
    return;
  }

  // 5 MB = 5,242,880 bytes
  const FIVE_MB = 5 * 1024 * 1024;
  
  if (file.size > FIVE_MB) {
    setError(`File is too large (${formatBytes(file.size)}). Maximum limit is 5 MB.`);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    return;
  }

  // Clear previous errors/success if a valid file is picked
  setError('');
  setSuccess('');
  setSelectedFile(file);
};

  const handleUpload = async () => {
    if (!staffId) { setError('Save the staff member first.'); return; }
    if (!selectedFile) { setError('Please select a PDF file.'); return; }
    if (!title.trim()) { setError('Please enter a document title.'); return; }

    setUploading(true); setError(''); setSuccess('');

    try {
      const originalSize = selectedFile.size;
      const SIZE_LIMIT = 250 * 1024; // 250 KB
      
      let uploadBlob: Blob | File = selectedFile;
      let wasCompressed = false;

      // 1. COMPRESSION CHECK
      if (originalSize > SIZE_LIMIT) {
        const form = new FormData();
        form.append('file', selectedFile);
        const res = await fetch('/api/compress-pdf', { method: 'POST', body: form });

        if (res.ok) {
          const compressed = await res.blob();
          if (compressed.size < originalSize) {
            uploadBlob = compressed;
            wasCompressed = true;
          }
        }
      }

      // 2. STORAGE UPLOAD
      const filePath = `${staffId}/${Date.now()}_${selectedFile.name.replace(/[^a-z0-9._-]/gi, '_')}`;
      const { error: uploadErr } = await supabase.storage
        .from('staff-documents')
        .upload(filePath, uploadBlob, { contentType: 'application/pdf', upsert: false });
      
      if (uploadErr) throw new Error(uploadErr.message);

      // 3. DATABASE INSERT
      const { error: dbErr } = await supabase.from('staff_documents').insert({
        staff_id: staffId,
        title: title.trim(),
        file_name: selectedFile.name,
        file_path: filePath,
        file_size: uploadBlob.size,
      });

      if (dbErr) {
        await supabase.storage.from('staff-documents').remove([filePath]);
        throw new Error(dbErr.message);
      }

      // 4. UI SUCCESS
      const saved = Math.round((1 - uploadBlob.size / originalSize) * 100);
      setSuccess(
        wasCompressed
          ? `Compressed & Uploaded! ${formatBytes(originalSize)} → ${formatBytes(uploadBlob.size)} (${saved}% saved)`
          : `Uploaded successfully! (${formatBytes(uploadBlob.size)})`
      );

      setTitle('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onRefetch();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = async (doc: StaffDocument) => {
    setPreviewLoadingId(doc.id);
    const url = await getSignedUrl(doc, 300);
    if (url) {
      setPreviewDoc(doc);
      setPreviewUrl(url);
    } else {
      setError('Could not load preview.');
    }
    setPreviewLoadingId(null);
  };

  const handleDownload = async (doc: StaffDocument) => {
    setDownloadingId(doc.id);
    const url = await getSignedUrl(doc, 60);
    if (url) {
      const a = document.createElement('a');
      a.href = url; a.download = doc.file_name; a.click();
    } else {
      setError('Download failed.');
    }
    setDownloadingId(null);
  };

  const handleDelete = async (doc: StaffDocument) => {
    if (!confirm(`Delete "${doc.title}"?`)) return;
    setDeletingId(doc.id);
    const { error: storageErr } = await supabase.storage.from('staff-documents').remove([doc.file_path]);
    if (!storageErr) await supabase.from('staff_documents').delete().eq('id', doc.id);
    setDeletingId(null);
    if (previewDoc?.id === doc.id) setPreviewDoc(null);
    onRefetch();
  };

  return (
    <>
      {previewDoc && previewUrl && (
        <PdfPreviewModal
          url={previewUrl}
          title={previewDoc.title}
          fileName={previewDoc.file_name}
          fileSize={previewDoc.file_size}
          onClose={() => setPreviewDoc(null)}
          onDownload={() => handleDownload(previewDoc)}
        />
      )}

      <div className="space-y-5">
        {!staffId ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-3">
            <FileText className="w-8 h-8 text-slate-300" />
            <p className="text-sm">Save staff member first to upload documents.</p>
          </div>
        ) : (
          <>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <p className="text-sm font-semibold text-slate-700">Upload Document</p>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="e.g. ID Proof" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">PDF File *</label>
                <div onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-colors group">
                  <Upload className="w-4 h-4 text-slate-400 group-hover:text-teal-500 shrink-0" />
                  <span className="text-sm text-slate-500 group-hover:text-teal-600 truncate">
                    {selectedFile ? `${selectedFile.name} (${formatBytes(selectedFile.size)})` : 'Choose PDF (max 5 MB)'}
                  </span>
                </div>
                <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFilePick} />
              </div>
              {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex gap-2"><AlertCircle className="w-3.5 h-3.5" />{error}</div>}
              {success && <div className="p-3 bg-green-50 text-green-700 text-xs rounded-lg flex gap-2"><CheckCircle2 className="w-3.5 h-3.5" />{success}</div>}
              <button onClick={handleUpload} disabled={uploading || !selectedFile || !title.trim()} className="w-full h-9 flex items-center justify-center gap-2 text-sm font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors">
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" />Processing…</> : <><Upload className="w-4 h-4" />Upload & Compress</>}
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">Uploaded Documents ({docs.length})</p>
              {docsLoading ? (
                <div className="flex justify-center py-4 text-slate-400 text-sm gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
              ) : docs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No documents found.</div>
              ) : docs.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:shadow-sm">
                  <div className="p-3 bg-red-50 rounded-xl border border-red-100"><FileText className="w-6 h-6 text-red-500" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{doc.title}</p>
                    <p className="text-xs text-slate-500 truncate">{formatBytes(doc.file_size)} • {new Date(doc.uploaded_at).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => handlePreview(doc)} disabled={previewLoadingId === doc.id} className="p-2 bg-slate-800 text-white rounded-lg hover:bg-black transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDownload(doc)} disabled={downloadingId === doc.id} className="p-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-600 hover:text-white transition-colors"><Download className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(doc)} disabled={deletingId === doc.id} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}