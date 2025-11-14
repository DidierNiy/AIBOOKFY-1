


import React from 'react';

export type NavItem = 'Overview' | 'Listings' | 'Client Chat' | 'Bookings' | 'Restaurant' | 'AI Tools' | 'AI Reports' | 'Settings';

// SVG Icons
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const ListingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
const BookingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>;
const RestaurantIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z"/></svg>;
const AiIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 8-2 4 2 4 2-4-2-4z"/><path d="M20 10.5c0-.2 0-.3.1-.5L22 8l-2-3.5-2.1.9c-.3-.2-.5-.4-.8-.6L16 2h-4l-.9 3.8c-.3.2-.6.4-.8-.6l-2.1-.9L6 8l1.9 2.5c0 .1.1.3.1.5l-1.9 2.5L8 16l2.1-.9c.3.2.5.4.8.6L12 22h4l.9-3.8c.3-.2-.6-.4-.8-.6l2.1.9 2-3.5-1.9-2.5c0-.2-.1-.4-.1-.5Z"/></svg>;
const ReportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18.7 8a6 6 0 0 0-8.1 0"/><path d="M13.2 12.4a3 3 0 0 0-3.9 0"/><path d="M8 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.22l-.15.1a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1 0 2.22l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15-.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;

const navItems: { name: NavItem; icon: React.ReactElement }[] = [
    { name: 'Overview', icon: <HomeIcon /> },
    { name: 'Listings', icon: <ListingIcon /> },
    { name: 'Client Chat', icon: <ChatIcon /> },
    { name: 'Bookings', icon: <BookingIcon /> },
    { name: 'Restaurant', icon: <RestaurantIcon /> },
    { name: 'AI Tools', icon: <AiIcon /> },
    { name: 'AI Reports', icon: <ReportIcon /> },
    { name: 'Settings', icon: <SettingsIcon /> },
];

interface SidebarProps {
    activeItem: NavItem;
    setActiveItem: (item: NavItem) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, setActiveItem, isOpen, setIsOpen }) => {
    return (
        <aside className={`dashboard-sidebar fixed top-[65px] left-0 h-[calc(100vh-65px)] bg-light-card dark:bg-dark-surface border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 z-20 w-64 md:w-auto md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:hover:w-64 group`}>
            <div className="flex items-center justify-center h-20 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 px-4">
                <div className="p-2 bg-primary rounded-full text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                </div>
                 <h1 className="text-xl font-bold ml-2 hidden md:group-hover:block">AIBookify</h1>
            </div>
            <nav className="flex-1 py-4 overflow-y-auto">
                <ul>
                    {navItems.map((item) => (
                        <li key={item.name} className="px-4 py-1">
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setActiveItem(item.name);
                                    if (window.innerWidth < 768) { // Close sidebar on mobile after selection
                                        setIsOpen(false);
                                    }
                                }}
                                className={`flex items-center p-2 rounded-lg transition-colors justify-center md:justify-start ${
                                    activeItem === item.name
                                        ? 'bg-primary text-white'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                {item.icon}
                                <span className="ml-4 font-medium hidden md:group-hover:block">{item.name}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;