"use client";
import { useEffect, useRef, useState } from "react";
import ChatMessage from "./ChatMessage";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  // Initialize speech synthesis on client side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Load conversation from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("fineprint_chat_history");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load chat history", e);
      }
    } else {
      // Welcome message
      setMessages([{
        role: "assistant",
        content: "Hello! I'm your FinePrint AI assistant. I can help you understand insurance policies, explain clauses, and answer your questions. You can type or use voice to chat with me!",
        timestamp: Date.now()
      }]);
    }
  }, []);

  // Save conversation to localStorage whenever it changes
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("fineprint_chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.abort();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const speakText = (text) => {
    if (!synthRef.current) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: "user",
      content: input.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call the backend API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          conversation: messages.slice(-5) // Send last 5 messages for context
        })
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();
      
      const assistantMessage = {
        role: "assistant",
        content: data.response,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Auto-speak the response
      speakText(data.response);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    localStorage.removeItem("fineprint_chat_history");
    setMessages([{
      role: "assistant",
      content: "Chat history cleared. How can I help you?",
      timestamp: Date.now()
    }]);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        className="chat-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle chat"
      >
        {isOpen ? "✕" : "💬"}
        {!isOpen && messages.length > 1 && (
          <span className="chat-badge">{messages.length - 1}</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-content">
              <div className="robot-avatar">
                <div className="robot-body">
                  <div className="robot-head">
                    <div className="robot-eyes">
                      <div className="eye left"></div>
                      <div className="eye right"></div>
                    </div>
                    <div className="robot-antenna"></div>
                  </div>
                  <div className="robot-name">FinePrint AI</div>
                </div>
              </div>
              <div>
                <div className="chat-title">AI Assistant</div>
                <div className="chat-status">
                  {isSpeaking ? "🔊 Speaking..." : isListening ? "🎤 Listening..." : "Online"}
                </div>
              </div>
            </div>
            <div className="chat-actions">
              <button onClick={clearChat} className="chat-action-btn" title="Clear chat">🗑</button>
              <button onClick={() => setIsOpen(false)} className="chat-action-btn" title="Close">✕</button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <ChatMessage
                key={idx}
                message={msg}
                onSpeak={() => speakText(msg.content)}
                isSpeaking={isSpeaking}
                onStopSpeak={stopSpeaking}
              />
            ))}
            {isLoading && (
              <div className="chat-message assistant">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question..."
              rows="1"
              className="chat-input"
            />
            <div className="chat-input-actions">
              <button
                onClick={toggleListening}
                className={`voice-btn ${isListening ? "listening" : ""}`}
                title="Voice input"
              >
                {isListening ? "🔴" : ""}
              </button>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="send-btn"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}