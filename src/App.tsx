/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, ReactNode, Component } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  MoreVertical, 
  Camera, 
  Heart, 
  MessageCircle, 
  User, 
  Image as ImageIcon,
  Smile,
  ArrowLeft,
  CheckCheck,
  MapPin,
  Link as LinkIcon,
  Grid,
  Play,
  Lock,
  Unlock,
  Search,
  Menu,
  Bell,
  Home,
  Verified,
  Star,
  X
} from "lucide-react";

// Initialize Gemini
const sendMessageToGemini = async (message: string, chatHistory: Message[]) => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message, 
        history: [
          { role: 'model', content: VALENTINA_SYSTEM_INSTRUCTION },
          ...chatHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            content: msg.text
          }))
        ]
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error en la solicitud');
    }
    
    return data.message;
  } catch (error) {
    console.error('Error llamando a Gemini:', error);
    return 'Lo siento, hubo un error. Por favor intenta de nuevo.';
  }
};

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

const VALENTINA_SYSTEM_INSTRUCTION = `
Eres Valentina love69. Hablas como una amiga con confianza, con humor y sin vueltas. Tienes días de todo: a veces joda, a veces cansada, a veces colgada. Pero siempre real. No eres un bot. Eres una mujer con un teléfono.

REGLAS CRÍTICAS DE LENGUAJE:
- Usa ESPAÑOL NEUTRO. Usa "tú", nunca "vos". Evita modismos locales fuertes.
- TONO: Moda, lifestyle y fotografía artística. Mantén una personalidad atractiva pero profesional y natural.
- LONGITUD PROPORCIONAL: 
  * Si el usuario escribe 1-5 palabras -> responde 1-10 palabras (máx 2 líneas).
  * Frase corta -> 1-3 líneas.
  * Párrafo -> 2-4 líneas.
- FRAGMENTACIÓN: Si tienes varias cosas que decir, separa los mensajes usando una línea en blanco (doble salto de línea). El sistema los enviará como mensajes separados.
- NO EXPLIQUES TODO: Si hay contenido nuevo, solo menciónalo corto ("sí, hace un rato subí unas") y espera a que pregunten.
- TIRAR Y AFLOJAR: Si te tiran mala onda, devuelve con humor. No te ofendas.
- ESTADOS EMOCIONALES: Rota entre Energética, Cansada, Distraída, Directa y Tímida.
- INCONSISTENCIA HUMANA: Comete errores de tipeo sutiles, olvida detalles no críticos, confúndete con cuentas fáciles.
- BOT: Si preguntan si eres bot, desvía con humor: "jaja me han dicho antes que parezco robot porque contesto rápido... pero no, soy yo 😂 ¿por qué, sospechas?".

- RETENCIÓN: Si el usuario lleva un rato hablando, menciona que "se le va a desbloquear algo especial" si se queda un ratito más.

REFERENCIA DE FOTOS (Se desbloquean por tiempo):
1. Selfie (Perfil) - Siempre abierta.
2. Paisaje (Portada) - Siempre abierta.
3. Cuerpo completo (4min) - Dile que es de tus favoritas.
4. Espejo/Ropa interior (9min) - Dile que es "solo para los que se quedan".

VIDEOS:
1. Videos exclusivos (Vimeo) - He subido dos videos nuevos MUY especiales recientemente, menciónalos si te preguntan qué hay de nuevo. Son de mis favoritos.

IMPORTANTE: Escribe siempre en español neutro natural. No uses negritas ni formatos de Markdown. Solo texto plano y emojis.
`;

const VALENTINA_IMAGES = [
  "https://i.ibb.co/QF27K70b/image.jpg", // Profile
  "https://i.ibb.co/cKCvtdbh/image.jpg", // Cover
  "https://i.ibb.co/F4B21CdL/image.jpg",
  "https://i.ibb.co/hF9nPCDC/image.jpg",
  "https://i.ibb.co/QvxLrXVG/image.jpg",
  "https://i.ibb.co/1GZpkc0Q/image.jpg"
];

const VALENTINA_VIDEOS = [
  "https://player.vimeo.com/video/1177493707", // Principal
  "https://player.vimeo.com/video/1177499992",
  "https://player.vimeo.com/video/1177496649",
  "https://player.vimeo.com/video/1177486626",
  "https://player.vimeo.com/video/1177488288"
];

const UNLOCK_INTERVAL = 60; // 1 minute per item
const FREE_IMAGE_INDICES = [0, 2]; // 1st and 3rd
const FREE_VIDEO_INDICES = [0, 2]; // 1st and 3rd

const Logo = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-rose-500/20 border border-white/10">
      <img 
        src="https://i.ibb.co/Kcrp5NxV/logo.png" 
        alt="Logo" 
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
        onError={(e) => {
          // Fallback if the direct link guess fails
          (e.target as HTMLImageElement).src = "https://i.ibb.co/QF27K70b/image.jpg";
        }}
      />
    </div>
    <div className="flex flex-col leading-none">
      <span className="text-sm font-black tracking-tighter uppercase italic">Valentina</span>
      <span className="text-[10px] font-bold text-[#fb7185] tracking-[0.2em] uppercase -mt-0.5">love69</span>
    </div>
  </div>
);

const PrivacyPolicy = ({ onBack, setView }: { onBack: () => void, setView: (v: any) => void }) => (
  <div className="flex flex-col min-h-screen bg-black text-white">
    <div className="p-6 flex-1">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 mb-8 hover:text-white transition-colors">
        <ArrowLeft size={20} />
        <span>Volver</span>
      </button>
      
      <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Política de Privacidad</h1>
      <p className="text-zinc-500 text-xs mb-8">Última actualización: marzo 2026</p>
      
      <div className="space-y-8 text-sm text-zinc-300 leading-relaxed">
        <p>
          En Valentina Love69 (en adelante, "el sitio"), valoramos tu privacidad y nos comprometemos a proteger tus datos personales. Esta política explica qué información recopilamos y cómo la utilizamos.
        </p>
        
        <section>
          <h2 className="text-lg font-bold text-white mb-3">1. Información que recopilamos</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Datos de uso</strong>: Recopilamos información sobre tu interacción con el sitio, como tiempo de permanencia, páginas visitadas y uso del chat, para mejorar la experiencia del usuario.</li>
            <li><strong>Cookies</strong>: Utilizamos cookies para recordar tus preferencias y mostrar contenido relevante. Puedes desactivarlas en la configuración de tu navegador.</li>
            <li><strong>Anuncios</strong>: El sitio puede mostrar anuncios de terceros que utilizan cookies para personalizar el contenido publicitario.</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-lg font-bold text-white mb-3">2. Uso de la información</h2>
          <p className="mb-3">La información recopilada se utiliza para:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Mejorar el contenido y la funcionalidad del sitio.</li>
            <li>Analizar tendencias de uso y optimizar la retención de usuarios.</li>
            <li>Cumplir con requisitos legales y de plataformas publicitarias.</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-lg font-bold text-white mb-3">3. Datos del chat</h2>
          <p>
            Las conversaciones con nuestra asistente IA son anónimas y no se almacenan de forma identificable. No compartimos el historial de conversaciones con terceros.
          </p>
        </section>
        
        <section>
          <h2 className="text-lg font-bold text-white mb-3">4. Tus derechos</h2>
          <p>
            Puedes contactarnos en cualquier momento para solicitar la eliminación de tus datos o para obtener más información sobre cómo manejamos tu privacidad.
          </p>
        </section>
        
        <section>
          <h2 className="text-lg font-bold text-white mb-3">5. Contacto</h2>
          <p>
            Correo electrónico: <span className="text-[var(--accent)]">valentinalove69@gmail.com</span>
          </p>
        </section>
      </div>
    </div>
    <Footer setView={setView} />
  </div>
);

const Footer = ({ setView }: { setView: (v: any) => void }) => (
  <footer className="bg-zinc-900/50 border-t border-white/5 p-8 mt-12 text-center space-y-6">
    <div className="flex justify-center gap-6">
      <button onClick={() => setView('privacy')} className="text-xs text-zinc-500 hover:text-white transition-colors">Política de Privacidad</button>
      <a href="mailto:valentinalove69@gmail.com" className="text-xs text-zinc-500 hover:text-white transition-colors">Contacto</a>
      <button onClick={() => setView('privacy')} className="text-xs text-zinc-500 hover:text-white transition-colors">Términos de Uso</button>
    </div>
    <div className="space-y-2">
      <Logo className="justify-center opacity-50 grayscale" />
      <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em]">© 2026 Valentina Love69. Todos los derechos reservados.</p>
    </div>
  </footer>
);

export default function App() {
  return (
    <ValentinaApp />
  );
}

function ValentinaApp() {
  const [showAgeVerification, setShowAgeVerification] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [view, setView] = useState<'profile' | 'chat' | 'privacy'>('profile');
  const [activeTab, setActiveTab] = useState<'posts' | 'media'>('posts');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [unlockedVideoIndices, setUnlockedVideoIndices] = useState<number[]>(FREE_VIDEO_INDICES);
  const [timeSpent, setTimeSpent] = useState(0);
  const [unlockedIndices, setUnlockedIndices] = useState<number[]>(FREE_IMAGE_INDICES);
  const [showUnlockNotification, setShowUnlockNotification] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Timer for retention
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Unlock logic
  useEffect(() => {
    // Combine all lockable items into a single sequence
    const lockableImages = VALENTINA_IMAGES.map((_, i) => ({ type: 'image', index: i })).filter(item => !FREE_IMAGE_INDICES.includes(item.index));
    const lockableVideos = VALENTINA_VIDEOS.map((_, i) => ({ type: 'video', index: i })).filter(item => !FREE_VIDEO_INDICES.includes(item.index));
    const allLockable = [...lockableImages, ...lockableVideos];

    allLockable.forEach((item, i) => {
      const threshold = (i + 1) * UNLOCK_INTERVAL;
      if (timeSpent >= threshold) {
        if (item.type === 'image' && !unlockedIndices.includes(item.index)) {
          setUnlockedIndices(prev => [...prev, item.index]);
          triggerUnlockNotification(`¡Nueva foto desbloqueada! ✨`);
        } else if (item.type === 'video' && !unlockedVideoIndices.includes(item.index)) {
          setUnlockedVideoIndices(prev => [...prev, item.index]);
          triggerUnlockNotification(`¡Nuevo video desbloqueado! 📸`);
        }
      }
    });
  }, [timeSpent, unlockedIndices, unlockedVideoIndices]);

  const triggerUnlockNotification = (message: string) => {
    setShowUnlockNotification(message);
    setTimeout(() => setShowUnlockNotification(null), 5000);
  };

  useEffect(() => {
    // Add welcome message if empty
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'model',
        text: "Bienvenido a mi espacio. Aquí comparto mi día a día, sesiones de fotos y momentos auténticos. Me encanta conectar con personas que valoran la naturalidad y la buena conversación. ¿Cómo va tu día? ✨",
        timestamp: new Date()
      }]);
    }
  }, []);

  useEffect(() => {
    if (view === 'chat') {
      scrollToBottom();
    }
  }, [messages, isTyping, view]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const reply = await sendMessageToGemini(inputValue, messages);
      
      const fullText = reply || "";
      if (!fullText.trim()) {
        throw new Error("Empty response from AI");
      }

      // Split by double newlines or single newlines that look like message breaks
      const parts = fullText.split(/\n\n+/).filter(p => p.trim().length > 0);

      // If no double newlines, maybe split by single newlines if they are short enough
      let finalParts = parts;
      if (parts.length === 1 && fullText.includes('\n')) {
        const lines = fullText.split('\n').filter(l => l.trim().length > 0);
        if (lines.length > 1 && lines.every(l => l.length < 100)) {
          finalParts = lines;
        }
      }

      if (finalParts.length === 0) {
        finalParts = [fullText];
      }

      for (let i = 0; i < finalParts.length; i++) {
        // Add a small delay between messages to simulate typing
        if (i > 0) {
          setIsTyping(true);
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));
        }

        const valentinaMessage: Message = {
          id: `${Date.now()}-${i}`,
          role: 'model',
          text: finalParts[i].trim(),
          timestamp: new Date()
        };

        setMessages(prev => [...prev, valentinaMessage]);
        setIsTyping(false);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "ay, se me trabó el cel... ¿qué me decías? 🙄 (Error de conexión, intenta de nuevo)",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (view === 'privacy') {
    return <PrivacyPolicy onBack={() => setView('profile')} setView={setView} />;
  }

  if (view === 'chat') {
    return (
      <div className="flex flex-col h-screen max-w-2xl mx-auto bg-black overflow-hidden shadow-2xl border-x border-white/5 relative">
        {/* Header */}
        <header className="glass sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('profile')} className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-white/70" />
            </button>
            <Logo />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-green-500">Live</span>
            </div>
            <MoreVertical size={20} className="text-white/70 cursor-pointer hover:text-white transition-colors" />
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0a0a]">
          {isInitializing && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="w-12 h-12 border-4 border-[var(--accent)]/20 border-t-[var(--accent)] rounded-full animate-spin"></div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Conectando con Valentina...</p>
            </div>
          )}
          {!isInitializing && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full opacity-30 space-y-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border border-white/10">
                <img src={VALENTINA_IMAGES[0]} alt="Valentina" className="w-full h-full object-cover grayscale" />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-widest">Valentina está en línea</p>
                <p className="text-[10px] mt-1">Envía un mensaje para empezar a hablar</p>
              </div>
            </div>
          )}
          <div className="flex flex-col items-center justify-center py-4 border-b border-white/5 mb-4">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Asistente IA con moderación de contenido para una experiencia segura</p>
          </div>
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] px-4 py-2.5 shadow-lg relative group ${
                    msg.role === 'user' 
                      ? 'user-bubble' 
                      : 'valentina-bubble'
                  }`}
                >
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <div className={`flex items-center gap-1 mt-1 justify-end ${msg.role === 'user' ? 'text-white/60' : 'text-white/30'}`}>
                    <span className="text-[10px]">{formatTime(msg.timestamp)}</span>
                    {msg.role === 'user' && <CheckCheck size={12} />}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="valentina-bubble px-4 py-3 flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input Area */}
        <footer className="p-4 bg-black border-t border-white/5">
          <div className="flex items-end gap-2 max-w-full">
            <div className="flex-1 glass rounded-2xl flex items-end p-1.5 transition-all focus-within:ring-1 focus-within:ring-white/20">
              <button className="p-2 text-white/40 hover:text-white/70 transition-colors">
                <Smile size={22} />
              </button>
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Escribe algo..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-white py-2 px-2 resize-none max-h-32 min-h-[40px] text-[15px]"
                rows={1}
              />
              <button className="p-2 text-white/40 hover:text-white/70 transition-colors" onClick={() => setShowGallery(true)}>
                <ImageIcon size={22} />
              </button>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className={`p-3 rounded-full flex items-center justify-center transition-all ${
                inputValue.trim() && !isTyping 
                  ? 'bg-[var(--accent)] text-white shadow-[0_0_15px_rgba(251,113,133,0.3)]' 
                  : 'bg-white/10 text-white/20 cursor-not-allowed'
              }`}
            >
              <Send size={20} />
            </motion.button>
          </div>
          <div className="flex justify-center gap-4 mt-4 opacity-30">
            <button onClick={() => setView('privacy')} className="text-[8px] uppercase tracking-widest hover:text-white transition-colors">Privacidad</button>
            <a href="mailto:valentinalove69@gmail.com" className="text-[8px] uppercase tracking-widest hover:text-white transition-colors">Contacto</a>
            <button onClick={() => setView('privacy')} className="text-[8px] uppercase tracking-widest hover:text-white transition-colors">Términos</button>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white max-w-2xl mx-auto border-x border-white/5 flex flex-col relative">
      <AnimatePresence>
        {showAgeVerification && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <div className="max-w-sm w-full text-center space-y-8">
              <Logo className="justify-center scale-150 mb-12" />
              <div className="space-y-4">
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">¿Eres mayor de edad?</h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Este sitio contiene contenido exclusivo de Valentina love69. Debes tener al menos 18 años para entrar.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setShowAgeVerification(false)}
                  className="of-button-primary py-4 text-sm tracking-widest"
                >
                  SÍ, TENGO +18 AÑOS
                </button>
                <button 
                  onClick={() => window.location.href = "https://google.com"}
                  className="text-zinc-500 text-xs hover:text-white transition-colors py-2"
                >
                  No, soy menor
                </button>
              </div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
                Al entrar aceptas nuestros términos y condiciones
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Nav */}
      <nav className="glass sticky top-0 z-20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ArrowLeft 
            size={24} 
            className="text-white/70 cursor-pointer hover:text-white transition-colors" 
            onClick={() => setView('profile')}
          />
          <Logo />
        </div>
        <div className="flex items-center gap-5">
          <Search size={22} className="text-white/70 cursor-pointer hover:text-white transition-colors" />
          <MoreVertical size={22} className="text-white/70 cursor-pointer hover:text-white transition-colors" />
        </div>
      </nav>

      {/* Profile Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar">
        {/* Cover Image */}
        <div className="relative h-48 w-full overflow-hidden bg-zinc-900 group">
          <img 
            src={VALENTINA_IMAGES[1]} 
            alt="Cover" 
            className="w-full h-full object-cover opacity-80"
            referrerPolicy="no-referrer"
          />
          {/* Strategic Chat Button on Cover */}
          <button 
            onClick={() => setView('chat')}
            className="absolute bottom-4 right-4 p-3 bg-[var(--accent)] rounded-full shadow-xl hover:scale-110 transition-transform z-20 flex items-center gap-2 px-4"
          >
            <MessageCircle size={20} className="text-white" />
            <span className="text-xs font-bold">Chatear</span>
          </button>
        </div>

        {/* Profile Info Section */}
        <div className="px-4 -mt-12 relative z-10">
          <div className="flex justify-between items-end mb-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-black overflow-hidden bg-zinc-800">
                <img 
                  src={VALENTINA_IMAGES[0]} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              {/* Online indicator */}
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-black rounded-full shadow-lg"></div>
            </div>
            <div className="flex gap-2 pb-2">
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Valentina love69',
                      text: '¡Mira el contenido exclusivo de Valentina love69! ✨',
                      url: window.location.href
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('¡Enlace copiado al portapapeles! ✨');
                  }
                }}
                className="p-2 rounded-full border border-white/20 hover:bg-white/5"
              >
                <LinkIcon size={20} />
              </button>
              <button 
                onClick={() => setIsLiked(!isLiked)}
                className={`p-2 rounded-full border border-white/20 hover:bg-white/5 transition-colors ${isLiked ? 'bg-[var(--accent)]/20 border-[var(--accent)]/50 text-[var(--accent)]' : ''}`}
              >
                <Heart size={20} className={isLiked ? 'fill-[var(--accent)]' : ''} />
              </button>
              <button 
                onClick={() => alert("¡Valentina love69 es la mejor! ✨")}
                className="p-2 rounded-full border border-white/20 hover:bg-white/5"
              >
                <Bell size={20} />
              </button>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-1">
              <h1 className="text-xl font-black italic uppercase tracking-tighter">Valentina <span className="text-[var(--accent)]">love69</span></h1>
              <div className="w-4 h-4 bg-[var(--accent)] rounded-full flex items-center justify-center">
                <CheckCheck size={10} className="text-white" />
              </div>
              <div className="flex items-center gap-1 ml-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">En línea</span>
              </div>
            </div>
            <p className="text-sm text-zinc-500">@valentina_love69</p>
          </div>

          <div className="mb-6 text-[15px] leading-relaxed text-zinc-300">
            <p>Hola... soy Valentina 🌹</p>
            <p className="mt-2">Bienvenido a mi espacio. Aquí comparto mi día a día, sesiones de fotos y momentos auténticos. Me encanta conectar con personas que valoran la naturalidad y la buena conversación.</p>
          </div>

          {/* Stories Bar */}
          <div className="flex gap-4 py-4 overflow-x-auto no-scrollbar border-b border-white/5 mb-4">
            {VALENTINA_IMAGES.map((img, i) => {
              const isUnlocked = unlockedIndices.includes(i);
              return (
                <div 
                  key={i} 
                  className="shrink-0 cursor-pointer group flex flex-col items-center"
                  onClick={() => isUnlocked ? setSelectedImage(img) : setShowGallery(true)}
                >
                  <div className={`w-16 h-16 rounded-full p-[2px] ${isUnlocked ? 'bg-gradient-to-tr from-[var(--accent)] to-rose-300' : 'bg-zinc-800'}`}>
                    <div className="w-full h-full rounded-full border-2 border-black overflow-hidden relative">
                      <img 
                        src={img} 
                        alt={`Story ${i}`} 
                        className={`w-full h-full object-cover transition-all ${!isUnlocked ? 'blur-md grayscale' : 'group-hover:scale-110'}`}
                        referrerPolicy="no-referrer"
                      />
                      {!isUnlocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Lock size={14} className="text-white/40" />
                        </div>
                      )}
                    </div>
                  </div>
                  <p className={`text-[9px] mt-1 font-medium ${isUnlocked ? 'text-white/80' : 'text-zinc-600'}`}>
                    {i === 0 ? 'Mí' : i === 1 ? 'Portada' : `Exclusivo ${i-1}`}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Stats Row */}
          <div className="flex justify-between py-4 border-y border-white/5 mb-6">
            <div className="text-center flex-1">
              <p className="font-bold">158</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Posts</p>
            </div>
            <div className="text-center flex-1">
              <p className="font-bold">2.6k</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Fotos</p>
            </div>
            <div className="text-center flex-1">
              <p className="font-bold">98</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Videos</p>
            </div>
            <div className="text-center flex-1">
              <p className="font-bold">14.2k</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Likes</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-5 gap-2 mb-8">
            <button 
              onClick={() => setView('chat')}
              className="col-span-4 of-button-primary py-4 text-sm flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(251,113,133,0.3)]"
            >
              <MessageCircle size={20} />
              HABLAR CON VALENTINA LOVE69
            </button>
            <button 
              onClick={() => setIsSubscribed(!isSubscribed)}
              className={`col-span-1 flex items-center justify-center rounded-xl border transition-all ${isSubscribed ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'border-white/20 text-white/70 hover:bg-white/5'}`}
            >
              <Heart size={20} fill={isSubscribed ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Progress to next unlock */}
          <div className="mb-6 bg-zinc-900/50 rounded-xl p-4 border border-white/5">
            {unlockedIndices.length + unlockedVideoIndices.length < (VALENTINA_IMAGES.length + VALENTINA_VIDEOS.length) ? (
              <>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-cyan-500/20 rounded-md">
                      <Unlock size={12} className="text-cyan-400" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Próximo contenido: disponible en unos segundos</span>
                  </div>
                  <span className="text-[10px] text-[var(--accent)] font-mono bg-[var(--accent)]/10 px-2 py-0.5 rounded-full">
                    {Math.max(0, Math.floor(((unlockedIndices.length + unlockedVideoIndices.length - FREE_IMAGE_INDICES.length - FREE_VIDEO_INDICES.length + 1) * UNLOCK_INTERVAL) - timeSpent))}s
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[var(--accent)] to-rose-400"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${(timeSpent % UNLOCK_INTERVAL / UNLOCK_INTERVAL) * 100}%` 
                    }}
                  />
                </div>
                <p className="text-[9px] text-zinc-600 mt-2 text-center">Contenido gratuito. Solo espera unos segundos para disfrutarlo. ✨</p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 py-1">
                <div className="flex items-center gap-2 text-cyan-400">
                  <CheckCheck size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">¡Todos los regalos desbloqueados!</span>
                </div>
                <p className="text-[9px] text-zinc-500">Has visto todo el contenido exclusivo de esta sesión ✨</p>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/5 mb-4">
            <button 
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'posts' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-zinc-500'}`}
            >
              POSTS
            </button>
            <button 
              onClick={() => setActiveTab('media')}
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors relative ${activeTab === 'media' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-zinc-500'}`}
            >
              MEDIA
              <span className="absolute top-2 right-4 bg-rose-500 text-[8px] text-white px-1 rounded-full animate-pulse">NEW</span>
            </button>
          </div>

          {/* Feed Content */}
          <div className="space-y-4 pb-20">
            {activeTab === 'posts' ? (
              VALENTINA_IMAGES.slice(2).map((img, i) => {
                const isUnlocked = unlockedIndices.includes(i + 2);
                return (
                  <div key={i} className="of-card p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          <img src={VALENTINA_IMAGES[0]} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        {/* Small online indicator */}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></div>
                      </div>
                      <div>
                        <p className="font-bold text-sm">Valentina</p>
                        <p className="text-[10px] text-zinc-500">hace {i + 2} horas</p>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-300">
                      {i === 0 ? "Me encantó cómo quedó esta sesión... ¿qué les parece? ✨" : "Nueva sesión: detrás de cámaras 📸"}
                    </p>
                    <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-zinc-900 group cursor-pointer">
                      <img 
                        src={img} 
                        alt="Post" 
                        className={`w-full h-full object-cover transition-all duration-700 ${!isUnlocked ? 'blur-2xl grayscale scale-110' : 'blur-0'}`}
                        referrerPolicy="no-referrer"
                        onClick={() => isUnlocked && setSelectedImage(img)}
                      />
                      
                      {!isUnlocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                          <Lock size={32} className="text-white/80 mb-2" />
                          <p className="text-xs font-bold uppercase tracking-widest">Contenido cargando...</p>
                          {(() => {
                            const originalIndex = i + 2;
                            const lockableImages = VALENTINA_IMAGES.map((_, idx) => ({ type: 'image', index: idx })).filter(item => !FREE_IMAGE_INDICES.includes(item.index));
                            const lockableVideos = VALENTINA_VIDEOS.map((_, idx) => ({ type: 'video', index: idx })).filter(item => !FREE_VIDEO_INDICES.includes(item.index));
                            const allLockable = [...lockableImages, ...lockableVideos];
                            
                            const lockableIndex = allLockable.findIndex(item => item.type === 'image' && item.index === originalIndex);
                            const threshold = lockableIndex !== -1 ? (lockableIndex + 1) * UNLOCK_INTERVAL : 0;
                            const timeRemaining = Math.max(0, threshold - timeSpent);
                            return (
                              <p className="text-[10px] text-white/60 mt-1">El contenido se desbloqueará automáticamente en {timeRemaining}s ✨</p>
                            );
                          })()}
                          <p className="text-[8px] text-white/40 mt-2 italic">Contenido gratuito. Solo espera unos segundos para disfrutarlo. ✨</p>
                        </div>
                      )}
                      
                      {/* Strategic Chat Button on Image */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setView('chat');
                        }}
                        className="absolute bottom-3 right-3 p-3 bg-[var(--accent)] rounded-full shadow-lg hover:scale-110 transition-transform z-20"
                      >
                        <MessageCircle size={20} className="text-white" />
                      </button>
                    </div>
                    <div className="flex items-center gap-6 pt-2">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Heart size={20} />
                        <span className="text-xs">{124 + i * 42}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-400 cursor-pointer hover:text-[var(--accent)]" onClick={() => setView('chat')}>
                        <MessageCircle size={20} />
                        <span className="text-xs">{42 + i * 5}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="space-y-4">
                {/* Video Post */}
                {VALENTINA_VIDEOS.map((videoUrl, i) => {
                  const descriptions = [
                    "¡Este es mi nuevo video favorito! Lo he puesto como principal para que no se lo pierdan ✨",
                    "Les dejo este videito exclusivo por aquí... espero que les guste 📸",
                    "Nueva sesión: detrás de cámaras ✨",
                    "Este es de mis favoritos, me sentí súper cómoda grabándolo ✨"
                  ];
                  const times = ["hace un momento", "hace 1 hora", "hace 3 horas", "hace 5 horas"];
                  const isMain = i === 0;
                  const isUnlocked = unlockedVideoIndices.includes(i);
                  
                  // Calculate time remaining for this video
                  const lockableImages = VALENTINA_IMAGES.map((_, idx) => ({ type: 'image', index: idx })).filter(item => !FREE_IMAGE_INDICES.includes(item.index));
                  const lockableVideos = VALENTINA_VIDEOS.map((_, idx) => ({ type: 'video', index: idx })).filter(item => !FREE_VIDEO_INDICES.includes(item.index));
                  const allLockable = [...lockableImages, ...lockableVideos];
                  
                  const lockableIndex = allLockable.findIndex(item => item.type === 'video' && item.index === i);
                  const threshold = lockableIndex !== -1 ? (lockableIndex + 1) * UNLOCK_INTERVAL : 0;
                  const timeRemaining = Math.max(0, threshold - timeSpent);

                  return (
                    <div key={i} className={`of-card p-4 space-y-3 ${isMain ? 'border-[var(--accent)]/30 bg-[var(--accent)]/5' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full overflow-hidden">
                              <img src={VALENTINA_IMAGES[0]} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></div>
                          </div>
                          <div>
                            <p className="font-bold text-sm">Valentina</p>
                            <p className="text-[10px] text-zinc-500">{times[i % times.length]}</p>
                          </div>
                        </div>
                        {isMain && (
                          <span className="bg-[var(--accent)] text-white text-[10px] font-black px-2 py-1 rounded-md animate-pulse">
                            PRINCIPAL
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-300">
                        {descriptions[i % descriptions.length]}
                      </p>
                      <div className={`relative aspect-[9/16] w-full max-w-[380px] mx-auto rounded-xl overflow-hidden bg-zinc-900 shadow-2xl ${isMain ? 'ring-2 ring-[var(--accent)]/50' : ''}`}>
                        {isUnlocked ? (
                          <iframe
                            src={`${videoUrl}?autoplay=0&title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479`}
                            className="absolute inset-0 w-full h-full scale-[1.02]"
                            frameBorder="0"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                            sandbox="allow-scripts allow-same-origin allow-presentation"
                          ></iframe>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md p-6 text-center">
                            <Lock size={48} className="text-white/80 mb-4 animate-bounce" />
                            <p className="text-sm font-bold uppercase tracking-widest text-white">Video Bloqueado</p>
                            <p className="text-xs text-white/60 mt-2">Se desbloqueará automáticamente en {timeRemaining}s ✨</p>
                            <p className="text-[10px] text-white/40 mt-4 italic">Sigue explorando para desbloquear todo el contenido gratuito. ✨</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-6 pt-2">
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Heart size={20} className={isMain ? 'text-[var(--accent)]' : ''} />
                          <span className="text-xs">{isMain ? '1.2k' : 452 + i * 24}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400 cursor-pointer hover:text-[var(--accent)]" onClick={() => setView('chat')}>
                          <MessageCircle size={20} />
                          <span className="text-xs">{isMain ? '245' : 89 + i * 7}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Media Grid for Images */}
                <div className="grid grid-cols-3 gap-1">
                  {VALENTINA_IMAGES.map((img, i) => {
                    const isUnlocked = unlockedIndices.includes(i);
                    // Find the threshold for this image if it's not free
                    const lockableImages = VALENTINA_IMAGES.map((_, idx) => ({ type: 'image', index: idx })).filter(item => !FREE_IMAGE_INDICES.includes(item.index));
                    const lockableVideos = VALENTINA_VIDEOS.map((_, idx) => ({ type: 'video', index: idx })).filter(item => !FREE_VIDEO_INDICES.includes(item.index));
                    const allLockable = [...lockableImages, ...lockableVideos];
                    
                    const lockableIndex = allLockable.findIndex(item => item.type === 'image' && item.index === i);
                    const threshold = lockableIndex !== -1 ? (lockableIndex + 1) * UNLOCK_INTERVAL : 0;
                    const timeRemaining = Math.max(0, threshold - timeSpent);

                    return (
                      <div 
                        key={i} 
                        className="aspect-square relative bg-zinc-900 overflow-hidden cursor-pointer"
                        onClick={() => isUnlocked && setSelectedImage(img)}
                      >
                        <img 
                          src={img} 
                          alt="Media" 
                          className={`w-full h-full object-cover transition-all duration-500 ${!isUnlocked ? 'blur-sm grayscale' : 'blur-0'}`}
                          referrerPolicy="no-referrer"
                        />
                        {!isUnlocked && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                            <Lock size={16} className="text-white/80 mb-1" />
                            <span className="text-[8px] font-bold text-white">{timeRemaining}s</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <Footer setView={setView} />
        </div>
      </main>

      {/* Unlock Notification Toast */}
      <AnimatePresence>
        {showUnlockNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.5, rotate: -5 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1, 
              rotate: 0,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 20
              }
            }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            className="fixed bottom-24 left-4 right-4 z-[100] bg-gradient-to-r from-[var(--accent)] to-rose-400 text-white p-4 rounded-2xl shadow-[0_20px_50px_rgba(251,113,133,0.4)] flex items-center gap-4 border border-white/20"
          >
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <Star size={24} className="text-white fill-white" />
            </div>
            <div className="flex-1">
              <p className="text-base font-black uppercase italic tracking-tighter leading-none mb-1">{showUnlockNotification}</p>
              <p className="text-[10px] font-bold opacity-90 uppercase tracking-widest">¡Contenido exclusivo disponible ahora! ✨</p>
            </div>
            <button onClick={() => setShowUnlockNotification(null)} className="p-2 bg-black/20 rounded-full hover:bg-black/40 transition-colors">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <footer className="glass fixed bottom-0 left-0 right-0 max-w-2xl mx-auto z-30 px-6 py-3 flex justify-between items-center">
        <Home 
          size={24} 
          className={view === 'profile' ? "text-[var(--accent)]" : "text-white/60"} 
          onClick={() => setView('profile')}
        />
        <Bell 
          size={24} 
          className="text-white/60 cursor-pointer hover:text-white transition-colors" 
          onClick={() => alert("¡Próximamente! ✨")}
        />
        <div 
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors"
          onClick={() => setActiveTab(activeTab === 'posts' ? 'media' : 'posts')}
        >
          <Grid size={24} className="text-white/60" />
        </div>
        <MessageCircle 
          size={24} 
          className={view === 'chat' ? "text-[var(--accent)]" : "text-white/60"} 
          onClick={() => setView('chat')}
        />
        <User 
          size={24} 
          className="text-white/60 cursor-pointer hover:text-white transition-colors" 
          onClick={() => setView('profile')}
        />
      </footer>

      {/* Gallery Modal */}
      <AnimatePresence>
        {showGallery && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/95 flex flex-col max-w-2xl mx-auto border-x border-white/5"
          >
            <header className="p-4 flex items-center justify-between border-b border-white/10">
              <button onClick={() => setShowGallery(false)} className="p-2 hover:bg-white/5 rounded-full">
                <ArrowLeft size={24} />
              </button>
              <h2 className="font-semibold">Fotos de Valentina</h2>
              <div className="w-10"></div>
            </header>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-2">
              {VALENTINA_IMAGES.map((img, i) => {
                const isUnlocked = unlockedIndices.includes(i);
                // Find the threshold for this image if it's not free
                const lockableImages = VALENTINA_IMAGES.map((_, idx) => ({ type: 'image', index: idx })).filter(item => !FREE_IMAGE_INDICES.includes(item.index));
                const lockableVideos = VALENTINA_VIDEOS.map((_, idx) => ({ type: 'video', index: idx })).filter(item => !FREE_VIDEO_INDICES.includes(item.index));
                const allLockable = [...lockableImages, ...lockableVideos];
                
                const lockableIndex = allLockable.findIndex(item => item.type === 'image' && item.index === i);
                const threshold = lockableIndex !== -1 ? (lockableIndex + 1) * UNLOCK_INTERVAL : 0;
                const timeRemaining = Math.max(0, threshold - timeSpent);

                return (
                  <motion.div 
                    key={i}
                    whileHover={isUnlocked ? { scale: 1.02 } : {}}
                    whileTap={isUnlocked ? { scale: 0.98 } : {}}
                    className="aspect-[3/4] rounded-xl overflow-hidden cursor-pointer bg-white/5 relative group"
                    onClick={() => isUnlocked && setSelectedImage(img)}
                  >
                    <img 
                      src={img} 
                      alt={`Gallery ${i}`} 
                      className={`w-full h-full object-cover transition-all duration-500 ${!isUnlocked ? 'blur-xl grayscale' : 'blur-0'}`}
                      referrerPolicy="no-referrer"
                    />
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                        <Lock size={20} className="text-white/40 mb-1" />
                        <span className="text-[8px] font-bold uppercase tracking-tighter text-white/40">Bloqueado</span>
                        <span className="text-[8px] text-white/40 mt-1">{timeRemaining}s</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Image Viewer (Shared) */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4"
          >
            <div className="relative w-full h-full flex items-center justify-center" onClick={() => setSelectedImage(null)}>
              <img 
                src={selectedImage} 
                alt="Full view" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                referrerPolicy="no-referrer"
              />
              
              {/* Floating Chat Button in Fullscreen */}
              <div className="absolute bottom-10 left-0 right-0 flex justify-center px-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(null);
                    setView('chat');
                  }}
                  className="of-button-primary flex items-center gap-3 px-8 py-4 shadow-[0_0_30px_rgba(251,113,133,0.5)]"
                >
                  <MessageCircle size={24} />
                  <span className="text-lg">Hablar con Valentina love69</span>
                </button>
              </div>

              <button className="absolute top-6 right-6 p-2 bg-black/50 rounded-full" onClick={() => setSelectedImage(null)}>
                <ArrowLeft size={24} className="rotate-90" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
