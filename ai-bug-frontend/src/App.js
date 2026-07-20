import React, { useState, useEffect, useRef } from 'react';
import AuthScreen from './components/auth/AuthScreen.jsx';
import OtpScreen from './components/auth/OtpScreen.jsx';
import "./App.css"; // Fixed the '@/' alias issue here too!
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
// ============================================================================
// THE VISUAL PARSER ENGINE
// Maps markdown responses into Catppuccin Macchiato styled UI card viewports
// ============================================================================
export function ResponseRenderer({ content }) {
  if (!content) return null;

  // Protects against accidental raw JSON text strings
  let cleanContent = content;
  try {
    if (typeof cleanContent === 'string' && cleanContent.trim().startsWith('{')) {
      const parsed = JSON.parse(cleanContent);
      // 🟢 NEW: Extract from 'result' first, since that's what your backend sends
      if (parsed.result) {
        cleanContent = parsed.result;
      } else if (parsed.analysis) {
        cleanContent = parsed.analysis;
      }
    }
  } catch (e) {}

  // 🟢 CRITICAL NEW FIX: Convert literal escaped \n strings into REAL line breaks!
  if (typeof cleanContent === 'string') {
    cleanContent = cleanContent.replace(/\\n/g, '\n').replace(/\\"/g, '"');
  }

  return (
    <div className="text-slate-300 font-sans tracking-wide leading-relaxed selection:bg-emerald-500/20">
      <Markdown
        components={{
          // Custom style for headers (replaces ###)
          h3: ({ node, ...props }) => (
    <h3 className="flex items-center gap-2 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-400 mt-6 mb-2 border-l-2 border-emerald-500 pl-2 bg-emerald-950/20 py-1.5 rounded-r select-none">
      <span className="text-xs text-emerald-500/60">►</span>
      {props.children}
    </h3>
  ),
  h2: ({ node, ...props }) => (
    <h3 className="flex items-center gap-2 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-400 mt-6 mb-2 border-l-2 border-emerald-500 pl-2 bg-emerald-950/20 py-1.5 rounded-r select-none">
      <span className="text-xs text-emerald-500/60">►</span>
      {props.children}
    </h3>
  ),
  strong: ({ node, ...props }) => (
    <strong className="font-bold text-emerald-300 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-500/10">
      {props.children}
    </strong>
  ),

  // ✨ UPGRADED PRE-BLOCK DETECTOR
  pre: ({ node, ...props }) => {
    const children = props.children;
    // Extract the content from the internal code element cleanly
    let codeBlock = children?.props?.children || "";
    const languageMatch = children?.props?.className || "";
    const activeLanguage = languageMatch.replace('language-', '') || 'Java';

    // Clean out stray raw markdown artifacts if they get injected into the string
    if (typeof codeBlock === 'string') {
      codeBlock = codeBlock.replace(/^`{3}/, '').replace(/`{3}$/, '');
    }

    return (
      <div className="my-4 bg-[#11111b] border border-[#313244]/80 rounded-2xl overflow-hidden font-mono text-xs shadow-xl w-full">
        <div className="bg-[#181825]/60 px-4 py-3 border-b border-[#313244]/60 flex justify-between items-center text-[#a6adc8]">
          <span className="text-xs font-mono text-[#cdd6f4] flex items-center gap-2 select-none">
            <i className="fa-solid fa-code text-[#89b4fa] text-[11px]"></i> {activeLanguage.toUpperCase()}
          </span>
          <button
            onClick={() => navigator.clipboard.writeText(String(codeBlock).trim())}
            className="hover:text-[#cdd6f4] active:text-emerald-400 transition-colors text-xs p-1 cursor-pointer"
            title="Copy Code Block"
          >
            <i className="fa-regular fa-copy text-sm"></i>
          </button>
        </div>
        <pre className="p-5 overflow-x-auto whitespace-pre text-[#cdd6f4] bg-[#11111b]/30 leading-relaxed font-mono">
          <code className="block w-full text-left font-mono">{codeBlock}</code>
        </pre>
      </div>
    );
  },

  // ✨ STABILIZED INLINE CODE RENDERING
  code: ({ node, inline, ...props }) => {
    // If it's a code block wrapped inside an extra block layer, let <pre> handle it
    if (!inline && props.className) {
      return <code {...props} />;
    }
    return (
      <code className="mx-1 rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 font-mono text-xs text-rose-400 inline-block align-middle">
        {props.children}
      </code>
    );
  },

  li: ({ node, ...props }) => (
    <li className="list-decimal pl-1 ml-4 my-2 text-slate-300">
      {props.children}
    </li>
  )
}}
      >
        {cleanContent}
      </Markdown>
    </div>
  );
}
// ============================================================================
// MAIN APPLICATION ROOT COMPONENT
// ============================================================================
export default function App() {
  // ── Authentication & Step Routing (Persistent State Initialization) ──
  const [authStep, setAuthStep] = useState(() => {
    const savedStep = localStorage.getItem('bugtracker_auth_step');
    return savedStep ? Number(savedStep) : 1; // Default to step 1
  });

  const [loggedInEmail, setLoggedInEmail] = useState(() => {
    return localStorage.getItem('bugtracker_email') || '';
  });

  const [isGuest, setIsGuest] = useState(() => {
    const savedGuest = localStorage.getItem('bugtracker_is_guest');
    return savedGuest ? savedGuest === 'true' : false; // Default to false until setup
  });

  // ── OAuth2 Callback Handler ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');

    if (token && email) {
      localStorage.setItem('bugtracker_token', token);
      localStorage.setItem('bugtracker_email', email);
      localStorage.setItem('bugtracker_auth_step', '3');
      localStorage.setItem('bugtracker_is_guest', 'false');
      
      setLoggedInEmail(email);
      setIsGuest(false);
      setAuthStep(3);

      // Clean the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // ── Code Analyzer Workbench States ──
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('Java'); // 🟢 FIXED: Add missing language state

const [attachedFileName, setAttachedFileName] = useState('');

  // ── Session Sidebar Storage Trackers ──
  const [sessions, setSessions] = useState([
    { id: 1001, title: 'Welcome Sandbox', history: [], isPinned: false }
  ]);
  const [activeSessionId, setActiveSessionId] = useState(1001);

  // ── Search & Filter Panel Configurations ──
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editTitleText, setEditTitleText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const chatEndRef = useRef(null);
  const lineCount = code.split('\n').length;

  const currentSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const chatHistory = currentSession.history;

  // Auto-scroll layout when history maps update
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  // ── Authentication Handlers (Saves configurations to localStorage) ──
  const handleLoginSuccess = (email) => {
    setLoggedInEmail(email);
    setAuthStep(2); 
    // Save email progress to check against during OTP verification steps
    localStorage.setItem('bugtracker_email', email);
  };

  const handleOtpSuccess = (email) => {
    setLoggedInEmail(email);
    setIsGuest(false);
    setAuthStep(3); 

    // Lock session markers into persistent browser cache storage
    localStorage.setItem('bugtracker_auth_step', '3');
    localStorage.setItem('bugtracker_is_guest', 'false');
    localStorage.setItem('bugtracker_email', email);
  };
  const handleGuestAccess = () => {
    setLoggedInEmail('guest');
    setIsGuest(true);
    setAuthStep(3);

    // ── ✨ NEW: Remember that the user is browsing in Guest Mode ──
    localStorage.setItem('bugtracker_auth_step', '3');
    localStorage.setItem('bugtracker_is_guest', 'true');
    localStorage.setItem('bugtracker_email', 'guest');
  };

  const handleLogout = () => {
    setIsGuest(false);
    setLoggedInEmail('');
    setSessions([{ id: 1001, title: 'Welcome Sandbox', history: [], isPinned: false }]);
    setActiveSessionId(1001);
    setCode('');
    setAuthStep(1); 

    // ── ✨ NEW: Wipe everything clean from browser cache memory ──
    localStorage.removeItem('bugtracker_auth_step');
    localStorage.removeItem('bugtracker_is_guest');
    localStorage.removeItem('bugtracker_email');
    localStorage.removeItem('bugtracker_token');
  };
  // ── Main App (authStep === 3) Actions ──
  const handleAnalyze = async () => {
    if (!code.trim()) return;

    const codeToSend = code.trim();
    const selectedLang = language;
    const requestId = Date.now();

    let updatedTitle = currentSession.title;
    if (updatedTitle === 'Welcome Sandbox' || updatedTitle === 'New Analysis Thread') {
      updatedTitle = codeToSend.length > 24 ? codeToSend.substring(0, 24) + '...' : codeToSend;
    }

    setCode('');

    // 1. Instantly inject the loading skeleton into the UI
    setSessions(prevSessions => prevSessions.map(session => {
      if (session.id === activeSessionId) {
        return {
          ...session,
          title: updatedTitle,
          history: [
            ...(session.history || []),
            { id: requestId, code: codeToSend, language: selectedLang, result: '', error: '', isLoading: true }
          ]
        };
      }
      return session;
    }));

    try {
      // 2. Dispatch payload to Spring Boot Compiler
      // Note: Make sure this URL matches your actual Java Controller endpoint!
      const token = localStorage.getItem('bugtracker_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('http://65.0.124.92:8080/api/ai/analyze', {
        method: 'POST',
        headers: headers,
        credentials: 'include', // CRITICAL FIX: Tells Spring Security you are signed in!
        body: JSON.stringify({ code: codeToSend })
      });

      if (!response.ok) throw new Error(`Backend Pipeline Rejected (Status: ${response.status})`);

      // 3. CRITICAL FIX: Read as raw text first!
      // If Java returns plain text, .json() will crash the app. Reading as text is always safe.
      const rawText = await response.text(); 
      let finalResult = rawText;

      // Optional: If you hook this back up to AI later, try to extract the JSON analysis field
      try {
        const parsed = JSON.parse(rawText);
        if (parsed.analysis) {
          finalResult = parsed.analysis;
        }
      } catch (e) {
        // Not JSON? No problem! It's just a raw text string from your Java compiler!
      }

      // 4. Update the UI with the final result and STOP loading
      setSessions(prevSessions => prevSessions.map(session => {
        if (session.id === activeSessionId) {
          return {
            ...session,
            history: (session.history || []).map(item =>
              item.id === requestId ? { ...item, result: finalResult, isLoading: false, error: '' } : item
            )
          };
        }
        return session;
      }));

    } catch (err) {
      // 5. If ANYTHING goes wrong, catch it and STOP the loading skeleton!
      setSessions(prevSessions => prevSessions.map(session => {
        if (session.id === activeSessionId) {
          return {
            ...session,
            history: (session.history || []).map(item =>
              item.id === requestId ? { ...item, error: err.message, isLoading: false } : item
            )
          };
        }
        return session;
      }));
    }
  };
  
  const handleImageUpload = async (event) => {
    if (isGuest) return;
    
    const file = event.target.files[0];
    if (file) {
      console.log("File captured on frontend:", file.name);
      setAttachedFileName(file.name); // Safe initial assignment

      const selectedLang = language;
      const requestId = Date.now();
// 1. Instantly inject a "Loading..." message block card into the chat window
      setSessions(prevSessions => prevSessions.map(session => {
        if (session.id === activeSessionId) {
          return {
            ...session,
            history: [
              ...(session.history || []),
              { 
                id: requestId, 
                code: `[📎 Attached Screen: ${file.name}]`, 
                language: selectedLang, 
                result: '', 
                error: '', 
                isLoading: true 
              }
            ]
          };
        }
        return session;
      }));

      // 2. Build the Multipart payload for Spring Boot
      const formData = new FormData();
      formData.append('file', file); 
      formData.append('language', selectedLang);

      try {
        // 3. Dispatch stream payload to our Java Controller layer
        const token = localStorage.getItem('bugtracker_token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('http://65.0.124.92:8080/api/ai/analyze-image', {
          method: 'POST',
          headers: headers,
          credentials: 'include', // 👈 CRITICAL: Keeps your image uploads authenticated!
          body: formData 
        });

        if (!response.ok) throw new Error("Spring Boot pipeline rejected the image upload.");

        // 4. Safely read as text first to prevent JSON crashes
        const rawText = await response.text();
        let finalResult = rawText;

        // Extract the result safely
        try {
          const parsed = JSON.parse(rawText);
          if (parsed.result) {
            finalResult = parsed.result;
          } else if (parsed.analysis) {
            finalResult = parsed.analysis;
          }
        } catch (e) {
          // Not JSON? No problem! It's just a raw text string.
        }
        
        // 5. Success! Swap out the loading spinner with the actual text response
        setSessions(prevSessions => prevSessions.map(session => {
          if (session.id === activeSessionId) {
            return {
              ...session,
              history: (session.history || []).map(item =>
                item.id === requestId ? { ...item, result: finalResult, isLoading: false, error: '' } : item
              )
            };
          }
          return session;
        }));

        // Give the user a moment to see the success checkmark
        setTimeout(() => {
          setAttachedFileName('');
        }, 1200);

      } catch (err) {
        console.error("Image telemetry upload failed:", err.message);
        
        // 6. Error fallback: Update the specific message block card to show the red error
        setSessions(prevSessions => prevSessions.map(session => {
          if (session.id === activeSessionId) {
            return {
              ...session,
              history: (session.history || []).map(item =>
                item.id === requestId ? { ...item, error: `Pipeline Error: ${err.message}`, isLoading: false } : item
              )
            };
          }
          return session;
        }));

        // Clear the state instantly if an error strikes
        setAttachedFileName('');
      }
    }
  };

  const handleNewChat = () => {
    const newSessionId = Date.now();
    setSessions(prev => [{ id: newSessionId, title: 'New Analysis', history: [], isPinned: false }, ...prev]);
    setActiveSessionId(newSessionId);
    setCode('');
  };

  const togglePinSession = (id, e) => {
    e.stopPropagation();
    setSessions(prev => prev.map(s => s.id === id ? { ...s, isPinned: !s.isPinned } : s));
  };

  const startRename = (session, e) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitleText(session.title);
  };

  const saveRename = (id, e) => {
    if (e) e.stopPropagation();
    if (!editTitleText.trim()) return;
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: editTitleText.trim() } : s));
    setEditingSessionId(null);
  };

  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const pinnedSessions = filteredSessions.filter(s => s.isPinned);
  const recentSessions = filteredSessions.filter(s => !s.isPinned);

  const displayName = isGuest ? 'GUEST' : loggedInEmail.split('@')[0].toUpperCase();

  const renderSessionItem = (session) => {
    const isActive = session.id === activeSessionId;
    const isEditing = editingSessionId === session.id;

    return (
      <div
        key={session.id}
        title={session.title}
        onClick={() => { if (!isEditing) { setActiveSessionId(session.id); setCode(''); } }}
        className={`group relative w-full text-xs font-mono rounded-xl transition-all flex items-center cursor-pointer ${
          isSidebarOpen ? 'px-3 py-2.5 justify-between' : 'p-3 justify-center'
        } ${isActive ? 'bg-[#313244] text-[#89b4fa] font-bold border border-[#45475a]/50 shadow-inner' : 'text-[#a6adc8] hover:bg-[#181825] hover:text-[#cdd6f4]'}`}
      >
        <div className="flex items-center gap-2.5 truncate flex-1 justify-center sm:justify-start">
          <i className={`fa-solid ${session.isPinned ? 'fa-thumbtack text-[#f9e2af]' : (session.history.length > 0 ? 'fa-message text-[#b4befe]' : 'fa-square-plus text-[#585b70]')} text-[11px]`}></i>
          {isSidebarOpen && (
            <div className="truncate flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editTitleText}
                  onChange={(e) => setEditTitleText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveRename(session.id); }}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  className="bg-[#181825] text-[#cdd6f4] px-1.5 py-0.5 rounded border border-[#89b4fa] outline-none w-full text-xs font-mono"
                />
              ) : (
                <span className="truncate">{session.title}</span>
              )}
            </div>
          )}
        </div>

        {isSidebarOpen && !isEditing && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity ml-1 bg-inherit pl-1">
            <button onClick={(e) => startRename(session, e)} className="text-[#6c7086] hover:text-[#cdd6f4]" title="Rename">
              <i className="fa-solid fa-pencil text-[10px]"></i>
            </button>
            <button onClick={(e) => togglePinSession(session.id, e)} className={`${session.isPinned ? 'text-[#f9e2af]' : 'text-[#6c7086] hover:text-[#cdd6f4]'}`} title={session.isPinned ? "Unpin" : "Pin"}>
              <i className="fa-solid fa-thumbtack text-[10px]"></i>
            </button>
          </div>
        )}

        {isSidebarOpen && isEditing && (
          <div className="flex items-center gap-1.5 ml-1">
            <button onClick={(e) => { e.stopPropagation(); saveRename(session.id); }} className="text-[#a6e3a1]"><i className="fa-solid fa-check text-[10px]"></i></button>
            <button onClick={(e) => { e.stopPropagation(); setEditingSessionId(null); }} className="text-[#f38ba8]"><i className="fa-solid fa-xmark text-[10px]"></i></button>
          </div>
        )}
      </div>
    );
  };

  // ── Authentication Router Screens ──
  if (authStep === 1) {
    return (
      <>
        <AuthScreen onLoginSuccess={handleLoginSuccess} onGuestAccess={handleGuestAccess} />
        <button
          onClick={() => {
            setLoggedInEmail("preview@bugsens.dev");
            setAuthStep(2);
          }}
          data-testid="preview-otp-btn"
          className="fixed bottom-4 right-4 z-50 px-3 py-2 rounded-full bg-[#111114] border border-white/[0.08] text-[10px] font-mono text-[#a1a1aa] hover:text-white hover:border-[#a3e635]/40 transition-all"
          title="Preview OTP screen without backend"
        >
          preview otp →
        </button>
      </>
    );
  }

  if (authStep === 2) {
    return (
      <OtpScreen
        email={loggedInEmail || "you@bugsens.dev"}
        onOtpSuccess={handleOtpSuccess}
        onBack={() => setAuthStep(1)}
      />
    );
  }

  // ── Interactive Diagnostic App Workspace (authStep === 3) ──
  return (
    <div className="bg-[#0e0e16] text-[#cdd6f4] h-screen w-screen flex font-sans overflow-hidden m-0 p-0">

      {/* Sidebar */}
      <aside className={`bg-[#11111b] border-r border-[#181825] hidden md:flex flex-col h-full z-30 select-none transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}>

        <div className={`p-4 border-b border-[#181825]/40 flex flex-col gap-3 ${!isSidebarOpen && 'items-center'}`}>
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-bug-slash text-[#f38ba8] text-sm"></i>
            {isSidebarOpen && <span className="font-mono text-xs font-bold tracking-wider text-[#6c7086]">BUGSENS</span>}
          </div>
          <button
            onClick={handleNewChat}
            className={`font-mono text-xs border border-[#313244] bg-[#181825] hover:bg-[#1e1e2e] text-[#cdd6f4] rounded-xl transition-all flex items-center shadow-sm cursor-pointer ${isSidebarOpen ? 'w-full px-3 py-2.5 justify-between' : 'p-2.5 w-10 h-10 justify-center'}`}
            title="New Chat"
          >
            {isSidebarOpen ? (
              <>
                <span className="flex items-center gap-2"><i className="fa-solid fa-plus text-[#a6e3a1] text-[10px]"></i> New Chat</span>
                <span className="text-[10px] bg-[#313244] text-[#6c7086] px-1 rounded">⌘N</span>
              </>
            ) : (
              <i className="fa-solid fa-plus text-[#a6e3a1] text-xs"></i>
            )}
          </button>
        </div>

        <div className={`px-2 mt-3 ${!isSidebarOpen && 'flex justify-center'}`}>
          {isSidebarOpen ? (
            <div className="relative w-full px-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history..."
                className="w-full bg-[#181825] text-xs font-mono text-[#cdd6f4] pl-8 pr-7 py-2 rounded-xl border border-[#313244] outline-none focus:border-[#89b4fa]/60 placeholder:text-[#45475a]"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] text-[#585b70]"></i>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#585b70] hover:text-[#cdd6f4]">
                  <i className="fa-solid fa-xmark text-[10px]"></i>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center text-[#a6adc8] hover:text-[#cdd6f4] bg-[#181825] border border-[#313244] rounded-xl cursor-pointer"
            >
              <i className="fa-solid fa-magnifying-glass text-xs"></i>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 custom-scrollbar">
          {pinnedSessions.length > 0 && (
            <div className="space-y-1">
              {isSidebarOpen && (
                <span className="px-3 text-[9px] text-[#f9e2af] font-mono font-bold uppercase tracking-wider flex items-center gap-1 select-none mb-1">
                  <i className="fa-solid fa-thumbtack text-[9px]"></i> Pinned
                </span>
              )}
              {pinnedSessions.map(renderSessionItem)}
            </div>
          )}
          <div className="space-y-1">
            {isSidebarOpen && (
              <span className="px-3 text-[9px] text-[#585b70] font-mono font-bold uppercase tracking-wider block select-none mb-1">
                Recent Analyzes
              </span>
            )}
            {recentSessions.map(renderSessionItem)}
            {filteredSessions.length === 0 && (
              <span className="text-[10px] font-mono text-[#585b70] text-center block pt-4">No results found</span>
            )}
          </div>
        </div>

        <div className={`p-4 border-t border-[#181825]/40 bg-[#0e0e16]/40 flex flex-col gap-2 ${!isSidebarOpen && 'items-center'}`}>
          {isSidebarOpen ? (
            <span className={`text-[11px] font-mono px-3 py-2 rounded-xl text-center border truncate ${isGuest ? 'text-[#fab387] bg-[#fab387]/10 border-[#fab387]/20' : 'text-[#a6adc8] bg-[#11111b] border-[#313244]'}`}>
              {isGuest ? '⚠️ GUEST MODE' : '🧑‍💻 ' + displayName}
            </span>
          ) : (
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-mono font-bold ${isGuest ? 'text-[#fab387] border-[#fab387]/30 bg-[#fab387]/10' : 'text-[#89b4fa] border-[#313244] bg-[#181825]'}`}>
              {isGuest ? '?' : displayName.charAt(0)}
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`text-xs font-mono text-[#f38ba8] border border-[#f38ba8]/20 bg-transparent hover:bg-[#f38ba8]/10 py-2 rounded-xl text-center cursor-pointer flex items-center justify-center ${isSidebarOpen ? 'w-full gap-1.5' : 'w-10 h-10'}`}
            title="Sign Out"
          >
            <i className="fa-solid fa-power-off"></i>
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        <header className="bg-[#0e0e16] px-6 py-4 flex items-center justify-between z-20 border-b border-[#181825]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:flex items-center justify-center text-[#a6adc8] hover:text-[#cdd6f4] bg-[#11111b] border border-[#313244] w-9 h-9 rounded-xl cursor-pointer transition-all hover:bg-[#181825]"
            >
              <i className={`fa-solid ${isSidebarOpen ? 'fa-bars-staggered' : 'fa-bars'} text-xs`}></i>
            </button>
            <div className="flex items-center gap-2.5">
              <span className="md:hidden inline-block"><i className="fa-solid fa-bug-slash text-[#f38ba8] text-base mr-1"></i></span>
              <span className="font-mono text-xs text-[#6c7086]">{"v2.4.0 // Interactive Workspace Live"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <button onClick={handleNewChat} className="text-xs border border-[#313244] bg-[#11111b] px-2.5 py-1.5 rounded-xl text-[#a6e3a1]"><i className="fa-solid fa-plus"></i></button>
            <button onClick={handleLogout} className="text-xs border border-[#f38ba8]/20 text-[#f38ba8] px-2.5 py-1.5 rounded-xl"><i className="fa-solid fa-power-off"></i></button>
          </div>
        </header>

<main className="flex-1 flex flex-col items-center justify-start pt-4 p-6 overflow-y-auto max-w-7xl w-full mx-auto custom-scrollbar">

          {chatHistory.length === 0 && (
            <div className="text-center mb-8 mt-16 animate-fadeIn">
              <h2 className="text-4xl font-bold tracking-tight text-[#f5e0dc] mb-2 font-sans">Bugsens AI Bugtracker</h2>
              <p className="text-sm text-[#6c7086] font-mono">
                {currentSession.title === 'New Analysis Thread'
                  ? "Brand new history node active. Submit code to index timeline query."
                  : "Deploy continuous analytical telemetry on target code blocks."}
              </p>
            </div>
          )}

          <div className="w-full space-y-8 mb-4">
            {chatHistory.map((item) => (
              <div key={item.id} className="w-full space-y-4 border-l-2 border-[#313244] pl-4 sm:pl-6 transition-all duration-300">
                <div className="bg-[#11111b] border border-[#313244] rounded-2xl p-4 font-mono text-xs opacity-60 whitespace-pre overflow-x-auto relative">
                  <span className="text-[#89b4fa] font-bold select-none">{"  [" + item.language + "]:"}</span>
                  <p className="mt-2 text-[#cdd6f4]">{item.code}</p>
                </div>
                {item.isLoading && (
                  <div className="bg-[#11111b] border border-[#313244] rounded-2xl p-6 space-y-3 animate-pulse">
                    <div className="h-4 bg-[#313244] rounded w-1/4"></div>
                    <div className="h-3 bg-[#313244]/60 rounded w-full"></div>
                    <div className="h-3 bg-[#313244]/60 rounded w-5/6"></div>
                  </div>
                )}
                {item.error && (
                  <div className="bg-[#11111b] border border-[#f38ba8]/40 text-[#f38ba8] p-5 rounded-2xl font-mono text-xs">
                    <strong>[!] Pipeline Interrupted:</strong> {item.error}
                  </div>
                )}
                {item.result && (
                  <div className="bg-[#1e1e2e]/20 border border-[#313244] rounded-2xl p-6 shadow-xl relative w-full">
                    <div className="flex items-center justify-between border-b border-[#313244] pb-3 mb-4 select-none">
                      <span className="text-xs font-mono text-[#a6e3a1]">
                        <i className="fa-solid fa-square-terminal mr-2"></i>Engine Analysis Telemetry
                      </span>
                    </div>
                    <ResponseRenderer content={item.result} />
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div className="w-full bg-[#11111b] border border-[#313244] rounded-3xl p-4 shadow-2xl focus-within:border-[#89b4fa]/60 flex flex-col gap-3 relative z-10 mt-auto">
            <div className="flex items-start gap-3 w-full min-h-[90px]">
              <div className="w-8 font-mono text-xs text-[#585b70] text-right pr-2 pt-1 select-none leading-relaxed hidden sm:block">
                {Array.from({ length: Math.max(lineCount, 1) }).map((_, i) => <div key={i}>{i + 1}</div>)}
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste a code block or state your compiler issue here..."
                className="flex-1 bg-transparent text-[#cdd6f4] text-sm focus:outline-none font-mono resize-none h-full min-h-[90px] leading-relaxed placeholder:text-[#45475a]"
                style={{ fontFamily: '"Fira Code", monospace' }}
              />
            </div>
            <div className="border-t border-[#313244]/40 pt-3 flex items-center justify-between">
              
              {/* Left Action Controls Container Row Group */}
              <div className="flex items-center gap-3">
               
<motion.label 
                  layout
                  whileHover={!isGuest ? { 
                    scale: 1.03, 
                    boxShadow: attachedFileName 
                      ? "0px 0px 15px rgba(166, 227, 161, 0.3)" 
                      : "0px 0px 15px rgba(137, 180, 250, 0.2)" 
                  } : {}}
                  whileTap={!isGuest ? { scale: 0.96 } : {}}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className={`px-3.5 py-2 rounded-xl border font-mono text-xs flex items-center gap-2 select-none relative group overflow-hidden transition-colors duration-300
                    ${isGuest 
                      ? 'opacity-30 bg-[#11111b]/50 border-[#313244] text-[#585b70] cursor-not-allowed' 
                      : attachedFileName
                        ? 'bg-[#a6e3a1]/10 border-[#a6e3a1] text-[#a6e3a1]'
                        : 'bg-[#181825] border-[#313244] text-[#a6adc8] hover:text-[#89b4fa] hover:border-[#89b4fa]/50'
                    }`}
                  title={isGuest ? "Feature Locked: Account authentication required" : "Inject screenshot analytics data"}
                  onClick={(e) => {
                    if (isGuest) {
                      e.preventDefault();
                      alert("🔒 Feature Locked: Please sign in with an account to attach files.");
                    }
                  }}
                >
                  {!isGuest && !attachedFileName && (
                    <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  )}

                  <AnimatePresence mode="wait">
                    {attachedFileName ? (
                      <motion.i
                        key="check"
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 45 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        className="fa-solid fa-circle-check text-xs text-[#a6e3a1]"
                      />
                    ) : (
                      <motion.i
                        key="paperclip"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className={`fa-solid fa-paperclip text-xs ${isGuest ? 'text-[#585b70]' : 'text-[#89b4fa]'}`}
                      />
                    )}
                  </AnimatePresence>

                  <motion.span className="truncate max-w-[120px]">
                    {attachedFileName ? attachedFileName : 'Attach Image'}
                  </motion.span>

                  {attachedFileName && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      whileHover={{ scale: 1.2 }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAttachedFileName('');
                      }}
                      className="ml-1 text-[#f38ba8] hover:text-[#f38ba8]/80 cursor-pointer text-[10px] flex items-center justify-center"
                      title="Clear attached data"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </motion.button>
                  )}

                  {!isGuest && (
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload} 
                    />
                  )}
                </motion.label>
                {/* ── END OF NEW MOTION.LABEL COMPONENT ── */}

              </div>
              {/* Submit Button Action */}
              <button
                onClick={handleAnalyze}
                disabled={!code.trim()}
                className="w-10 h-10 rounded-full bg-[#cdd6f4] hover:bg-[#89b4fa] disabled:bg-[#313244] text-[#11111b] disabled:text-[#585b70] flex items-center justify-center shadow-lg cursor-pointer disabled:cursor-not-allowed transform active:scale-95 transition-all"
              >
                <i className="fa-solid fa-arrow-up text-sm"></i>
              </button>

            </div> {/* ── Closes the border-t tool row ── */}
          </div> {/* ── Closes the Input Bar parent main container panel ── */}

          {chatHistory.length === 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-xl">
              <button
                onClick={() => setCode("public class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello World\")\n  }\n}")}
                className="bg-[#11111b] border border-[#313244] text-xs text-[#a6adc8] font-mono px-3 py-2 rounded-xl hover:border-[#89b4fa] transition-all cursor-pointer"
              >
                ☕ Insert Sample Broken Java Code
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}