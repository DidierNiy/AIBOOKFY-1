# Chat History Feature

## Overview

The chat history feature allows travelers to save their conversations and continue where they left off, providing consistency in their hotel search experience.

## Features

### Backend Features

1. **Session Management**

   - Automatically creates new chat sessions when users start conversations
   - Stores session title, messages, and metadata
   - Generates session titles based on the first message

2. **Message Persistence**

   - Saves all user and AI messages to MongoDB
   - Tracks message timestamps and sender information
   - Associates messages with specific chat sessions

3. **Session Retrieval**
   - GET `/api/chat/sessions` - Returns list of user's chat sessions
   - GET `/api/chat/sessions/:sessionId` - Loads specific chat session with all messages

### Frontend Features

1. **Session Navigation**

   - Sidebar displays chat history with session titles
   - Shows last message preview and message count
   - Highlights currently active session

2. **Seamless Continuity**
   - Users can click on previous sessions to continue conversations
   - Maintains context and conversation flow
   - New messages are automatically saved to the current session

## Database Schema

### ChatHistory Model

```typescript
{
  hotelId: string,        // Session ID for smart chat
  userId: string,         // User identifier
  messages: [{
    content: string,      // Message text
    sender: string,       // User ID or 'AI'
    timestamp: Date,      // When message was sent
    isAI: boolean        // True if AI message
  }],
  sessionTitle: string,   // Generated from first message
  lastMessage: string,    // Last message for preview
  createdAt: Date,
  updatedAt: Date
}
```

## Usage

### For Users

1. **Starting a New Chat**

   - Click "New Chat" button to begin fresh conversation
   - First message automatically creates a new session

2. **Continuing Previous Chats**

   - View chat history in the sidebar
   - Click on any previous session to continue
   - All previous context is loaded

3. **Session Information**
   - Each session shows title, last message, and date
   - Message count indicates conversation length

### For Developers

#### Backend Integration

```javascript
// Get user's chat sessions
const sessions = await chatService.getChatSessions(userId);

// Load specific session
const session = await chatService.loadChatSession(sessionId, userId);

// Send message with session
const response = await chatService.getSmartChatResponse(
  message,
  userId,
  sessionId
);
```

#### Frontend Integration

```javascript
// Load chat sessions
const sessions = await getChatSessions(authToken);

// Load specific session
const session = await loadChatSession(sessionId, authToken);

// Send message with session continuation
const response = await getSmartChatResponse(message, authToken, sessionId);
```

## Benefits

1. **Enhanced User Experience**

   - No need to repeat context in new conversations
   - Seamless continuation of hotel searches
   - Easy access to previous conversations

2. **Improved AI Context**

   - AI maintains conversation history for better responses
   - Understands user preferences from past interactions
   - More personalized recommendations

3. **Data Persistence**
   - Conversations survive browser refreshes
   - Works across different devices (when logged in)
   - Long-term conversation tracking

## Technical Implementation

### Session Creation

- New sessions are created automatically on first message
- Session IDs are used as `hotelId` in the ChatHistory model
- Session titles are generated from the first few words of the initial message

### Message Flow

1. User sends message
2. System checks for existing session or creates new one
3. User message is saved to database
4. AI processes message with conversation context
5. AI response is saved to same session
6. Session's `lastMessage` field is updated

### Error Handling

- Graceful fallback when sessions can't be loaded
- Automatic session creation if ID is invalid
- User-friendly error messages for failed operations

## Future Enhancements

1. **Session Organization**

   - Folder/category system for organizing chats
   - Search functionality within chat history
   - Bulk operations (delete, export)

2. **Enhanced Metadata**

   - Session tags and labels
   - Favorite/bookmark sessions
   - Session sharing capabilities

3. **Analytics**
   - Track session engagement metrics
   - Identify popular conversation topics
   - User behavior analysis for improvements
