interface SpeechRecognitionConfig {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

class SpeechRecognitionService {
  private recognition: any;
  private isSupported: boolean;
  private isListening: boolean = false;
  private onResult: (result: SpeechRecognitionResult) => void = () => {};
  private onError: (error: string) => void = () => {};
  private onStart: () => void = () => {};
  private onEnd: () => void = () => {};

  constructor() {
    // Check for browser support
    this.isSupported = this.checkSupport();
    
    if (this.isSupported) {
      this.initializeRecognition();
    }
  }

  private checkSupport(): boolean {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;
    
    return !!SpeechRecognition;
  }

  private initializeRecognition(): void {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;
    
    this.recognition = new SpeechRecognition();
    
    // Configure for maximum accuracy and proper punctuation
    const config: SpeechRecognitionConfig = {
      lang: 'en-US', // Can be made configurable
      continuous: true,
      interimResults: true,
      maxAlternatives: 3
    };
    
    this.recognition.lang = config.lang;
    this.recognition.continuous = config.continuous;
    this.recognition.interimResults = config.interimResults;
    this.recognition.maxAlternatives = config.maxAlternatives;
    
    // Enhanced settings for better accuracy
    if ('webkitSpeechRecognition' in window) {
      // WebKit specific optimizations
      this.recognition.serviceURI = 'https://www.google.com/speech-api/v2/recognize';
    }

    // Event handlers
    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStart();
    };

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      let maxConfidence = 0;

      // Process all results for maximum accuracy
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence || 0.8;

        if (result.isFinal) {
          // Apply punctuation enhancement
          finalTranscript += this.enhancePunctuation(transcript);
          maxConfidence = Math.max(maxConfidence, confidence);
        } else {
          interimTranscript += transcript;
        }
      }

      // Return the best result
      if (finalTranscript) {
        this.onResult({
          transcript: finalTranscript.trim(),
          confidence: maxConfidence,
          isFinal: true
        });
      } else if (interimTranscript) {
        this.onResult({
          transcript: interimTranscript.trim(),
          confidence: 0.5,
          isFinal: false
        });
      }
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      let errorMessage = 'Speech recognition error';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try speaking again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not accessible. Please check permissions.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please enable microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service not available.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
      
      this.onError(errorMessage);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onEnd();
    };
  }

  private enhancePunctuation(text: string): string {
    // Enhanced punctuation rules for natural speech
    let enhanced = text.toLowerCase();
    
    // Capitalize first letter
    enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);
    
    // Add periods after common sentence endings
    enhanced = enhanced.replace(/\b(yes|no|okay|ok|sure|exactly|definitely|absolutely|of course)$/gi, '$1.');
    
    // Add question marks for question patterns
    enhanced = enhanced.replace(/^(what|when|where|why|how|who|which|can|could|would|should|is|are|do|does|did|will|shall)\b.*$/gi, (match) => {
      return match.endsWith('?') ? match : match + '?';
    });
    
    // Add periods if no ending punctuation
    if (!/[.!?]$/.test(enhanced.trim())) {
      enhanced += '.';
    }
    
    // Capitalize after periods
    enhanced = enhanced.replace(/(\.)\s*([a-z])/g, (match, period, letter) => {
      return period + ' ' + letter.toUpperCase();
    });
    
    // Handle common contractions and proper capitalization
    enhanced = enhanced.replace(/\bi\b/g, 'I');
    enhanced = enhanced.replace(/\bi'm\b/g, "I'm");
    enhanced = enhanced.replace(/\bi'll\b/g, "I'll");
    enhanced = enhanced.replace(/\bi've\b/g, "I've");
    enhanced = enhanced.replace(/\bi'd\b/g, "I'd");
    enhanced = enhanced.replace(/\bdon't\b/g, "don't");
    enhanced = enhanced.replace(/\bwon't\b/g, "won't");
    enhanced = enhanced.replace(/\bcan't\b/g, "can't");
    enhanced = enhanced.replace(/\bwouldn't\b/g, "wouldn't");
    enhanced = enhanced.replace(/\bcouldn't\b/g, "couldn't");
    enhanced = enhanced.replace(/\bshouldn't\b/g, "shouldn't");
    
    return enhanced;
  }

  public startListening(
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (error: string) => void = () => {},
    onStart: () => void = () => {},
    onEnd: () => void = () => {}
  ): boolean {
    if (!this.isSupported) {
      onError('Speech recognition is not supported in this browser.');
      return false;
    }

    if (this.isListening) {
      return false;
    }

    this.onResult = onResult;
    this.onError = onError;
    this.onStart = onStart;
    this.onEnd = onEnd;

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      onError('Failed to start speech recognition.');
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  public isCurrentlyListening(): boolean {
    return this.isListening;
  }

  public isSupportedBrowser(): boolean {
    return this.isSupported;
  }

  // Request microphone permissions
  public async requestPermissions(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }

  // Set language for recognition
  public setLanguage(lang: string): void {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  // Get available languages (common ones)
  public getAvailableLanguages(): Array<{code: string, name: string}> {
    return [
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'en-AU', name: 'English (Australia)' },
      { code: 'en-CA', name: 'English (Canada)' },
      { code: 'es-ES', name: 'Spanish (Spain)' },
      { code: 'es-MX', name: 'Spanish (Mexico)' },
      { code: 'fr-FR', name: 'French (France)' },
      { code: 'de-DE', name: 'German' },
      { code: 'it-IT', name: 'Italian' },
      { code: 'pt-BR', name: 'Portuguese (Brazil)' },
      { code: 'ru-RU', name: 'Russian' },
      { code: 'ja-JP', name: 'Japanese' },
      { code: 'ko-KR', name: 'Korean' },
      { code: 'zh-CN', name: 'Chinese (Simplified)' },
      { code: 'hi-IN', name: 'Hindi' },
      { code: 'ar-SA', name: 'Arabic' }
    ];
  }
}

export default new SpeechRecognitionService();