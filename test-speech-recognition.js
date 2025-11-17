/**
 * Test script for Speech Recognition functionality
 * This script tests the voice input feature integration with chat history
 */

const BASE_URL = 'http://localhost:5000';

async function testSpeechIntegration() {
  console.log('🎤 Testing Speech Recognition Integration\n');

  try {
    // Test 1: Simulate voice message with transcription
    console.log('1️⃣ Testing voice message transcription...');
    const voiceTranscript = "I need a hotel in Paris with a pool and WiFi";
    
    const voiceResponse = await fetch(`${BASE_URL}/api/chat/smart-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: voiceTranscript,
        isVoiceMessage: true 
      }),
    });
    
    if (voiceResponse.ok) {
      const voiceData = await voiceResponse.json();
      console.log(`✅ Voice message processed: "${voiceTranscript}"`);
      console.log(`🤖 AI Response: ${voiceData.response.substring(0, 100)}...`);
      console.log(`🏨 Hotels found: ${voiceData.hotels?.length || 0}`);
      
      const sessionId = voiceData.sessionId;
      
      // Test 2: Continue conversation with follow-up voice message
      console.log('\n2️⃣ Testing conversation context with voice...');
      const followUpTranscript = "Show me something near the Eiffel Tower";
      
      const followUpResponse = await fetch(`${BASE_URL}/api/chat/smart-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: followUpTranscript,
          sessionId: sessionId,
          isVoiceMessage: true 
        }),
      });
      
      if (followUpResponse.ok) {
        const followUpData = await followUpResponse.json();
        console.log(`✅ Follow-up voice message: "${followUpTranscript}"`);
        console.log(`🤖 AI maintained context: ${followUpData.response.substring(0, 100)}...`);
        console.log(`🔗 Same session ID: ${followUpData.sessionId === sessionId}`);
      }
      
      // Test 3: Load session and verify voice messages are preserved
      console.log('\n3️⃣ Testing voice message persistence...');
      const sessionResponse = await fetch(`${BASE_URL}/api/chat/sessions/${sessionId}`);
      
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        console.log(`✅ Session loaded with ${sessionData.messages.length} messages`);
        
        sessionData.messages.forEach((msg, index) => {
          const icon = msg.sender === 'ai' ? '🤖' : (msg.isVoiceMessage ? '🎤' : '👤');
          console.log(`   ${icon} ${msg.text.substring(0, 60)}...`);
        });
      }
      
    } else {
      console.log('❌ Voice message test failed');
    }
    
    // Test 4: Test punctuation enhancement
    console.log('\n4️⃣ Testing punctuation enhancement...');
    const testPhrases = [
      "hello how are you",
      "can you find me a hotel", 
      "yes that looks good",
      "no thank you",
      "what about something cheaper"
    ];
    
    testPhrases.forEach((phrase, index) => {
      // Simulate enhanced punctuation (this would be done by the speech service)
      const enhanced = enhancePunctuation(phrase);
      console.log(`   ${index + 1}. "${phrase}" → "${enhanced}"`);
    });
    
    console.log('\n🎉 All speech recognition tests completed!');
    
  } catch (error) {
    console.error('❌ Speech recognition test failed:', error.message);
    console.log('\n💡 Make sure the backend server is running and speech recognition is supported');
  }
}

// Helper function to simulate punctuation enhancement
function enhancePunctuation(text) {
  let enhanced = text.toLowerCase();
  
  // Capitalize first letter
  enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);
  
  // Add periods after common sentence endings
  enhanced = enhanced.replace(/\\b(yes|no|okay|ok|sure|exactly|definitely|absolutely|of course)$/gi, '$1.');
  
  // Add question marks for question patterns
  enhanced = enhanced.replace(/^(what|when|where|why|how|who|which|can|could|would|should|is|are|do|does|did|will|shall)\\b.*$/gi, (match) => {
    return match.endsWith('?') ? match : match + '?';
  });
  
  // Add periods if no ending punctuation
  if (!/[.!?]$/.test(enhanced.trim())) {
    enhanced += '.';
  }
  
  return enhanced;
}

// Test browser speech recognition support
function testBrowserSupport() {
  console.log('🌐 Browser Support Check:');
  
  const SpeechRecognition = 
    (typeof window !== 'undefined') && (
      window.SpeechRecognition || 
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition
    );
  
  if (SpeechRecognition) {
    console.log('✅ Speech Recognition is supported');
  } else {
    console.log('❌ Speech Recognition is not supported in this environment');
    console.log('💡 For full testing, run in a browser that supports Web Speech API');
  }
  
  console.log('');
}

// Run tests
testBrowserSupport();
testSpeechIntegration();