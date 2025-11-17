import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ChatSession } from "../../types";

interface SidebarProps {
  onNewChat: () => void;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  chatSessions: ChatSession[];
  currentSessionId?: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onNewChat,
  onLoadSession,
  onDeleteSession,
  chatSessions,
  currentSessionId,
  isOpen,
  setIsOpen,
}) => {
  const { user, logout } = useAuth();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // Prevent triggering the load session
    if (window.confirm("Are you sure you want to delete this chat?")) {
      onDeleteSession(sessionId);
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/30 z-10 md:hidden"
        ></div>
      )}

      <aside
        className={`absolute md:relative inset-y-0 left-0 z-20 w-64 flex-shrink-0 bg-light-card dark:bg-dark-surface border-r border-gray-200 dark:border-gray-700 flex flex-col p-4 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>New Chat</span>
        </button>

        <div className="flex-1 mt-6 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Chat History
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            {chatSessions.length > 0 ? (
              chatSessions.map((session) => (
                <div
                  key={session.id}
                  className={`group relative p-3 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    currentSessionId === session.id
                      ? "bg-blue-50 dark:bg-blue-900/30 border-l-2 border-blue-500"
                      : ""
                  }`}
                  onClick={() => onLoadSession(session.id)}
                >
                  <div
                    className="font-medium truncate mb-1 pr-8"
                    title={session.title}
                  >
                    {session.title}
                  </div>
                  <div
                    className="text-xs text-gray-500 dark:text-gray-400 truncate"
                    title={session.lastMessage}
                  >
                    {session.lastMessage}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex justify-between">
                    <span>{formatDate(session.updatedAt)}</span>
                    <span>{session.messageCount} messages</span>
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteClick(e, session.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500"
                    title="Delete chat"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                <p>No chat history yet.</p>
                <p className="text-xs mt-1">
                  Start a conversation to see it here!
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 -mx-4 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src="https://picsum.photos/seed/traveler/40/40"
              alt="User Avatar"
              className="w-8 h-8 rounded-full"
            />
            <span className="font-semibold text-sm">{user?.name}</span>
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 rounded-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
