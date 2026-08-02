"use client";

export default function ChatMessage({ message, onSpeak, isSpeaking, onStopSpeak }) {
  const isAssistant = message.role === "assistant";
  const time = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: "2-digit", 
    minute: "2-digit" 
  });

  return (
    <div className={`chat-message ${isAssistant ? "assistant" : "user"}`}>
      <div className="message-avatar">
        {isAssistant ? (
          <div className="mini-robot">
            <div className="mini-head">
              <div className="mini-eyes">
                <div className="mini-eye"></div>
                <div className="mini-eye"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="user-icon">👤</div>
        )}
      </div>
      <div className="message-body">
        <div className="message-content">{message.content}</div>
        <div className="message-footer">
          <span className="message-time">{time}</span>
          {isAssistant && (
            <button
              onClick={isSpeaking ? onStopSpeak : onSpeak}
              className="speak-btn"
              title={isSpeaking ? "Stop speaking" : "Read aloud"}
            >
              {isSpeaking ? "🔇" : "🔊"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}