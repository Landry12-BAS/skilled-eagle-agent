import { useState } from "react";
import { motion } from "framer-motion";
import { X, Link2, Loader2 } from "lucide-react";
import { scrapeUrl } from "@/lib/api-client";
import Cookies from "js-cookie";

interface ScrapeUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttach: (doc: { id: string; name: string; content: string; file_type?: string }) => void;
}

export function ScrapeUrlModal({ isOpen, onClose, onAttach }: ScrapeUrlModalProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    const token = Cookies.get("access_token") || localStorage.getItem("access_token");
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const result = await scrapeUrl(url.trim(), token);
      onAttach({
        id: result.id,
        name: result.filename || url,
        content: result.extracted_text || result.content || "",
        file_type: "text",
      });
      onClose();
      setUrl("");
    } catch (err: any) {
      setError(err.message || "Failed to scrape URL");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Scrape URL
          </h2>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
        
        <form onSubmit={handleScrape} className="p-4 space-y-4">
          {error && <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</div>}
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Web URL</label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm font-medium rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="flex-1 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Scrape"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
