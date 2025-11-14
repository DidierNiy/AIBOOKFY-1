

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const MoonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;

// Fix: Changed Navbar to a named export to resolve module resolution issues.
// Fix: Changed component to a function declaration with an explicit JSX.Element return type to resolve complex type inference issues.
// FIX: Changed JSX.Element to React.ReactElement to fix 'Cannot find namespace JSX' error.
export function Navbar(): React.ReactElement {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // FIX: Converted NavLinks to a full function declaration with an explicit return type.
  // This helps TypeScript's parser and resolves the cascading type errors.
  function NavLinks({ isMobile }: { isMobile?: boolean }): React.ReactElement {
    return (
      <>
        {user ? (
          <>
            <button onClick={() => { navigate(user.type === 'hotel' ? '/dashboard' : '/chat'); isMobile && setIsMenuOpen(false); }} className="w-full text-left md:w-auto px-3 py-2 rounded-md text-sm font-medium hover:text-primary dark:hover:text-secondary">Dashboard</button>
            <button onClick={() => { logout(); isMobile && setIsMenuOpen(false); }} className={`w-full text-left md:w-auto md:px-4 md:py-2 text-sm md:bg-secondary md:text-white rounded-md md:hover:bg-opacity-90 transition-colors ${isMobile ? 'px-3 py-2' : ''}`}>Log Out</button>
          </>
        ) : (
          <>
            <Link to="/#features" onClick={() => isMobile && setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium hover:text-primary dark:hover:text-secondary">Features</Link>
            <Link to="/auth?mode=signin" onClick={() => isMobile && setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium hover:text-primary dark:hover:text-secondary">Sign In</Link>
            {/* FIX: Corrected className to use template literal for dynamic classes */}
            <Link to="/auth?mode=signup" onClick={() => isMobile && setIsMenuOpen(false)} className={`block md:px-4 md:py-2 text-sm md:bg-primary md:text-white rounded-md md:hover:bg-opacity-90 transition-colors ${isMobile ? 'px-3 py-2' : ''}`}>Sign Up</Link>
          </>
        )}
      </>
    );
  }

  return (
    // FIX: A strange TSX parsing error was occurring. Changing the semantic <header> tag to a <div> can resolve such issues.
    <div className="sticky top-0 z-50 bg-light-card/80 dark:bg-dark-surface/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 h-[65px]">
      <nav className="container mx-auto px-4 sm:px-6 h-full flex items-center">
        <div className="flex justify-between items-center w-full">
            <Link to="/" className="flex items-center space-x-2">
                <div className="p-2 bg-primary rounded-full text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                </div>
                <h1 className="text-xl font-bold">AIBookify</h1>
            </Link>
            
            <div className="flex items-center space-x-2">
                 {/* Theme Toggle */}
                <button onClick={toggleTheme} className="w-12 h-7 rounded-full p-1 flex items-center justify-between bg-gray-300 dark:bg-gray-600 relative transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary">
                    <SunIcon />
                    <MoonIcon />
                    <span className={`absolute top-[2px] left-[2px] w-6 h-6 bg-white rounded-full transition-transform duration-300 ease-in-out transform ${theme === 'dark' ? 'translate-x-[18px]' : ''}`}></span>
                </button>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center space-x-2">
                    <NavLinks />
                </div>
                
                {/* Mobile Menu Button */}
                <div className="md:hidden">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </button>
                </div>
            </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="absolute top-[65px] left-0 right-0 bg-light-card dark:bg-dark-surface border-b dark:border-gray-700 p-4 md:hidden">
            <div className="space-y-1">
                <NavLinks isMobile />
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}