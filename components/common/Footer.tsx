import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-light-card dark:bg-dark-surface border-t border-gray-200 dark:border-gray-700">
            <div className="container mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 bg-primary rounded-full text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                        </div>
                        <h1 className="text-xl font-bold">AIBookify</h1>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 md:mt-0">
                        © {new Date().getFullYear()} AIBookify. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
