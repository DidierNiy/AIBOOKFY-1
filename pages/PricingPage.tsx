import React from 'react';
import { useNavigate } from 'react-router-dom';

const PricingCard: React.FC<{ plan: string; price: number; features: string[]; recommended?: boolean; onSelect: () => void; }> = 
({ plan, price, features, recommended, onSelect }) => (
    <div className={`border rounded-lg p-6 flex flex-col ${recommended ? 'border-primary' : 'border-gray-300 dark:border-gray-600'}`}>
        {recommended && <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full self-start">Most Popular</span>}
        <h3 className="text-2xl font-bold mt-4">{plan}</h3>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Perfect for getting started.</p>
        <p className="text-4xl font-extrabold my-6">${price}<span className="text-base font-medium text-gray-500">/month</span></p>
        <ul className="space-y-3 mb-8">
            {features.map(feature => (
                <li key={feature} className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                    {feature}
                </li>
            ))}
        </ul>
        <button onClick={onSelect} className={`mt-auto w-full py-3 rounded-lg font-semibold transition-colors ${recommended ? 'bg-primary text-white hover:bg-opacity-90' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
            Choose Plan
        </button>
    </div>
);


const PricingPage: React.FC = () => {
    const navigate = useNavigate();

    const handleSelectPlan = () => {
        // Here you would typically handle payment processing
        console.log('Plan selected, processing payment...');
        // On successful payment, redirect to dashboard
        navigate('/dashboard');
    };

    return (
        <div className="bg-light-bg dark:bg-dark-bg py-12 px-4">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl font-extrabold mb-4">Choose Your Plan</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                    Unlock powerful AI tools to grow your business.
                </p>
            </div>
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 mt-12">
                <PricingCard
                    plan="Pro Plan"
                    price={15}
                    features={['AI Conversational Agent', '10 Active Listings', 'Booking Management', 'Basic Analytics']}
                    onSelect={handleSelectPlan}
                />
                <PricingCard
                    plan="Elite Plan"
                    price={49}
                    features={['All Pro features', 'Unlimited Listings', 'AI Marketing Tools', 'Advanced AI Reports', 'Priority Support']}
                    recommended
                    onSelect={handleSelectPlan}
                />
            </div>
        </div>
    );
};

export default PricingPage;