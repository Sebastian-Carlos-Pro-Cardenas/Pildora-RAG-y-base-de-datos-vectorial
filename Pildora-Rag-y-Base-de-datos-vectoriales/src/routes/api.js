import { Router } from 'express';
import { RAGService } from '../services/RAGService.js';
import { config } from '../config/config.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    provider: config.aiProvider,
    timestamp: new Date().toISOString() 
  });
});

router.post('/query', async (req, res) => {
  try {
    const { question, context_limit } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Se requiere el campo "question"' });
    }

    const rag = new RAGService();
    const result = await rag.query(question, context_limit || 3);
    await rag.close();

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error en /query:', error);
    res.status(500).json({ 
      error: 'Error procesando consulta', 
      details: error.message 
    });
  }
});

router.get('/documents', async (req, res) => {
  try {
    const rag = new RAGService();
    const documents = await rag.listDocuments();
    await rag.close();

    res.json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    console.error('Error en /documents:', error);
    res.status(500).json({ 
      error: 'Error listando documentos', 
      details: error.message 
    });
  }
});

router.post('/search', async (req, res) => {
  try {
    const { query, limit } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Se requiere el campo "query"' });
    }

    const rag = new RAGService();
    const results = await rag.searchSimilarDocuments(query, limit || 5);
    await rag.close();

    res.json({
      success: true,
      count: results.length,
      results
    });
  } catch (error) {
    console.error('Error en /search:', error);
    res.status(500).json({ 
      error: 'Error en búsqueda', 
      details: error.message 
    });
  }
});

router.post('/debug/similarity', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Se requiere el campo "query"' });
    }

    const rag = new RAGService();
    
    const queryEmbedding = await rag.generateEmbedding(query);
    const vectorString = `[${queryEmbedding.join(',')}]`;
    
    const client = await rag.pool.connect();
    
    const result = await client.query(
      `SELECT 
        id,
        LEFT(content, 200) as preview,
        metadata,
        1 - (embedding <=> $1::vector) as similarity
       FROM documents
       WHERE embedding IS NOT NULL
       ORDER BY similarity DESC`,
      [vectorString]
    );
    
    client.release();
    await rag.close();

    res.json({
      success: true,
      query: query,
      total_documents: result.rows.length,
      results: result.rows.map((row, idx) => ({
        rank: idx + 1,
        id: row.id,
        similarity: row.similarity,
        similarity_percent: `${(row.similarity * 100).toFixed(2)}%`,
        preview: row.preview,
        metadata: row.metadata
      }))
    });
  } catch (error) {
    console.error('Error en /debug/similarity:', error);
    res.status(500).json({ 
      error: 'Error calculando similitud', 
      details: error.message 
    });
  }
});

export default router;