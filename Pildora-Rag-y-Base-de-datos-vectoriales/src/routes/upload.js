import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import { FileParserService } from '../services/FileParserService.js';
import { RAGService } from '../services/RAGService.js';
import { config } from '../config/config.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: config.uploadLimits.fileSize },
  fileFilter: (req, file, cb) => {
    if (config.uploadLimits.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Use: .txt, .pdf, .docx'));
    }
  }
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }

    const metadata = {
      original_name: req.file.originalname,
      uploaded_at: new Date().toISOString(),
      ...req.body
    };

    const content = await FileParserService.parseFile(
      req.file.path,
      req.file.mimetype
    );

    const rag = new RAGService();
    const documentIds = await rag.ingestDocument(content, metadata);
    await rag.close();

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'Archivo procesado correctamente',
      document_ids: documentIds,
      chunks_created: documentIds.length,
      metadata
    });
  } catch (error) {
    console.error('Error en upload:', error);
    res.status(500).json({ 
      error: 'Error procesando archivo', 
      details: error.message 
    });
  }
});

export default router;