import React, { useEffect, useRef, useState } from "react";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

interface TestMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  hotels?: any[];
  timestamp: Date;
  error?: boolean;
}

type Tab = "test" | "monitor";

const ClientChat: React.FC = () => {
  const [tab, setTab] = useState<Tab>("test");

  // --- API Test state ---
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [testInput, setTestInput] = useState("");
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<"unknown" | "online" | "offline">("unknown");
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const testEndRef = useRef<HTMLDivElement>(null);
  const testInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkApiStatus();
  }, []);

  useEffect(() => {
    testEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [testMessages]);

  const checkApiStatus = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/chat/sessions`);
      setApiStatus(res.ok || res.status === 401 ? "online" : "offline");
    } catch {
      setApiStatus("offline");
    }
  };

  const handleTestSend = async () => {
    const text = testInput.trim();
    if (!text || isTestLoading) return;

    const userMsg: TestMessage = {
      id: Date.now().toString(),
      role: "user",
      text,
      timestamp: new Date(),
    };
    setTestMessages((prev) => [...prev, userMsg]);
    setTestInput("");
    setIsTestLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/chat/smart-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "API error");

      if (!sessionId && data.sessionId) setSessionId(data.sessionId);

      const aiMsg: TestMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: data.response || "(no response)",
        hotels: data.hotels || [],
        timestamp: new Date(),
      };
      setTestMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: TestMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: err.message || "Failed to reach the API.",
        timestamp: new Date(),
        error: true,
      };
      setTestMessages((prev) => [...prev, errMsg]);
      setApiStatus("offline");
    } finally {
      setIsTestLoading(false);
      testInputRef.current?.focus();
    }
  };

  const handleClearTest = () => {
    setTestMessages([]);
    setSessionId(undefined);
  };

  const StatusDot = () => (
    <span
      className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
        apiStatus === "online"
          ? "bg-green-500"
          : apiStatus === "offline"
          ? "bg-red-500"
          : "bg-yellow-400"
      }`}
    />
  );

  return (
    <div className="bg-light-card dark:bg-dark-card rounded-lg shadow overflow-hidden flex flex-col h-full min-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-bold">Chat Console</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center">
            <StatusDot />
            Backend API:{" "}
            <span
              className={`ml-1 font-medium ${
                apiStatus === "online"
                  ? "text-green-600 dark:text-green-400"
                  : apiStatus === "offline"
                  ? "text-red-500"
                  : "text-yellow-500"
              }`}
            >
              {apiStatus === "unknown" ? "checking..." : apiStatus}
            </span>
            <button
              onClick={checkApiStatus}
              className="ml-3 text-xs text-primary underline"
            >
              refresh
            </button>
          </p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md p-1 text-sm">
          <button
            onClick={() => setTab("test")}
            className={`px-3 py-1 rounded transition-colors ${
              tab === "test"
                ? "bg-white dark:bg-dark-surface shadow font-medium"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            Test AI
          </button>
          <button
            onClick={() => setTab("monitor")}
            className={`px-3 py-1 rounded transition-colors ${
              tab === "monitor"
                ? "bg-white dark:bg-dark-surface shadow font-medium"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            Monitor
          </button>
        </div>
      </div>

      {/* Test Tab */}
      {tab === "test" && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Session info */}
          {sessionId && (
            <div className="px-5 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
              <span>Session: <code className="font-mono">{sessionId.slice(0, 24)}...</code></span>
              <button onClick={handleClearTest} className="text-red-500 hover:underline">
                Clear
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {testMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-14 h-14 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-700 dark:text-gray-200">Test the AI Chat API</p>
                <p className="text-sm text-gray-400 mt-1 max-w-xs">
                  Send a message to test the smart chat endpoint. Try "Find hotels in Nairobi" or "Hello".
                </p>
              </div>
            )}

            {testMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-sm"
                      : msg.error
                      ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-bl-sm"
                      : "bg-gray-100 dark:bg-gray-700 rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  {msg.hotels && msg.hotels.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 space-y-1.5">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {msg.hotels.length} Hotel{msg.hotels.length !== 1 ? "s" : ""} Found
                      </p>
                      {msg.hotels.slice(0, 3).map((h: any, i: number) => (
                        <div
                          key={h.id || i}
                          className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-2"
                        >
                          {h.images?.[0] && !h.images[0].startsWith("data:") ? (
                            <img
                              src={h.images[0]}
                              alt={h.name}
                              className="w-10 h-10 rounded object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-600 flex-shrink-0 flex items-center justify-center text-lg">
                              🏨
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">{h.name}</p>
                            <p className="text-xs text-gray-400 truncate">{h.location}</p>
                          </div>
                          {h.price > 0 && (
                            <span className="text-xs font-bold text-primary ml-auto flex-shrink-0">
                              ${h.price}/night
                            </span>
                          )}
                        </div>
                      ))}
                      {msg.hotels.length > 3 && (
                        <p className="text-xs text-gray-400">+{msg.hotels.length - 3} more</p>
                      )}
                    </div>
                  )}
                  <p className="text-xs opacity-50 mt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}

            {isTestLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={testEndRef} />
          </div>

          {/* Input */}
          <div className="px-5 pb-5 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                ref={testInputRef}
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleTestSend()}
                placeholder='e.g. "Find hotels in Bujumbura"'
                disabled={isTestLoading}
                className="flex-1 rounded-lg px-4 py-2.5 text-sm bg-gray-100 dark:bg-gray-700 border border-transparent focus:border-primary focus:outline-none focus:bg-white dark:focus:bg-dark-surface transition-colors disabled:opacity-50"
              />
              <button
                onClick={handleTestSend}
                disabled={isTestLoading || !testInput.trim()}
                className="bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
              {testMessages.length > 0 && (
                <button
                  onClick={handleClearTest}
                  title="Clear conversation"
                  className="px-3 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Sends directly to <code className="font-mono">/api/chat/smart-chat</code> — no auth required.
            </p>
          </div>
        </div>
      )}

      {/* Monitor Tab */}
      {tab === "monitor" && (
        <div className="flex flex-col flex-1 overflow-hidden p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Live traveler conversations appear here via WebSocket when a guest chats with the AI.
          </p>
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <p className="font-medium">Waiting for live activity...</p>
            <p className="text-sm mt-1">When travelers start chatting, their messages will appear here in real-time.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientChat;
