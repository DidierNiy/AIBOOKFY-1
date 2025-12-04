import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Ensure ChatProvider is imported from where your ChatContext is defined
import { ChatProvider } from './context/ChatContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ChatProvider>
    <App />
  </ChatProvider>
);