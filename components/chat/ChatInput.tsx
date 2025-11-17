import React, { useState, useRef, useEffect } from "react";
import speechRecognitionService from "../../services/speechRecognitionService";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [micPermission, setMicPermission] = useState<boolean | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  // Check microphone permission on component mount
  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    if (!speechRecognitionService.isSupportedBrowser()) {
      setMicPermission(false);
      return;
    }

    try {
      const hasPermission = await speechRecognitionService.requestPermissions();
      setMicPermission(hasPermission);
    } catch (error) {
      setMicPermission(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage("");
      setInterimTranscript("");
      // Auto-resize textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = "40px";
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "40px";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  const toggleListening = async () => {
    if (!speechRecognitionService.isSupportedBrowser()) {
      setSpeechError("Speech recognition is not supported in this browser.");
      return;
    }

    if (!micPermission) {
      const hasPermission = await speechRecognitionService.requestPermissions();
      if (!hasPermission) {
        setSpeechError("Microphone permission is required for voice input.");
        return;
      }
      setMicPermission(true);
    }

    if (isListening) {
      speechRecognitionService.stopListening();
      setIsListening(false);
      setIsProcessingVoice(false);
    } else {
      setSpeechError("");
      setInterimTranscript("");

      const started = speechRecognitionService.startListening(
        (result: SpeechRecognitionResult) => {
          if (result.isFinal) {
            // Final result - add to message
            setMessage((prev) => {
              const newMessage = prev + result.transcript + " ";
              return newMessage;
            });
            setInterimTranscript("");
            setIsProcessingVoice(true);

            // Auto-submit if confidence is high and it's a complete thought
            if (
              result.confidence > 0.8 &&
              /(\.|\\?|!|\\bthanks?\\b|\\bgood\\b)$/i.test(result.transcript)
            ) {
              setTimeout(() => {
                if (result.transcript.trim()) {
                  onSendMessage(result.transcript.trim());
                  setMessage("");
                }
                speechRecognitionService.stopListening();
                setIsListening(false);
                setIsProcessingVoice(false);
              }, 500);
            }
          } else {
            // Interim result - show as preview
            setInterimTranscript(result.transcript);
          }
        },
        (error: string) => {
          setSpeechError(error);
          setIsListening(false);
          setIsProcessingVoice(false);
        },
        () => {
          setIsListening(true);
        },
        () => {
          setIsListening(false);
          setIsProcessingVoice(false);
        }
      );

      if (!started) {
        setSpeechError("Failed to start speech recognition.");
      }
    }
  };

  const displayText =
    message + (interimTranscript ? ` ${interimTranscript}` : "");

  return (
    <div className="w-full">
      {speechError && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {speechError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center space-x-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary">
          {/* Microphone Button */}
          {speechRecognitionService.isSupportedBrowser() && (
            <button
              type="button"
              onClick={toggleListening}
              disabled={isLoading || isProcessingVoice}
              className={`p-2 rounded-full transition-all duration-200 ${
                isListening
                  ? "text-red-500 animate-pulse"
                  : micPermission
                  ? "text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-secondary"
                  : "text-gray-300 cursor-not-allowed"
              } disabled:opacity-50`}
              title={isListening ? "Stop recording" : "Start voice input"}
            >
              {isListening ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
              )}
            </button>
          )}

          <textarea
            ref={textareaRef}
            value={displayText}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder={
              isListening ? "Listening... Speak now" : "Message AIBookify..."
            }
            className="flex-1 resize-none bg-transparent py-2 text-sm focus:outline-none dark:text-dark-text"
            rows={1}
            style={{ minHeight: "40px", maxHeight: "120px" }}
            disabled={isLoading || isProcessingVoice}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!message.trim() || isLoading || isProcessingVoice}
            className="p-2 w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-white disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-opacity-90 transition-colors"
            aria-label="Send message"
          >
            {isLoading || isProcessingVoice ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            )}
          </button>
        </div>

        {/* Voice Status Indicator */}
        {isListening && (
          <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <div className="flex gap-1">
              <div
                className="w-1 h-4 bg-blue-500 rounded animate-pulse"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="w-1 h-4 bg-blue-500 rounded animate-pulse"
                style={{ animationDelay: "150ms" }}
              ></div>
              <div
                className="w-1 h-4 bg-blue-500 rounded animate-pulse"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
            <span>Listening... Speak clearly</span>
          </div>
        )}

        {isProcessingVoice && (
          <div className="mt-2 text-sm text-green-600 dark:text-green-400">
            Processing voice input...
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatInput;
