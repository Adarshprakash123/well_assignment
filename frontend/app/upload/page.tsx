"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getToken, DocumentItem } from "@/lib/api";

export default function UploadPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    loadDocuments();
  }, [router]);

  async function loadDocuments() {
    try {
      setLoading(true);
      const { data } = await api.get<{ documents: DocumentItem[] }>("/documents");
      setDocuments(data.documents);
    } catch {
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Select a file first");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFile(null);
      setDocuments([]);
      await loadDocuments();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="font-semibold text-slate-800">Private Knowledge Q&A</h1>
          <div className="flex gap-4">
            <Link href="/upload" className="text-blue-600 font-medium">
              Upload
            </Link>
            <Link href="/chat" className="text-slate-600 hover:text-slate-800">
              Chat
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem("pkqa_token");
                router.push("/login");
              }}
              className="text-slate-500 hover:text-slate-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Upload Document</h2>
          <p className="text-sm text-slate-500 mb-4">
            Support .txt, .md, and .pdf (max 1MB). Shorter documents work best.
          </p>

          <form onSubmit={handleUpload} className="flex gap-2">
            <input
              type="file"
              accept=".txt,.md,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-600"
            />
            <button
              type="submit"
              disabled={!file || uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </form>

          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Your Documents</h2>
          {loading ? (
            <p className="text-slate-500">Loading...</p>
          ) : documents.length === 0 ? (
            <p className="text-slate-500">No documents yet. Upload one above.</p>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <span className="font-medium text-slate-700">{doc.name}</span>
                  <span className="text-xs text-slate-400">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
