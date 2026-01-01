
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TOOLS } from './constants';
import { ToolType, ChatMessage } from './types';
import { geminiService } from './services/geminiService';
import ReactMarkdown from 'react-markdown';

// --- Sub-components for better organization ---

// Fix: Use React.PropsWithChildren to correctly type the children prop and avoid TS "missing" errors in JSX
const Modal = ({ isOpen, onClose, title, children }: React.PropsWithChildren<{ isOpen: boolean, onClose: () => void, title: string }>) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>('listing_writer');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auth & Upgrade States
  const [user, setUser] = useState<{ name: string; email: string; isPro: boolean } | null>(null);
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: 'signin' | 'signup' }>({ open: false, mode: 'signin' });
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Form States
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const [paymentForm, setPaymentForm] = useState({ card: '', expiry: '', cvv: '', phone: '' });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const toolInfo = TOOLS.find(t => t.id === activeTool);
      const contextualPrompt = `Context: The user is using the "${toolInfo?.name}" tool. ${user?.isPro ? 'This is a PRO user.' : ''}
      Input: ${input}`;
      
      const response = await geminiService.generateResponse(contextualPrompt);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || 'I apologize, I could not generate a response.',
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Error: Failed to connect to AlibabaAI. Please check your API key.'
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, activeTool, user]);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ 
      name: authForm.name || 'Global Trader', 
      email: authForm.email, 
      isPro: false 
    });
    setAuthModal({ open: false, mode: 'signin' });
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      setUser({ ...user, isPro: true });
    } else {
      setUser({ name: 'Pro Member', email: 'pro@alibaba.com', isPro: true });
    }
    setUpgradeModalOpen(false);
    alert("Welcome to AlibabaAI Pro 2026! Your account has been upgraded.");
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-72 bg-gray-900 text-white flex flex-col border-r border-gray-800">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-orange-500/20">
              A
            </div>
            <h1 className="text-xl font-bold tracking-tight">AlibabaAI</h1>
          </div>
          
          <nav className="space-y-1 mb-8">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-2">B2B Trade Tools</p>
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => {
                  setActiveTool(tool.id as ToolType);
                  setMessages([]);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                  activeTool === tool.id 
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="text-lg">{tool.icon}</span>
                <span>{tool.name}</span>
              </button>
            ))}
          </nav>

          {/* Upgrade Banner in Sidebar */}
          {!user?.isPro && (
            <div className="bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl p-4 shadow-xl">
              <h4 className="font-bold text-sm mb-1 text-white flex items-center gap-2">
                <span className="animate-pulse">🚀</span> AlibabaAI Pro 2026
              </h4>
              <p className="text-[11px] text-orange-50 mb-3 leading-relaxed">Unlock advanced market analytics and high-volume RFQ automation.</p>
              <button 
                onClick={() => setUpgradeModalOpen(true)}
                className="w-full bg-white text-orange-600 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-50 transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          )}
        </div>

        <div className="mt-auto p-6 bg-gray-950 border-t border-gray-800">
          <div className="text-xs text-gray-400 flex flex-col gap-1">
            <p className="font-semibold text-gray-300">Global Trade Protocol</p>
            <p>2026 Edition (V4.2.0)</p>
            {user?.isPro && <span className="text-amber-400 font-bold mt-1">PRO SUBSCRIPTION ACTIVE</span>}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-800">
              {TOOLS.find(t => t.id === activeTool)?.name}
            </h2>
            {user?.isPro && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-amber-200">
                Pro 2026
              </span>
            )}
          </div>
          <div className="flex items-center gap-6">
            {!user ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setAuthModal({ open: true, mode: 'signin' })}
                  className="text-sm font-semibold text-gray-600 hover:text-orange-500 transition-colors"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => setAuthModal({ open: true, mode: 'signup' })}
                  className="bg-gray-900 text-white px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-gray-900">{user.name}</p>
                  <p className="text-[10px] text-gray-500">{user.email}</p>
                </div>
                <button onClick={() => setUser(null)} className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm border-2 border-orange-200 hover:bg-orange-200 transition-all">
                  {user.name.charAt(0)}
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6">
            {messages.length === 0 ? (
              <div className="max-w-2xl mx-auto mt-20 text-center">
                <div className="inline-block p-4 rounded-full bg-orange-50 mb-4">
                  <span className="text-4xl">{TOOLS.find(t => t.id === activeTool)?.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Welcome to {TOOLS.find(t => t.id === activeTool)?.name}
                </h3>
                <p className="text-gray-500 max-w-md mx-auto mb-8">
                  {TOOLS.find(t => t.id === activeTool)?.desc}. Provide product details or specific trade requirements below to begin.
                </p>
                {!user && (
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl inline-block max-w-xs text-sm text-blue-800">
                    <p className="font-semibold mb-1">Trade Efficiency Tip:</p>
                    <p>Sign up to save your listing templates and RFQ history permanently.</p>
                  </div>
                )}
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-5 ${
                    msg.role === 'user' 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : 'bg-white border border-gray-200 shadow-sm text-gray-800'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none prose-slate">
                         <ReactMarkdown 
                            components={{
                              h2: ({node, ...props}) => <h2 className="text-md font-bold mb-2 mt-4 text-orange-600" {...props} />,
                              p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
                            }}
                         >
                           {msg.content}
                         </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex gap-2 items-center">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-white border-t border-gray-200">
            <div className="max-w-4xl mx-auto relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={`Describe your request for ${TOOLS.find(t => t.id === activeTool)?.name}...`}
                className="w-full bg-gray-50 border border-gray-300 rounded-2xl px-5 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none h-24 shadow-inner"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="absolute right-3 bottom-3 p-3 bg-orange-500 text-white rounded-xl shadow-lg hover:bg-orange-600 disabled:opacity-50 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* --- Modals --- */}

      {/* Auth Modal */}
      <Modal 
        isOpen={authModal.open} 
        onClose={() => setAuthModal({ ...authModal, open: false })}
        title={authModal.mode === 'signin' ? 'Welcome Back' : 'Create Trade Account'}
      >
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {authModal.mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
              <input 
                type="text" 
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 focus:ring-2 focus:ring-orange-500 outline-none" 
                placeholder="John Smith"
                value={authForm.name}
                onChange={e => setAuthForm({...authForm, name: e.target.value})}
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Business Email</label>
            <input 
              type="email" 
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 focus:ring-2 focus:ring-orange-500 outline-none" 
              placeholder="name@company.com"
              value={authForm.email}
              onChange={e => setAuthForm({...authForm, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 focus:ring-2 focus:ring-orange-500 outline-none" 
              placeholder="••••••••"
              value={authForm.password}
              onChange={e => setAuthForm({...authForm, password: e.target.value})}
            />
          </div>
          <button type="submit" className="w-full bg-orange-500 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-orange-600 transition-all mt-2">
            {authModal.mode === 'signin' ? 'Sign In to Marketplace' : 'Create Account'}
          </button>
          <p className="text-center text-sm text-gray-500">
            {authModal.mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
            <button 
              type="button"
              onClick={() => setAuthModal({ ...authModal, mode: authModal.mode === 'signin' ? 'signup' : 'signin' })}
              className="ml-1 text-orange-600 font-bold hover:underline"
            >
              {authModal.mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </form>
      </Modal>

      {/* Upgrade Modal */}
      <Modal 
        isOpen={upgradeModalOpen} 
        onClose={() => setUpgradeModalOpen(false)}
        title="Upgrade to AlibabaAI Pro 2026"
      >
        <div className="mb-6 flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-100">
          <div>
            <p className="text-sm font-bold text-orange-800">Annual Professional Plan</p>
            <p className="text-xs text-orange-600">Full Access • Unlimited Listings • Priority Support</p>
          </div>
          <p className="text-lg font-bold text-orange-800">$499<span className="text-xs font-normal">/yr</span></p>
        </div>

        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Credit Card Number</label>
            <div className="relative">
              <input 
                type="text" 
                required
                maxLength={19}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 focus:ring-2 focus:ring-orange-500 outline-none font-mono" 
                placeholder="4242 4242 4242 4242"
                value={paymentForm.card}
                onChange={e => setPaymentForm({...paymentForm, card: e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim()})}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                <div className="w-6 h-4 bg-gray-300 rounded-sm"></div>
                <div className="w-6 h-4 bg-gray-200 rounded-sm"></div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Expiry Date (MM/YY)</label>
              <input 
                type="text" 
                required
                maxLength={5}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 focus:ring-2 focus:ring-orange-500 outline-none" 
                placeholder="MM/YY"
                value={paymentForm.expiry}
                onChange={e => setPaymentForm({...paymentForm, expiry: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CVV</label>
              <input 
                type="password" 
                required
                maxLength={4}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 focus:ring-2 focus:ring-orange-500 outline-none" 
                placeholder="123"
                value={paymentForm.cvv}
                onChange={e => setPaymentForm({...paymentForm, cvv: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Business Phone Number</label>
            <input 
              type="tel" 
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 focus:ring-2 focus:ring-orange-500 outline-none" 
              placeholder="+1 (555) 000-0000"
              value={paymentForm.phone}
              onChange={e => setPaymentForm({...paymentForm, phone: e.target.value})}
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-[10px] text-gray-600 leading-tight">Secure 256-bit SSL encrypted checkout. Payments processed in compliance with 2026 trade safety regulations.</p>
          </div>

          <button type="submit" className="w-full bg-gray-900 text-white font-bold py-4 rounded-lg shadow-xl hover:bg-black transition-all transform active:scale-[0.98] mt-2">
            Finalize Pro Upgrade
          </button>
        </form>
      </Modal>

    </div>
  );
};

export default App;
