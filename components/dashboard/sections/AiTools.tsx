
import React from 'react';

const ToolCard: React.FC<{ title: string; description: string; }> = ({ title, description }) => (
    <div className="bg-light-bg dark:bg-dark-surface p-6 rounded-lg border border-dashed border-gray-400 dark:border-gray-600">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
    </div>
);

const AiTools: React.FC = () => {
    return (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow text-center">
             <div className="mx-auto w-16 h-16 mb-4 text-primary">
                 <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 8-2 4 2 4 2-4-2-4z"/><path d="M20 10.5c0-.2 0-.3.1-.5L22 8l-2-3.5-2.1.9c-.3-.2-.5-.4-.8-.6L16 2h-4l-.9 3.8c-.3.2-.6.4-.8.6l-2.1-.9L6 8l1.9 2.5c0 .1.1.3.1.5l-1.9 2.5L8 16l2.1-.9c.3.2.5.4.8.6L12 22h4l.9-3.8c.3-.2.6-.4.8-.6l2.1.9 2-3.5-1.9-2.5c0-.2-.1-.4-.1-.5Z"/></svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">AI Tools - Coming Soon!</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
                Unlock powerful automation for your hotel. These tools will be available with the Elite Plan.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <ToolCard title="AI Marketing" description="Automatically generate and post social media content to attract more guests." />
                <ToolCard title="Price Genius" description="Dynamically adjust your room prices based on demand, events, and competitor data." />
                <ToolCard title="Review Manager" description="AI-powered replies to guest reviews on all major platforms, boosting your online reputation." />
            </div>
        </div>
    );
};

export default AiTools;
