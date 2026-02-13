"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getToken, AskResponse, DocumentItem } from "@/lib/api";

export default function ChatPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string; sources?: AskResponse["sources"] }>>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    loadDocuments();
  }, [router]);

  async function loadDocuments() {
    try {
      setLoadingDocs(true);
      const { data } = await api.get<{ documents: DocumentItem[] }>("/documents");
      setDocuments(data.documents);
    } catch {
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const q = question.trim();
    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);

    try {
      const { data } = await api.post<AskResponse>("/ask", {
        question: q,
        documentId: selectedDocId || undefined,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <nav className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="font-semibold text-slate-800">Private Knowledge Q&A</h1>
          <div className="flex gap-4">
            <Link href="/upload" className="text-slate-600 hover:text-slate-800">
              Upload
            </Link>
            <Link href="/chat" className="text-blue-600 font-medium">
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

      <main className="max-w-4xl mx-auto w-full flex-1 flex flex-col px-4 py-6">
        {loadingDocs ? (
          <p className="text-slate-500 text-sm mb-4">Loading documents...</p>
        ) : documents.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Search in (optional)
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All documents</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <p>Ask a question about your documents.</p>
              <p className="text-sm mt-1">Upload documents first if you haven&apos;t yet.</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg ${
                m.role === "user" ? "bg-blue-50 ml-8" : "bg-white shadow mr-8"
              }`}
            >
              <p className="text-slate-800 whitespace-pre-wrap">{m.content}</p>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 mb-2">Sources:</p>
                  <ul className="space-y-2">
                    {m.sources.map((s, j) => (
                      <li key={j} className="text-sm">
                        <span className="font-medium text-slate-600">{s.documentName}:</span>
                        <p className="text-slate-500 mt-1">"{s.snippet}"</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="bg-white shadow rounded-lg p-4 mr-8">
              <p className="text-slate-500">Thinking...</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
            disabled={loading}
            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-60"
          >
            Ask
          </button>
        </form>
      </main>
    </div>
  );
}
