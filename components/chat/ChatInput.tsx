import React, { useState, KeyboardEvent } from 'react';

interface ChatInputProps {
    onSendMessage: (text: string) => void;
    isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
    const [text, setText] = useState('');

    const handleSubmit = () => {
        if (text.trim() && !isLoading) {
            onSendMessage(text);
            setText('');
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="flex items-center space-x-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary">
            <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-secondary rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            </button>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message AIBookify..."
                className="flex-1 resize-none bg-transparent py-2 text-sm focus:outline-none dark:text-dark-text"
                rows={1}
                disabled={isLoading}
            />
            <button
                onClick={handleSubmit}
                disabled={isLoading || !text.trim()}
                className="p-2 w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-white disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-opacity-90 transition-colors"
                aria-label="Send message"
            >
                {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                )}
            </button>
        </div>
    );
};

export default ChatInput;
