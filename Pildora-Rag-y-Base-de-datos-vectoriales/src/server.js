import express from 'express';
import { config } from './config/config.js';
import { requestLogger, errorHandler } from './middleware/index.js';
import apiRoutes from './routes/api.js';
import uploadRoutes from './routes/upload.js';

const app = express();

// Middlewares
app.use(express.json());
app.use(requestLogger);

// Rutas
app.use('/api', apiRoutes);
app.use('/upload', uploadRoutes);

// Manejador de errores global
app.use(errorHandler);

// Iniciar servidor
app.listen(config.port, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   🚀 Servidor RAG iniciado                 ║
║   📡 Puerto: ${config.port}                          ║
║   🤖 Proveedor: ${config.aiProvider}              ║
╚════════════════════════════════════════════╝

Endpoints disponibles:
  GET  /api/health          - Estado del servidor
  POST /upload             - Subir archivo (.txt, .pdf, .docx)
  POST /api/query          - Hacer pregunta al RAG
  GET  /api/documents      - Listar documentos
  POST /api/search         - Buscar documentos similares
  `);
});