"use client";
import { useEffect, useRef, useState } from "react";
import ChatMessage from "./ChatMessage";
import PolicyViewer from "./PolicyViewer";
import { loadPolicyContext, clearPolicyContext } from "@/lib/policyStore";
import { getLang, setLang } from "@/lib/lang";
import { chunkPolicy, retrieve } from "@/lib/rag";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [policyCtx, setPolicyCtx] = useState(null);
  const [lang, setLangState] = useState("en");
  const [viewer, setViewer] = useState({ open: false, ref: "" });
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const voicesRef = useRef([]);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
      const loadVoices = () => { voicesRef.current = synthRef.current.getVoices() || []; };
      loadVoices();
      synthRef.current.addEventListener?.("voiceschanged", loadVoices);
      return () => synthRef.current?.removeEventListener?.("voiceschanged", loadVoices);
    }
  }, []);

  useEffect(() => {
    setLangState(getLang());
    const saved = localStorage.getItem("fineprint_chat_history");
    if (saved) {
      try { setMessages(JSON.parse(saved)); } catch { setMessages([]); }
    } else {
      setMessages([{ role: "assistant", lang: "en", timestamp: Date.now(),
        content: "Hello! I'm your FinePrint AI assistant. Upload your policy on the Read page and I will answer using ONLY your own policy document — with clickable § citations. (हिंदी के लिए हेडर में 🌐 बटन दबाएँ)" }]);
    }
  }, []);

  useEffect(() => { if (messages.length) localStorage.setItem("fineprint_chat_history", JSON.stringify(messages)); }, [messages]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (isOpen) setPolicyCtx(loadPolicyContext()); }, [isOpen]);

  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.onresult = (e) => { setInput(e.results[0][0].transcript); setIsListening(false); };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
    return () => { recognitionRef.current?.abort(); synthRef.current?.cancel(); };
  }, []);

  function pickVoice(code) {
    if (!voicesRef.current?.length && synthRef.current) voicesRef.current = synthRef.current.getVoices() || [];
    const list = voicesRef.current || [];
    if (code === "hi") return list.find((v) => (v.lang || "").toLowerCase().replace("_", "-").startsWith("hi")) || list.find((v) => /hindi/i.test(v.name)) || null;
    return list.find((v) => (v.lang || "").toLowerCase().replace("_", "-") === "en-us") || list.find((v) => (v.lang || "").toLowerCase().startsWith("en")) || null;
  }

  const toggleListening = () => {
    if (!recognitionRef.current) { alert("Speech recognition is not supported. Use Chrome or Edge."); return; }
    if (isListening) { recognitionRef.current.abort(); setIsListening(false); }
    else { recognitionRef.current.lang = lang === "hi" ? "hi-IN" : "en-US"; setIsListening(true); recognitionRef.current.start(); }
  };

  const speakText = (text, langCode) => {
    if (!synthRef.current) return;
    const code = langCode === "hi" ? "hi" : langCode === "en" ? "en" : lang;
    synthRef.current.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = code === "hi" ? "hi-IN" : "en-US";
    const v = pickVoice(code);
    if (v) u.voice = v;
    u.rate = 0.95; u.pitch = 1; u.volume = 1;
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(u);
  };

  const stopSpeaking = () => { synthRef.current?.cancel(); setIsSpeaking(false); };

  const toggleLang = () => {
    const next = lang === "en" ? "hi" : "en";
    setLangState(next); setLang(next); stopSpeaking();
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = { role: "user", content: input.trim(), timestamp: Date.now() };
    setMessages((p) => [...p, userMessage]);
    setInput("");
    setIsLoading(true);
    try {
      const ctx = loadPolicyContext();
      setPolicyCtx(ctx);

      // poor-man's RAG: retrieve relevant clauses from the saved policy
      let retrieved = [];
      if (ctx?.text) retrieved = retrieve(chunkPolicy(ctx.text), userMessage.content);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          conversation: messages.slice(-5),
          lang,
          retrieved,
          policyContext: ctx ? { name: ctx.name, text: ctx.text, reportJson: ctx.reportJson } : null,
        }),
      });
      if (!response.ok) throw new Error("Failed to get response");
      const data = await response.json();
      setMessages((p) => [...p, { role: "assistant", content: data.response, timestamp: Date.now(), lang }]);
      speakText(data.response, lang);
    } catch (e) {
      console.error("Chat error:", e);
      setMessages((p) => [...p, { role: "assistant", lang, timestamp: Date.now(),
        content: lang === "hi" ? "माफ़ कीजिए, कुछ गड़बड़ी हो गई। दोबारा कोशिश करें।" : "I'm sorry, I encountered an error. Please try again." }]);
    } finally { setIsLoading(false); }
  };

  const clearChat = () => {
    localStorage.removeItem("fineprint_chat_history");
    setMessages([{ role: "assistant", lang, timestamp: Date.now(), content: lang === "hi" ? "चैट साफ़ हो गई। कैसे मदद करूँ?" : "Chat history cleared. How can I help you?" }]);
  };

  const forgetPolicy = () => { clearPolicyContext(); setPolicyCtx(null); };

  return (
    <>
      <button className="chat-toggle" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle chat">
        {isOpen ? "✕" : "💬"}
        {!isOpen && messages.length > 1 && <span className="chat-badge">{messages.length - 1}</span>}
      </button>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-content">
              <div className="robot-avatar"><div className="robot-body"><div className="robot-head"><div className="robot-eyes"><div className="eye left"></div><div className="eye right"></div></div><div className="robot-antenna"></div></div><div className="robot-name">FinePrint AI</div></div></div>
              <div>
                <div className="chat-title">AI Assistant</div>
                <div className="chat-status">
                  {isSpeaking ? "🔊 Speaking..." : isListening ? "🎤 Listening..." : (policyCtx ? "📄 Policy loaded" : "Online") + (lang === "hi" ? " · हिंदी" : "")}
                </div>
              </div>
            </div>
            <div className="chat-actions">
              <button onClick={toggleLang} className="lang-btn" title={lang === "en" ? "Switch to Hindi" : "Switch to English"}>{lang === "en" ? "हिं" : "EN"}</button>
              {policyCtx && <button onClick={forgetPolicy} className="chat-action-btn" title="Forget policy">📄</button>}
              <button onClick={clearChat} className="chat-action-btn" title="Clear chat">🗑</button>
              <button onClick={() => setIsOpen(false)} className="chat-action-btn" title="Close">✕</button>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <ChatMessage key={idx} message={msg}
                onSpeak={() => speakText(msg.content, msg.lang)}
                isSpeaking={isSpeaking}
                onStopSpeak={stopSpeaking}
                onCite={(ref) => setViewer({ open: true, ref })} />
            ))}
            {isLoading && (
              <div className="chat-message assistant"><div className="message-content"><div className="typing-indicator"><span></span><span></span><span></span></div></div></div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <textarea value={input} onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={lang === "hi" ? "अपना सवाल लिखें..." : "Type your question..."} rows="1" className="chat-input" />
            <div className="chat-input-actions">
              <button onClick={toggleListening} className={"voice-btn" + (isListening ? " listening" : "")} title={isListening ? "Stop listening" : "Speak your question"}>
                <span className="voice-ico">{isListening ? "⏹" : "🎤"}</span>
                <span className="voice-lbl">{isListening ? "Listening…" : "Voice"}</span>
              </button>
              <button onClick={sendMessage} disabled={!input.trim() || isLoading} className="send-btn">➤</button>
            </div>
          </div>
        </div>
      )}

      <PolicyViewer open={viewer.open} onClose={() => setViewer({ open: false, ref: "" })}
        text={loadPolicyContext()?.text || ""} focusRef={viewer.ref} />
    </>
  );
}















// "use client";
// import { useEffect, useRef, useState } from "react";
// import ChatMessage from "./ChatMessage";
// import { loadPolicyContext, clearPolicyContext } from "@/lib/policyStore";
// import { getLang, setLang } from "@/lib/lang";

// export default function ChatBot() {
//   const [isOpen, setIsOpen] = useState(false);
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [isListening, setIsListening] = useState(false);
//   const [isSpeaking, setIsSpeaking] = useState(false);
//   const [policyCtx, setPolicyCtx] = useState(null);
//   const [lang, setLangState] = useState("en");
//   const messagesEndRef = useRef(null);
//   const recognitionRef = useRef(null);
//   const synthRef = useRef(null);
//   const voicesRef = useRef([]);

//   // Initialize speech synthesis + keep the browser's voice list fresh
//   useEffect(() => {
//     if (typeof window !== "undefined" && "speechSynthesis" in window) {
//       synthRef.current = window.speechSynthesis;
//       const loadVoices = () => {
//         voicesRef.current = synthRef.current.getVoices() || [];
//       };
//       loadVoices();
//       if (typeof synthRef.current.addEventListener === "function") {
//         synthRef.current.addEventListener("voiceschanged", loadVoices);
//       }
//       return () => {
//         if (synthRef.current && typeof synthRef.current.removeEventListener === "function") {
//           synthRef.current.removeEventListener("voiceschanged", loadVoices);
//         }
//       };
//     }
//   }, []);

//   // Load conversation + language on mount
//   useEffect(() => {
//     setLangState(getLang());
//     const saved = localStorage.getItem("fineprint_chat_history");
//     if (saved) {
//       try {
//         setMessages(JSON.parse(saved));
//       } catch (e) {
//         console.error("Failed to load chat history", e);
//       }
//     } else {
//       setMessages([{
//         role: "assistant",
//         content: "Hello! I'm your FinePrint AI assistant. Upload your policy on the Read page and I will answer using ONLY your own policy document. Type — or tap the 🎤 Voice button — to ask me anything! (हिंदी के लिए हेडर में 🌐 बटन दबाएँ)",
//         timestamp: Date.now(),
//         lang: "en"
//       }]);
//     }
//   }, []);

//   // Refresh policy memory whenever the chat window opens
//   useEffect(() => {
//     if (isOpen) setPolicyCtx(loadPolicyContext());
//   }, [isOpen]);

//   // Save conversation to localStorage whenever it changes
//   useEffect(() => {
//     if (messages.length > 0) {
//       localStorage.setItem("fineprint_chat_history", JSON.stringify(messages));
//     }
//   }, [messages]);

//   // Auto-scroll to bottom
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // Initialize speech recognition
//   useEffect(() => {
//     if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
//       const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//       recognitionRef.current = new SpeechRecognition();
//       recognitionRef.current.continuous = false;
//       recognitionRef.current.interimResults = false;
//       recognitionRef.current.lang = "en-US";
//       recognitionRef.current.onresult = (event) => {
//         const transcript = event.results[0][0].transcript;
//         setInput(transcript);
//         setIsListening(false);
//       };
//       recognitionRef.current.onerror = () => {
//         setIsListening(false);
//       };
//       recognitionRef.current.onend = () => {
//         setIsListening(false);
//       };
//     }
//     return () => {
//       if (recognitionRef.current) {
//         recognitionRef.current.abort();
//       }
//       if (synthRef.current) {
//         synthRef.current.cancel();
//       }
//     };
//   }, []);

//   // ===== NEW: pick the best installed voice for the message language =====
//   function pickVoice(langCode) {
//     if (!voicesRef.current?.length && synthRef.current) {
//       voicesRef.current = synthRef.current.getVoices() || [];
//     }
//     const list = voicesRef.current || [];

//     if (langCode === "hi") {
//       return (
//         list.find((v) => (v.lang || "").toLowerCase().replace("_", "-").startsWith("hi")) ||
//         list.find((v) => /hindi/i.test(v.name)) ||
//         null
//       );
//     }
//     return (
//       list.find((v) => (v.lang || "").toLowerCase().replace("_", "-") === "en-us") ||
//       list.find((v) => (v.lang || "").toLowerCase().startsWith("en")) ||
//       null
//     );
//   }

//   const toggleListening = () => {
//     if (!recognitionRef.current) {
//       alert("Speech recognition is not supported in your browser. Please use Chrome or Edge.");
//       return;
//     }
//     if (isListening) {
//       recognitionRef.current.abort();
//       setIsListening(false);
//     } else {
//       // NEW: voice input follows the selected language (Hindi or English)
//       recognitionRef.current.lang = lang === "hi" ? "hi-IN" : "en-US";
//       setIsListening(true);
//       recognitionRef.current.start();
//     }
//   };

//   // ===== UPDATED: speak each message in its OWN language =====
//   const speakText = (text, langCode) => {
//     if (!synthRef.current) return;
//     const code = langCode === "hi" ? "hi" : langCode === "en" ? "en" : lang;

//     synthRef.current.cancel();
//     const utterance = new SpeechSynthesisUtterance(text);
//     utterance.lang = code === "hi" ? "hi-IN" : "en-US";

//     const voice = pickVoice(code);
//     if (voice) utterance.voice = voice;

//     utterance.rate = 0.95; // slightly slower = clearer Hindi
//     utterance.pitch = 1.0;
//     utterance.volume = 1.0;
//     utterance.onstart = () => setIsSpeaking(true);
//     utterance.onend = () => setIsSpeaking(false);
//     utterance.onerror = () => setIsSpeaking(false);
//     synthRef.current.speak(utterance);
//   };

//   const stopSpeaking = () => {
//     if (synthRef.current) {
//       synthRef.current.cancel();
//       setIsSpeaking(false);
//     }
//   };

//   // Language toggle (English ↔ Hindi)
//   const toggleLang = () => {
//     const next = lang === "en" ? "hi" : "en";
//     setLangState(next);
//     setLang(next); // saves to localStorage + notifies glossary tooltips
//     stopSpeaking(); // stop any speech in the old language
//   };

//   const sendMessage = async () => {
//     if (!input.trim() || isLoading) return;
//     const userMessage = { role: "user", content: input.trim(), timestamp: Date.now() };
//     setMessages(prev => [...prev, userMessage]);
//     setInput("");
//     setIsLoading(true);
//     try {
//       const ctx = loadPolicyContext();
//       setPolicyCtx(ctx);

//       const response = await fetch("/api/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           message: userMessage.content,
//           conversation: messages.slice(-5),
//           lang: lang,
//           policyContext: ctx ? { name: ctx.name, text: ctx.text, reportJson: ctx.reportJson } : null
//         })
//       });

//       if (!response.ok) throw new Error("Failed to get response");
//       const data = await response.json();

//       // tag the reply with its language so the 🔊 button speaks it correctly later
//       const assistantMessage = { role: "assistant", content: data.response, timestamp: Date.now(), lang };
//       setMessages(prev => [...prev, assistantMessage]);
//       speakText(data.response, lang);
//     } catch (error) {
//       console.error("Chat error:", error);
//       setMessages(prev => [...prev, {
//         role: "assistant",
//         content: lang === "hi" ? "माफ़ कीजिए, कुछ गड़बड़ी हो गई। कृपया दोबारा कोशिश करें।" : "I'm sorry, I encountered an error. Please try again.",
//         timestamp: Date.now(),
//         lang
//       }]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const clearChat = () => {
//     localStorage.removeItem("fineprint_chat_history");
//     setMessages([{
//       role: "assistant",
//       content: lang === "hi" ? "चैट इतिहास साफ़ हो गया। मैं आपकी कैसे मदद करूँ?" : "Chat history cleared. How can I help you?",
//       timestamp: Date.now(),
//       lang
//     }]);
//   };

//   const forgetPolicy = () => {
//     clearPolicyContext();
//     setPolicyCtx(null);
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   };

//   return (
//     <>
//       <button className="chat-toggle" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle chat">
//         {isOpen ? "✕" : "💬"}
//         {!isOpen && messages.length > 1 && <span className="chat-badge">{messages.length - 1}</span>}
//       </button>

//       {isOpen && (
//         <div className="chat-window">
//           <div className="chat-header">
//             <div className="chat-header-content">
//               <div className="robot-avatar">
//                 <div className="robot-body">
//                   <div className="robot-head">
//                     <div className="robot-eyes">
//                       <div className="eye left"></div>
//                       <div className="eye right"></div>
//                     </div>
//                     <div className="robot-antenna"></div>
//                   </div>
//                   <div className="robot-name">FinePrint AI</div>
//                 </div>
//               </div>
//               <div>
//                 <div className="chat-title">AI Assistant</div>
//                 <div className="chat-status">
//                   {isSpeaking
//                     ? "🔊 Speaking..."
//                     : isListening
//                     ? "🎤 Listening..."
//                     : (policyCtx ? "📄 Policy loaded" : "Online") + (lang === "hi" ? " · हिंदी" : "")}
//                 </div>
//               </div>
//             </div>
//             <div className="chat-actions">
//               <button
//                 onClick={toggleLang}
//                 className="lang-btn"
//                 title={lang === "en" ? "हिंदी में जवाब पाएँ (Switch to Hindi)" : "Switch to English"}
//               >
//                 {lang === "en" ? "हिं" : "EN"}
//               </button>
//               {policyCtx && (
//                 <button onClick={forgetPolicy} className="chat-action-btn"
//                   title={"Policy memory: " + (policyCtx.name || "loaded") + " — click to forget"}>📄</button>
//               )}
//               <button onClick={clearChat} className="chat-action-btn" title="Clear chat">🗑</button>
//               <button onClick={() => setIsOpen(false)} className="chat-action-btn" title="Close">✕</button>
//             </div>
//           </div>

//           <div className="chat-messages">
//             {messages.map((msg, idx) => (
//               <ChatMessage
//                 key={idx}
//                 message={msg}
//                 onSpeak={() => speakText(msg.content, msg.lang)}
//                 isSpeaking={isSpeaking}
//                 onStopSpeak={stopSpeaking}
//               />
//             ))}
//             {isLoading && (
//               <div className="chat-message assistant">
//                 <div className="message-content">
//                   <div className="typing-indicator"><span></span><span></span><span></span></div>
//                 </div>
//               </div>
//             )}
//             <div ref={messagesEndRef} />
//           </div>

//           <div className="chat-input-area">
//             <textarea
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyPress={handleKeyPress}
//               placeholder={lang === "hi" ? "अपना सवाल लिखें..." : "Type your question..."}
//               rows="1"
//               className="chat-input"
//             />
//             <div className="chat-input-actions">
//               <button
//                 onClick={toggleListening}
//                 className={"voice-btn" + (isListening ? " listening" : "")}
//                 title={isListening ? "Stop listening" : "Speak your question"}
//                 aria-label={isListening ? "Stop listening" : "Speak your question"}
//               >
//                 <span className="voice-ico" aria-hidden="true">{isListening ? "⏹" : "🎤"}</span>
//                 <span className="voice-lbl">{isListening ? "Listening…" : "Voice"}</span>
//               </button>
//               <button onClick={sendMessage} disabled={!input.trim() || isLoading} className="send-btn" title="Send message">➤</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }










// "use client";
// import { useEffect, useRef, useState } from "react";
// import ChatMessage from "./ChatMessage";
// import { loadPolicyContext, clearPolicyContext } from "@/lib/policyStore";

// export default function ChatBot() {
//   const [isOpen, setIsOpen] = useState(false);
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [isListening, setIsListening] = useState(false);
//   const [isSpeaking, setIsSpeaking] = useState(false);
//   const [policyCtx, setPolicyCtx] = useState(null);
//   const messagesEndRef = useRef(null);
//   const recognitionRef = useRef(null);
//   const synthRef = useRef(null);

//   // Initialize speech synthesis on client side only
//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       synthRef.current = window.speechSynthesis;
//     }
//   }, []);

//   // Load conversation from localStorage on mount
//   useEffect(() => {
//     const saved = localStorage.getItem("fineprint_chat_history");
//     if (saved) {
//       try {
//         setMessages(JSON.parse(saved));
//       } catch (e) {
//         console.error("Failed to load chat history", e);
//       }
//     } else {
//       setMessages([{
//         role: "assistant",
//         content: "Hello! I'm your FinePrint AI assistant. Upload your policy on the Read page and I will answer using ONLY your own policy document. Type — or tap the 🎤 Voice button — to ask me anything!",
//         timestamp: Date.now()
//       }]);
//     }
//   }, []);

//   // Refresh policy memory whenever the chat window opens
//   useEffect(() => {
//     if (isOpen) setPolicyCtx(loadPolicyContext());
//   }, [isOpen]);

//   // Save conversation to localStorage whenever it changes
//   useEffect(() => {
//     if (messages.length > 0) {
//       localStorage.setItem("fineprint_chat_history", JSON.stringify(messages));
//     }
//   }, [messages]);

//   // Auto-scroll to bottom
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // Initialize speech recognition
//   useEffect(() => {
//     if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
//       const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//       recognitionRef.current = new SpeechRecognition();
//       recognitionRef.current.continuous = false;
//       recognitionRef.current.interimResults = false;
//       recognitionRef.current.lang = "en-US";
//       recognitionRef.current.onresult = (event) => {
//         const transcript = event.results[0][0].transcript;
//         setInput(transcript);
//         setIsListening(false);
//       };
//       recognitionRef.current.onerror = () => {
//         setIsListening(false);
//       };
//       recognitionRef.current.onend = () => {
//         setIsListening(false);
//       };
//     }
//     return () => {
//       if (recognitionRef.current) {
//         recognitionRef.current.abort();
//       }
//       if (synthRef.current) {
//         synthRef.current.cancel();
//       }
//     };
//   }, []);

//   const toggleListening = () => {
//     if (!recognitionRef.current) {
//       alert("Speech recognition is not supported in your browser. Please use Chrome or Edge.");
//       return;
//     }
//     if (isListening) {
//       recognitionRef.current.abort();
//       setIsListening(false);
//     } else {
//       setIsListening(true);
//       recognitionRef.current.start();
//     }
//   };

//   const speakText = (text) => {
//     if (!synthRef.current) return;
//     synthRef.current.cancel();
//     const utterance = new SpeechSynthesisUtterance(text);
//     utterance.rate = 1.0;
//     utterance.pitch = 1.0;
//     utterance.volume = 1.0;
//     utterance.onstart = () => setIsSpeaking(true);
//     utterance.onend = () => setIsSpeaking(false);
//     utterance.onerror = () => setIsSpeaking(false);
//     synthRef.current.speak(utterance);
//   };

//   const stopSpeaking = () => {
//     if (synthRef.current) {
//       synthRef.current.cancel();
//       setIsSpeaking(false);
//     }
//   };

//   const sendMessage = async () => {
//     if (!input.trim() || isLoading) return;
//     const userMessage = {
//       role: "user",
//       content: input.trim(),
//       timestamp: Date.now()
//     };
//     setMessages(prev => [...prev, userMessage]);
//     setInput("");
//     setIsLoading(true);
//     try {
//       // read fresh policy memory and send it along
//       const ctx = loadPolicyContext();
//       setPolicyCtx(ctx);

//       const response = await fetch("/api/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           message: userMessage.content,
//           conversation: messages.slice(-5),
//           policyContext: ctx
//             ? { name: ctx.name, text: ctx.text, reportJson: ctx.reportJson }
//             : null
//         })
//       });

//       if (!response.ok) throw new Error("Failed to get response");
//       const data = await response.json();
//       const assistantMessage = {
//         role: "assistant",
//         content: data.response,
//         timestamp: Date.now()
//       };
//       setMessages(prev => [...prev, assistantMessage]);
//       speakText(data.response);
//     } catch (error) {
//       console.error("Chat error:", error);
//       const errorMessage = {
//         role: "assistant",
//         content: "I'm sorry, I encountered an error. Please try again.",
//         timestamp: Date.now()
//       };
//       setMessages(prev => [...prev, errorMessage]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const clearChat = () => {
//     localStorage.removeItem("fineprint_chat_history");
//     setMessages([{
//       role: "assistant",
//       content: "Chat history cleared. How can I help you?",
//       timestamp: Date.now()
//     }]);
//   };

//   const forgetPolicy = () => {
//     clearPolicyContext();
//     setPolicyCtx(null);
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   };

//   return (
//     <>
//       {/* Toggle Button */}
//       <button
//         className="chat-toggle"
//         onClick={() => setIsOpen(!isOpen)}
//         aria-label="Toggle chat"
//       >
//         {isOpen ? "✕" : "💬"}
//         {!isOpen && messages.length > 1 && (
//           <span className="chat-badge">{messages.length - 1}</span>
//         )}
//       </button>

//       {/* Chat Window */}
//       {isOpen && (
//         <div className="chat-window">
//           {/* Header */}
//           <div className="chat-header">
//             <div className="chat-header-content">
//               <div className="robot-avatar">
//                 <div className="robot-body">
//                   <div className="robot-head">
//                     <div className="robot-eyes">
//                       <div className="eye left"></div>
//                       <div className="eye right"></div>
//                     </div>
//                     <div className="robot-antenna"></div>
//                   </div>
//                   <div className="robot-name">FinePrint AI</div>
//                 </div>
//               </div>
//               <div>
//                 <div className="chat-title">AI Assistant</div>
//                 <div className="chat-status">
//                   {isSpeaking
//                     ? "🔊 Speaking..."
//                     : isListening
//                     ? "🎤 Listening..."
//                     : policyCtx
//                     ? "📄 Your policy loaded"
//                     : "Online"}
//                 </div>
//               </div>
//             </div>
//             <div className="chat-actions">
//               {policyCtx && (
//                 <button
//                   onClick={forgetPolicy}
//                   className="chat-action-btn"
//                   title={"Policy memory: " + (policyCtx.name || "loaded") + " — click to forget"}
//                 >
//                   📄
//                 </button>
//               )}
//               <button onClick={clearChat} className="chat-action-btn" title="Clear chat">🗑</button>
//               <button onClick={() => setIsOpen(false)} className="chat-action-btn" title="Close">✕</button>
//             </div>
//           </div>

//           {/* Messages */}
//           <div className="chat-messages">
//             {messages.map((msg, idx) => (
//               <ChatMessage
//                 key={idx}
//                 message={msg}
//                 onSpeak={() => speakText(msg.content)}
//                 isSpeaking={isSpeaking}
//                 onStopSpeak={stopSpeaking}
//               />
//             ))}
//             {isLoading && (
//               <div className="chat-message assistant">
//                 <div className="message-content">
//                   <div className="typing-indicator">
//                     <span></span>
//                     <span></span>
//                     <span></span>
//                   </div>
//                 </div>
//               </div>
//             )}
//             <div ref={messagesEndRef} />
//           </div>

//           {/* Input */}
//           <div className="chat-input-area">
//             <textarea
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyPress={handleKeyPress}
//               placeholder="Type your question..."
//               rows="1"
//               className="chat-input"
//             />
//             <div className="chat-input-actions">
//               {/* ===== NEW: clear, always-visible voice button ===== */}
//               <button
//                 onClick={toggleListening}
//                 className={"voice-btn" + (isListening ? " listening" : "")}
//                 title={isListening ? "Stop listening" : "Speak your question"}
//                 aria-label={isListening ? "Stop listening" : "Speak your question"}
//               >
//                 <span className="voice-ico" aria-hidden="true">
//                   {isListening ? "⏹" : "🎤"}
//                 </span>
//                 <span className="voice-lbl">
//                   {isListening ? "Listening…" : "Voice"}
//                 </span>
//               </button>
//               {/* ==================================================== */}
//               <button
//                 onClick={sendMessage}
//                 disabled={!input.trim() || isLoading}
//                 className="send-btn"
//                 title="Send message"
//               >
//                 ➤
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }












// "use client";
// import { useEffect, useRef, useState } from "react";
// import ChatMessage from "./ChatMessage";

// export default function ChatBot() {
//   const [isOpen, setIsOpen] = useState(false);
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [isListening, setIsListening] = useState(false);
//   const [isSpeaking, setIsSpeaking] = useState(false);
//   const messagesEndRef = useRef(null);
//   const recognitionRef = useRef(null);
//   const synthRef = useRef(null);

//   // Initialize speech synthesis on client side only
//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       synthRef.current = window.speechSynthesis;
//     }
//   }, []);

//   // Load conversation from localStorage on mount
//   useEffect(() => {
//     const saved = localStorage.getItem("fineprint_chat_history");
//     if (saved) {
//       try {
//         setMessages(JSON.parse(saved));
//       } catch (e) {
//         console.error("Failed to load chat history", e);
//       }
//     } else {
//       // Welcome message
//       setMessages([{
//         role: "assistant",
//         content: "Hello! I'm your FinePrint AI assistant. I can help you understand insurance policies, explain clauses, and answer your questions. You can type or use voice to chat with me!",
//         timestamp: Date.now()
//       }]);
//     }
//   }, []);

//   // Save conversation to localStorage whenever it changes
//   useEffect(() => {
//     if (messages.length > 0) {
//       localStorage.setItem("fineprint_chat_history", JSON.stringify(messages));
//     }
//   }, [messages]);

//   // Auto-scroll to bottom
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // Initialize speech recognition
//   useEffect(() => {
//     if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
//       const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//       recognitionRef.current = new SpeechRecognition();
//       recognitionRef.current.continuous = false;
//       recognitionRef.current.interimResults = false;
//       recognitionRef.current.lang = "en-US";

//       recognitionRef.current.onresult = (event) => {
//         const transcript = event.results[0][0].transcript;
//         setInput(transcript);
//         setIsListening(false);
//       };

//       recognitionRef.current.onerror = () => {
//         setIsListening(false);
//       };

//       recognitionRef.current.onend = () => {
//         setIsListening(false);
//       };
//     }

//     return () => {
//       if (recognitionRef.current) {
//         recognitionRef.current.abort();
//       }
//       if (synthRef.current) {
//         synthRef.current.cancel();
//       }
//     };
//   }, []);

//   const toggleListening = () => {
//     if (!recognitionRef.current) {
//       alert("Speech recognition is not supported in your browser. Please use Chrome or Edge.");
//       return;
//     }

//     if (isListening) {
//       recognitionRef.current.abort();
//       setIsListening(false);
//     } else {
//       setIsListening(true);
//       recognitionRef.current.start();
//     }
//   };

//   const speakText = (text) => {
//     if (!synthRef.current) return;
    
//     // Cancel any ongoing speech
//     synthRef.current.cancel();
    
//     const utterance = new SpeechSynthesisUtterance(text);
//     utterance.rate = 1.0;
//     utterance.pitch = 1.0;
//     utterance.volume = 1.0;
    
//     utterance.onstart = () => setIsSpeaking(true);
//     utterance.onend = () => setIsSpeaking(false);
//     utterance.onerror = () => setIsSpeaking(false);
    
//     synthRef.current.speak(utterance);
//   };

//   const stopSpeaking = () => {
//     if (synthRef.current) {
//       synthRef.current.cancel();
//       setIsSpeaking(false);
//     }
//   };

//   const sendMessage = async () => {
//     if (!input.trim() || isLoading) return;

//     const userMessage = {
//       role: "user",
//       content: input.trim(),
//       timestamp: Date.now()
//     };

//     setMessages(prev => [...prev, userMessage]);
//     setInput("");
//     setIsLoading(true);

//     try {
//       // Call the backend API
//       const response = await fetch("/api/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           message: userMessage.content,
//           conversation: messages.slice(-5) // Send last 5 messages for context
//         })
//       });

//       if (!response.ok) throw new Error("Failed to get response");

//       const data = await response.json();
      
//       const assistantMessage = {
//         role: "assistant",
//         content: data.response,
//         timestamp: Date.now()
//       };

//       setMessages(prev => [...prev, assistantMessage]);
      
//       // Auto-speak the response
//       speakText(data.response);
//     } catch (error) {
//       console.error("Chat error:", error);
//       const errorMessage = {
//         role: "assistant",
//         content: "I'm sorry, I encountered an error. Please try again.",
//         timestamp: Date.now()
//       };
//       setMessages(prev => [...prev, errorMessage]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const clearChat = () => {
//     localStorage.removeItem("fineprint_chat_history");
//     setMessages([{
//       role: "assistant",
//       content: "Chat history cleared. How can I help you?",
//       timestamp: Date.now()
//     }]);
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   };

//   return (
//     <>
//       {/* Toggle Button */}
//       <button
//         className="chat-toggle"
//         onClick={() => setIsOpen(!isOpen)}
//         aria-label="Toggle chat"
//       >
//         {isOpen ? "✕" : "💬"}
//         {!isOpen && messages.length > 1 && (
//           <span className="chat-badge">{messages.length - 1}</span>
//         )}
//       </button>

//       {/* Chat Window */}
//       {isOpen && (
//         <div className="chat-window">
//           {/* Header */}
//           <div className="chat-header">
//             <div className="chat-header-content">
//               <div className="robot-avatar">
//                 <div className="robot-body">
//                   <div className="robot-head">
//                     <div className="robot-eyes">
//                       <div className="eye left"></div>
//                       <div className="eye right"></div>
//                     </div>
//                     <div className="robot-antenna"></div>
//                   </div>
//                   <div className="robot-name">FinePrint AI</div>
//                 </div>
//               </div>
//               <div>
//                 <div className="chat-title">AI Assistant</div>
//                 <div className="chat-status">
//                   {isSpeaking ? "🔊 Speaking..." : isListening ? "🎤 Listening..." : "Online"}
//                 </div>
//               </div>
//             </div>
//             <div className="chat-actions">
//               <button onClick={clearChat} className="chat-action-btn" title="Clear chat">🗑</button>
//               <button onClick={() => setIsOpen(false)} className="chat-action-btn" title="Close">✕</button>
//             </div>
//           </div>

//           {/* Messages */}
//           <div className="chat-messages">
//             {messages.map((msg, idx) => (
//               <ChatMessage
//                 key={idx}
//                 message={msg}
//                 onSpeak={() => speakText(msg.content)}
//                 isSpeaking={isSpeaking}
//                 onStopSpeak={stopSpeaking}
//               />
//             ))}
//             {isLoading && (
//               <div className="chat-message assistant">
//                 <div className="message-content">
//                   <div className="typing-indicator">
//                     <span></span>
//                     <span></span>
//                     <span></span>
//                   </div>
//                 </div>
//               </div>
//             )}
//             <div ref={messagesEndRef} />
//           </div>

//           {/* Input */}
//           <div className="chat-input-area">
//             <textarea
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyPress={handleKeyPress}
//               placeholder="Type your question..."
//               rows="1"
//               className="chat-input"
//             />
//             <div className="chat-input-actions">
//               <button
//                 onClick={toggleListening}
//                 className={`voice-btn ${isListening ? "listening" : ""}`}
//                 title="Voice input"
//               >
//                 {isListening ? "🔴" : ""}
//               </button>
//               <button
//                 onClick={sendMessage}
//                 disabled={!input.trim() || isLoading}
//                 className="send-btn"
//               >
//                 ➤
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }