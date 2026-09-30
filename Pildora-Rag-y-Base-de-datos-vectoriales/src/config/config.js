import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  aiProvider: process.env.AI_PROVIDER || 'openai',
  openaiApiKey: process.env.OPENAI_API_KEY,
  googleApiKey: process.env.GOOGLE_API_KEY,
  uploadLimits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  }
};