import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, history } = req.body;
    
    // Inicializar Gemini con la API key del servidor
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Preparar el contenido para Gemini
    const contents = [];
    
    // Agregar historial si existe
    if (history && history.length > 0) {
      history.forEach(msg => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
    }
    
    // Agregar el mensaje actual
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });
    
    // Llamar a Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: contents,
      config: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    });
    
    const reply = response.text || "Lo siento, no pude procesar tu mensaje.";
    
    return res.status(200).json({ 
      success: true, 
      message: reply 
    });
    
  } catch (error) {
    console.error('Error en API de Gemini:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error al procesar la solicitud' 
    });
  }
}
