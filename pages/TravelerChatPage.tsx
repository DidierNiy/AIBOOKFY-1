import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/common/Footer';

// Fix: Changed JSX.Element to React.ReactElement to resolve namespace error.
const FeatureCard = ({ icon, title, children }: { icon: React.ReactElement, title: string, children: React.ReactNode }) => (
    <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow-md transition-transform hover:scale-105">
        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-full mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400">{children}</p>
    </div>
);

const LandingPage: React.FC = () => {
    return (
        <>
            <main>
                {/* Hero Section */}
                <section className="text-center py-20 md:py-32 bg-light-bg dark:bg-dark-bg">
                    <div className="container mx-auto px-6">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-light-text dark:text-dark-text mb-4 animate-fade-in-up">
                            Your Smart Hotel Booking Assistant
                        </h1>
                        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            AIBookify uses cutting-edge AI to create a seamless booking experience for travelers and a powerful management dashboard for hotels.
                        </p>
                        <div className="flex justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                            <Link to="/auth?role=traveler" className="px-8 py-3 bg-primary text-white font-semibold rounded-lg shadow-lg hover:bg-primary/90 transition-all transform hover:scale-105">
                                Find a Hotel
                            </Link>
                            <Link to="/auth?role=hotel" className="px-8 py-3 bg-secondary text-white font-semibold rounded-lg shadow-lg hover:bg-secondary/90 transition-all transform hover:scale-105">
                                List Your Property
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 bg-white dark:bg-dark-surface">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold">Why Choose AIBookify?</h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">Discover the future of hospitality.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            <FeatureCard 
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
                                title="Conversational Booking"
                            >
                                Travelers can find and book hotels simply by chatting with our AI. No more endless scrolling through filters.
                            </FeatureCard>
                            <FeatureCard
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 8-2 4 2 4 2-4-2-4z"/><path d="M20 10.5c0-.2 0-.3.1-.5L22 8l-2-3.5-2.1.9c-.3-.2-.5-.4-.8-.6L16 2h-4l-.9 3.8c-.3.2-.6.4-.8.6l-2.1-.9L6 8l1.9 2.5c0 .1.1.3.1.5l-1.9 2.5L8 16l2.1-.9c.3.2.5.4.8.6L12 22h4l.9-3.8c.3-.2.6-.4.8-.6l2.1.9 2-3.5-1.9-2.5c0-.2-.1-.4-.1-.5Z"/></svg>}
                                title="AI-Powered Dashboard"
                            >
                                Hotel managers get actionable insights, from pricing recommendations to automated guest communication.
                            </FeatureCard>
                             <FeatureCard
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
                                title="Seamless Integration"
                            >
                                Our platform is built to work with your existing tools, making the transition to AIBookify effortless and effective.
                            </FeatureCard>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
};

export default LandingPage;