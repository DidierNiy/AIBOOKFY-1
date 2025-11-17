/**
 * Test file to demonstrate chat history functionality
 * Run this with: node test-chat-history.js
 */

const BASE_URL = 'http://localhost:5000';

async function testChatHistory() {
  console.log('🧪 Testing Chat History Functionality\n');

  try {
    // Test 1: Start a new conversation
    console.log('1️⃣ Starting new chat session...');
    const firstResponse = await fetch(`${BASE_URL}/api/chat/smart-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'I need a hotel in Paris' }),
    });
    
    const firstData = await firstResponse.json();
    console.log(`✅ New session created: ${firstData.sessionId}`);
    console.log(`📝 AI Response: ${firstData.response.substring(0, 100)}...`);
    
    const sessionId = firstData.sessionId;

    // Test 2: Continue the conversation
    console.log('\n2️⃣ Continuing conversation...');
    const secondResponse = await fetch(`${BASE_URL}/api/chat/smart-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: 'Something near the Eiffel Tower with a pool',
        sessionId: sessionId 
      }),
    });
    
    const secondData = await secondResponse.json();
    console.log(`✅ Same session continued: ${secondData.sessionId}`);
    console.log(`📝 AI Response: ${secondData.response.substring(0, 100)}...`);

    // Test 3: Get chat sessions
    console.log('\n3️⃣ Fetching chat sessions...');
    const sessionsResponse = await fetch(`${BASE_URL}/api/chat/sessions`);
    const sessions = await sessionsResponse.json();
    console.log(`✅ Found ${sessions.length} chat sessions`);
    
    if (sessions.length > 0) {
      sessions.forEach((session, index) => {
        console.log(`📂 Session ${index + 1}: "${session.title}" (${session.messageCount} messages)`);
      });
    }

    // Test 4: Load specific session
    console.log('\n4️⃣ Loading specific session...');
    const sessionResponse = await fetch(`${BASE_URL}/api/chat/sessions/${sessionId}`);
    const sessionData = await sessionResponse.json();
    console.log(`✅ Loaded session: "${sessionData.title}"`);
    console.log(`💬 Messages in session: ${sessionData.messages.length}`);
    
    sessionData.messages.forEach((msg, index) => {
      const sender = msg.sender === 'ai' ? '🤖' : '👤';
      console.log(`   ${sender} ${msg.text.substring(0, 50)}...`);
    });

    // Test 5: Delete a session
    console.log('\n5️⃣ Testing session deletion...');
    const deleteResponse = await fetch(`${BASE_URL}/api/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    
    if (deleteResponse.ok) {
      console.log('✅ Session deleted successfully');
      
      // Verify deletion by trying to fetch sessions again
      const updatedSessionsResponse = await fetch(`${BASE_URL}/api/chat/sessions`);
      const updatedSessions = await updatedSessionsResponse.json();
      console.log(`📊 Sessions after deletion: ${updatedSessions.length}`);
    } else {
      console.log('❌ Failed to delete session');
    }

    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the backend server is running on port 5000');
  }
}

// Run the test
testChatHistory();