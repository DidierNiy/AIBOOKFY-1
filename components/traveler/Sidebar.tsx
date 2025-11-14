
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
    onNewChat: () => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNewChat, isOpen, setIsOpen }) => {
    const { user, logout } = useAuth();
    
    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/30 z-10 md:hidden"></div>}

            <aside className={`absolute md:relative inset-y-0 left-0 z-20 w-64 flex-shrink-0 bg-light-card dark:bg-dark-surface border-r border-gray-200 dark:border-gray-700 flex flex-col p-4 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-opacity-90 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    <span>New Chat</span>
                </button>

                <div className="flex-1 mt-6 overflow-y-auto">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">History</h3>
                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                        <p className="p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 truncate">Booking in Bujumbura</p>
                        <p className="p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 truncate">Weekend getaway options</p>
                    </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 -mx-4 p-4 flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                        <img src="https://picsum.photos/seed/traveler/40/40" alt="User Avatar" className="w-8 h-8 rounded-full" />
                        <span className="font-semibold text-sm">{user?.name}</span>
                    </div>
                    <button onClick={logout} className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;