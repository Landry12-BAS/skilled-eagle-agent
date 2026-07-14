import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, X, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import { getDocuments, deleteDocument } from "@/lib/api-client";
import Cookies from "js-cookie";

interface Document {
  id: string;
  filename: string;
  file_type: string;
  extracted_text?: string;
  content?: string;
}

interface DocumentLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onAttach: (docs: { id: string; name: string; content: string; file_type?: string }[]) => void;
}

export function DocumentLibrary({ isOpen, onClose, onAttach }: DocumentLibraryProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDocuments();
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  const loadDocuments = async () => {
    const token = Cookies.get("access_token") || localStorage.getItem("access_token");
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getDocuments(token);
      setDocuments(data || []);
    } catch (err) {
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const token = Cookies.get("access_token") || localStorage.getItem("access_token");
    if (!token) return;

    try {
      await deleteDocument(id, token);
      setDocuments(docs => docs.filter(d => d.id !== id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      setError("Failed to delete document");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAttach = () => {
    const selectedDocs = documents
      .filter(d => selectedIds.has(d.id))
      .map(d => ({
        id: d.id,
        name: d.filename,
        content: d.extracted_text || d.content || "",
        file_type: d.file_type,
      }));
    onAttach(selectedDocs);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full max-w-md h-full bg-card border-l border-border flex flex-col shadow-2xl"
      >
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Document Library
          </h2>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-destructive text-sm text-center py-10">{error}</div>
          ) : documents.length === 0 ? (
            <div className="text-center text-muted-foreground py-10 text-sm">
              No documents found. Upload or scrape some first.
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => toggleSelect(doc.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedIds.has(doc.id) ? "border-primary bg-primary/10" : "border-border hover:border-white/30 bg-card"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedIds.has(doc.id) ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
                  }`}>
                    {doc.file_type === "image" ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{doc.filename}</div>
                    <div className="text-xs text-muted-foreground capitalize">{doc.file_type || "text"}</div>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, doc.id)}
                    className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border bg-muted/30">
          <button
            onClick={handleAttach}
            disabled={selectedIds.size === 0}
            className="w-full py-2.5 rounded-lg font-medium bg-primary text-primary-foreground disabled:opacity-50 transition-colors hover:bg-primary/90"
          >
            Attach Selected ({selectedIds.size})
          </button>
        </div>
      </motion.div>
    </div>
  );
}
