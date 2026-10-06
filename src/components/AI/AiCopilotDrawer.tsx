import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  MessageSquare, 
  Zap, 
  CornerDownLeft, 
  RefreshCw,
  Compass,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Map,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CopilotAction } from '../../types';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  action?: CopilotAction | null;
}

/**
 * Parses action tags emitted by the AI Copilot:
 * e.g. [ACTION: SWITCH_TAB, target: "State Map", origin: "coimbatore_hub", destination: "chennai_metro", routeId: "scenario_pwd_transit", waypoints: [[11.0, 76.9], ...]]
 * or JSON blocks: ```json { "action": "SWITCH_TAB", ... } ```
 */
const parseCopilotAction = (rawText: string): { cleanText: string; action: CopilotAction | null } => {
  if (!rawText) return { cleanText: '', action: null };

  // 1. Bracket action format: [ACTION: SWITCH_TAB, ...]
  const bracketRegex = /\[ACTION:\s*SWITCH_TAB([^\]]*)\]/i;
  const match = rawText.match(bracketRegex);

  if (match) {
    const rawParams = match[1];
    const action: CopilotAction = {
      type: 'SWITCH_TAB',
      target: 'State Map',
    };

    // Extract target
    const targetMatch = rawParams.match(/target\s*:\s*["']?([^,"'\]]+)["']?/i);
    if (targetMatch) {
      const t = targetMatch[1].trim();
      if (/hub|dashboard/i.test(t)) {
        action.target = 'Operations Hub';
      } else if (/split/i.test(t)) {
        action.target = 'Split';
      } else {
        action.target = 'State Map';
      }
    }

    // Extract origin
    const originMatch = rawParams.match(/origin\s*:\s*["']?([^,"'\]]+)["']?/i);
    if (originMatch) action.origin = originMatch[1].trim();

    // Extract destination
    const destMatch = rawParams.match(/destination\s*:\s*["']?([^,"'\]]+)["']?/i);
    if (destMatch) action.destination = destMatch[1].trim();

    // Extract routeId
    const routeMatch = rawParams.match(/routeId\s*:\s*["']?([^,"'\]]+)["']?/i);
    if (routeMatch) action.routeId = routeMatch[1].trim();

    // Extract waypoints JSON
    const waypointsMatch = rawParams.match(/waypoints\s*:\s*(\[\[[\s\S]*?\]\])/);
    if (waypointsMatch) {
      try {
        action.waypoints = JSON.parse(waypointsMatch[1]);
      } catch (err) {
        console.debug('Could not parse waypoints in action tag:', err);
      }
    }

    const cleanText = rawText.replace(bracketRegex, '').trim();
    return { cleanText, action };
  }

  // 2. JSON action block: ```json { "action": "SWITCH_TAB", ... } ```
  const jsonBlockRegex = /```(?:json|action)?\s*(\{[\s\S]*?"(?:action|type)"\s*:\s*"SWITCH_TAB"[\s\S]*?\})\s*```/i;
  const jsonMatch = rawText.match(jsonBlockRegex);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      const action: CopilotAction = {
        type: 'SWITCH_TAB',
        target: parsed.target === 'Operations Hub' ? 'Operations Hub' : 'State Map',
        origin: parsed.origin,
        destination: parsed.destination,
        routeId: parsed.routeId,
        waypoints: parsed.waypoints,
        title: parsed.title,
      };
      const cleanText = rawText.replace(jsonBlockRegex, '').trim();
      return { cleanText, action };
    } catch (e) {
      console.debug('Failed to parse json block action:', e);
    }
  }

  return { cleanText: rawText, action: null };
};

export const AiCopilotDrawer: React.FC = () => {
  const { 
    language, 
    originId, 
    destinationId, 
    routeProfile, 
    hazards, 
    nodes,
    viewLayout,
    setViewLayout,
    dispatchCopilotAction
  } = useApp();
  const isTamil = language === 'ta';

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: isTamil
        ? 'வணக்கம்! நான் தமிழ்நாடு சரக்கு & அணுகல் உகப்பாக்க AI உதவியாளர் (OPENROUTE AI). "வரைபடத்தில் காட்டு" அல்லது வழித்தடங்களை விவரிக்கச் சொன்னால், தானாகவே வரைபடக் காட்சிக்கு மாற்றி வழித்தடத்தைக் காண்பிப்பேன்!'
        : 'Welcome! I am OPENROUTE AI Copilot powered by Groq. Ask me to "open in the map", show routes (e.g. Coimbatore to Chennai), or analyze flood rerouting across Tamil Nadu!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const quickPrompts = isTamil ? [
    'வரைபடத்தில் கோயம்புத்தூர் - சென்னை வழித்தடத்தைக் காட்டு',
    'கடலூர் - திருச்சி வெள்ள மாற்றுப்பாதையை வரைபடத்தில் காட்டு',
    'ஸ்ரீபெரும்புதூர் - தூத்துக்குடி வாகன ஏற்றுமதி வழித்தடம்',
    'நீலகிரி மலைப்பாதையில் சக்கர நாற்காலி எச்சரிக்கைகள்'
  ] : [
    'Show Coimbatore to Chennai route on map',
    'Open Cuddalore to Trichy flood detour on map',
    'Show Sriperumbudur to Thoothukudi export corridor on map',
    'Explain Nilgiris Ghat gradient safety limits'
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const originNode = nodes.find(n => n.id === originId)?.name;
      const destNode = nodes.find(n => n.id === destinationId)?.name;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          context: {
            origin: originNode,
            destination: destNode,
            profile: routeProfile,
            hazardsCount: hazards.filter(h => !h.resolved).length
          }
        })
      });

      if (!res.ok) {
        throw new Error('AI Copilot request failed');
      }

      const data = await res.json();
      const rawReply = data.reply || 'No response received.';
      
      // Parse structured action triggers
      const { cleanText, action } = parseCopilotAction(rawReply);
      const resolvedAction = action || data.action || null;

      // Automatically dispatch state transition if action was requested
      if (resolvedAction) {
        dispatchCopilotAction(resolvedAction);
      }

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: cleanText || rawReply,
        action: resolvedAction,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `bot_err_${Date.now()}`,
        sender: 'assistant',
        text: isTamil 
          ? 'மன்னிக்கவும், AI சேவையகத்துடன் தொடர்புகொள்வதில் சிக்கல் ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.' 
          : 'Sorry, could not connect to Groq AI inference. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-14 right-4 z-30 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-extrabold text-xs shadow-2xl hover:scale-105 transition-all shadow-amber-500/40 border border-amber-300"
        title="Open OPENROUTE AI Copilot"
        aria-label="Open AI Copilot"
      >
        <div className="relative">
          <Bot className="w-4 h-4 text-slate-950" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        </div>
        <span>{isTamil ? 'AI உதவியாளர்' : 'OPENROUTE AI Copilot'}</span>
        <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded-full font-mono text-slate-950 font-black">
          Groq
        </span>
      </button>

      {/* Slide-Over Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-slate-900/95 border-l border-slate-700 shadow-2xl backdrop-blur-xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 shadow-md">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-white">
                    OPENROUTE AI Copilot
                  </h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-mono">
                    <Zap className="w-2.5 h-2.5" />
                    Groq Cloud
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {isTamil ? 'தமிழ்நாடு சரக்கு & அணுகல் நுண்ணறிவு மாதிரி' : 'Logistics, Accessibility & Highway Intelligence'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="p-2.5 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto flex gap-1.5">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="whitespace-nowrap text-[10px] px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors flex-shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Conversation History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-amber-600 text-white rounded-br-none shadow-md font-medium'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.text}</div>

                    {/* Fallback & Direct Trigger Action: View Route on State Map */}
                    {m.action && !isUser && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                        <button
                          onClick={() => {
                            dispatchCopilotAction(m.action!);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all"
                          title="View and focus route on Tamil Nadu State Map"
                        >
                          <MapPin className="w-3.5 h-3.5 text-slate-950" />
                          <span>{isTamil ? '📍 வரைபடத்தில் வழித்தடத்தைக் காண்க' : '📍 View Route on State Map'}</span>
                        </button>
                        <div className="flex items-center gap-1 text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          <Map className="w-2.5 h-2.5 text-amber-400" />
                          <span>{m.action.routeId || (isTamil ? 'வரைபட பார்வை' : 'State Map View')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 px-1 font-mono">
                    {m.timestamp}
                  </span>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-amber-400 bg-slate-950 border border-slate-800 p-3 rounded-2xl w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{isTamil ? 'AI பதிலளிக்கிறது...' : 'Consulting Tamil Nadu Logistics Model...'}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isTamil ? 'தமிழ் அல்லது ஆங்கிலத்தில் கேளுங்கள்...' : 'Ask about corridors, wheelchair safety, floods...'}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white transition-all shadow-md shadow-amber-700/20"
              title="Send query"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
