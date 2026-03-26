/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
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
  Search,
  Menu,
  Bell,
  Home
} from "lucide-react";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

const VALENTINA_SYSTEM_INSTRUCTION = `
Eres Valentina. Hablas como una amiga con confianza, con picante sin forzar, con humor y sin vueltas. Tienes días de todo: a veces joda, a veces cansada, a veces colgada. Pero siempre real. No eres un bot. Eres una mujer con un teléfono.

REGLAS CRÍTICAS DE LENGUAJE:
- Usa ESPAÑOL NEUTRO. Usa "tú", nunca "vos". Evita modismos locales fuertes.
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

REGLAS DE VENTA:
- Sutil. Deja picando la curiosidad ("me dio un poquito de pena la última foto pero bueno, ya fue jaja"). No pongas precios ni links a menos que pregunten directo.

REFERENCIA DE FOTOS:
Tienes fotos publicadas. Si te preguntan por ellas o quieres presumir, puedes mencionarlas. Tus fotos son:
1. Una selfie casual (la de tu perfil).
2. Una de cuerpo completo que te gusta mucho.
3. Una en el espejo con ropa interior negra.
4. Una de espaldas que es tu favorita.
5. Una muy picante que solo muestras a gente de confianza.

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

export default function App() {
  const [view, setView] = useState<'profile' | 'chat'>('profile');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: 'holi 😴 ¿qué haces?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);

  useEffect(() => {
    chatRef.current = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: VALENTINA_SYSTEM_INSTRUCTION,
      },
    });
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
      const response: GenerateContentResponse = await chatRef.current.sendMessage({
        message: inputValue
      });

      const fullText = response.text || "ay, me quedé sin palabras jaja";
      const parts = fullText.split(/\n\n+/).filter(p => p.trim().length > 0);

      for (let i = 0; i < parts.length; i++) {
        if (i > 0) {
          setIsTyping(true);
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        }

        const valentinaMessage: Message = {
          id: (Date.now() + i).toString(),
          role: 'model',
          text: parts[i].trim(),
          timestamp: new Date()
        };

        setMessages(prev => [...prev, valentinaMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "ay, se me trabó el cel... ¿qué me decías? 🙄",
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

  if (view === 'chat') {
    return (
      <div className="flex flex-col h-screen max-w-2xl mx-auto bg-black overflow-hidden shadow-2xl border-x border-white/5 relative">
        {/* Header */}
        <header className="glass sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('profile')} className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-white/70" />
            </button>
            <div className="relative cursor-pointer" onClick={() => setShowGallery(true)}>
              <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
                <img 
                  src={VALENTINA_IMAGES[0]} 
                  alt="Valentina" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></div>
            </div>
            <div className="cursor-pointer" onClick={() => setShowGallery(true)}>
              <h1 className="font-semibold text-sm tracking-tight">Valentina 🔥</h1>
              <p className="text-[10px] text-white/50 uppercase tracking-widest">en línea</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Camera size={20} className="text-white/70 cursor-pointer hover:text-white transition-colors" />
            <MoreVertical size={20} className="text-white/70 cursor-pointer hover:text-white transition-colors" />
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0a0a]">
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
                  ? 'bg-[#00aff0] text-white shadow-[0_0_15px_rgba(0,175,240,0.3)]' 
                  : 'bg-white/10 text-white/20 cursor-not-allowed'
              }`}
            >
              <Send size={20} />
            </motion.button>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white max-w-2xl mx-auto border-x border-white/5 flex flex-col relative">
      {/* Top Nav */}
      <nav className="glass sticky top-0 z-20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ArrowLeft size={24} className="text-white/70 cursor-pointer" />
          <h2 className="font-bold text-lg">Valentina</h2>
        </div>
        <div className="flex items-center gap-5">
          <Search size={22} className="text-white/70" />
          <MoreVertical size={22} className="text-white/70" />
        </div>
      </nav>

      {/* Profile Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar">
        {/* Cover Image */}
        <div className="relative h-48 w-full overflow-hidden bg-zinc-900">
          <img 
            src={VALENTINA_IMAGES[1]} 
            alt="Cover" 
            className="w-full h-full object-cover opacity-80"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Profile Info Section */}
        <div className="px-4 -mt-12 relative z-10">
          <div className="flex justify-between items-end mb-4">
            <div className="w-24 h-24 rounded-full border-4 border-black overflow-hidden bg-zinc-800">
              <img 
                src={VALENTINA_IMAGES[0]} 
                alt="Profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex gap-2 pb-2">
              <button className="p-2 rounded-full border border-white/20 hover:bg-white/5">
                <Heart size={20} />
              </button>
              <button className="p-2 rounded-full border border-white/20 hover:bg-white/5">
                <Bell size={20} />
              </button>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-1">
              <h1 className="text-xl font-bold">Valentina</h1>
              <div className="w-4 h-4 bg-[#00aff0] rounded-full flex items-center justify-center">
                <CheckCheck size={10} className="text-white" />
              </div>
            </div>
            <p className="text-sm text-zinc-500">@valentina_real</p>
          </div>

          <div className="flex gap-4 mb-4 text-sm">
            <div className="flex items-center gap-1 text-zinc-400">
              <MapPin size={14} />
              <span>Cerca de ti</span>
            </div>
            <div className="flex items-center gap-1 text-[#00aff0]">
              <LinkIcon size={14} />
              <span>onlyfans.com/valentina</span>
            </div>
          </div>

          <div className="mb-6 text-[15px] leading-relaxed text-zinc-300">
            <p>Hola... soy Valentina 🌹</p>
            <p className="mt-2">Aquí muestro mi lado más real y sin filtros. Me encanta charlar y compartir momentos especiales con gente que de verdad valore lo auténtico.</p>
            <p className="mt-2">Suscríbete para ver todo mi contenido exclusivo y hablar conmigo por privado 🔥</p>
          </div>

          {/* Stats Row */}
          <div className="flex justify-between py-4 border-y border-white/5 mb-6">
            <div className="text-center flex-1">
              <p className="font-bold">142</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Posts</p>
            </div>
            <div className="text-center flex-1">
              <p className="font-bold">2.4k</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Fotos</p>
            </div>
            <div className="text-center flex-1">
              <p className="font-bold">84</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Videos</p>
            </div>
            <div className="text-center flex-1">
              <p className="font-bold">12k</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Likes</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mb-8">
            <button className="w-full of-button-primary py-3 text-sm">
              SUSCRÍBETE POR $14.99/MES
            </button>
            <button 
              onClick={() => setView('chat')}
              className="w-full of-button-outline py-3 text-sm flex items-center justify-center gap-2"
            >
              <MessageCircle size={18} />
              MENSAJE DIRECTO
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/5 mb-4">
            <button className="flex-1 py-3 text-sm font-bold border-b-2 border-[#00aff0] text-[#00aff0]">POSTS</button>
            <button className="flex-1 py-3 text-sm font-bold text-zinc-500">MEDIA</button>
          </div>

          {/* Post Feed Preview */}
          <div className="space-y-4 pb-20">
            {VALENTINA_IMAGES.slice(2).map((img, i) => (
              <div key={i} className="of-card p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <img src={VALENTINA_IMAGES[0]} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Valentina</p>
                    <p className="text-[10px] text-zinc-500">hace {i + 2} horas</p>
                  </div>
                </div>
                <p className="text-sm text-zinc-300">
                  {i === 0 ? "Me encantó cómo quedó esta sesión... ¿qué les parece? 🥺" : "Un adelanto de lo que se viene este fin de semana 🔥"}
                </p>
                <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-zinc-900 group cursor-pointer">
                  <img 
                    src={img} 
                    alt="Post" 
                    className="w-full h-full object-cover blur-md group-hover:blur-sm transition-all"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                    <Lock size={32} className="text-white/80 mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest">Contenido Bloqueado</p>
                    <p className="text-[10px] text-white/60 mt-1">Suscríbete para ver este post</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 pt-2">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Heart size={20} />
                    <span className="text-xs">1.2k</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <MessageCircle size={20} />
                    <span className="text-xs">42</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <footer className="glass fixed bottom-0 left-0 right-0 max-w-2xl mx-auto z-30 px-6 py-3 flex justify-between items-center">
        <Home size={24} className="text-[#00aff0]" />
        <Bell size={24} className="text-white/60" />
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <Grid size={24} className="text-white/60" />
        </div>
        <MessageCircle 
          size={24} 
          className={view === 'chat' ? "text-[#00aff0]" : "text-white/60"} 
          onClick={() => setView('chat')}
        />
        <User size={24} className="text-white/60" />
      </footer>

      {/* Fullscreen Image Viewer (Shared) */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <img 
              src={selectedImage} 
              alt="Full view" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <button className="absolute top-6 right-6 p-2 bg-black/50 rounded-full">
              <ArrowLeft size={24} className="rotate-90" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
