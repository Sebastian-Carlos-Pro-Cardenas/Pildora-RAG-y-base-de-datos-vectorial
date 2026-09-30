import { TextChunker } from '../utils/TextChunker.js';
import createPool from '../config/database.js';
import { AIProviderFactory } from '../providers/AIProviderFactory.js';

export class RAGService {
  constructor(providerName = process.env.AI_PROVIDER || 'openai') {
    this.pool = createPool();
    this.aiProvider = AIProviderFactory.createProvider(providerName);
    console.log(`🤖 Usando proveedor: ${this.aiProvider.name}`);
  }

  async generateEmbedding(text) {
    try {
      return await this.aiProvider.generateEmbedding(text);
    } catch (error) {
      console.error('Error generando embedding:', error);
      throw error;
    }
  }

  async ingestDocument(content, metadata = {}) {
    const client = await this.pool.connect();
    
    try {
      const chunks = TextChunker.chunkText(content);
      console.log(`📄 Procesando ${chunks.length} chunks...`);
      
      const insertedIds = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`  Procesando chunk ${i + 1}/${chunks.length}...`);
        
        const embedding = await this.generateEmbedding(chunk);
        const vectorString = `[${embedding.join(',')}]`;
        
        const result = await client.query(
          `INSERT INTO documents (content, metadata, embedding) 
           VALUES ($1, $2, $3::vector)
           RETURNING id`,
          [chunk, JSON.stringify({ ...metadata, chunk_index: i }), vectorString]
        );
        
        insertedIds.push(result.rows[0].id);
      }
      
      console.log('✅ Documento ingresado correctamente');
      return insertedIds;
    } catch (error) {
      console.error('❌ Error ingresando documento:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async searchSimilarDocuments(query, limit = 5, minSimilarity = 0.3) {
    const client = await this.pool.connect();
    
    try {
      console.log(`🔍 Generando embedding para query: "${query.substring(0, 50)}..."`);
      const queryEmbedding = await this.generateEmbedding(query);
      
      const countResult = await client.query('SELECT COUNT(*) FROM documents');
      if (countResult.rows[0].count === '0') {
        return [];
      }
      
      const vectorString = `[${queryEmbedding.join(',')}]`;
      
      const vectorResult = await client.query(
        `SELECT 
          id,
          content,
          metadata,
          1 - (embedding <=> $1::vector) as similarity,
          'vector' as search_type
         FROM documents
         WHERE embedding IS NOT NULL
         ORDER BY similarity DESC
         LIMIT $2`,
        [vectorString, limit]
      );
      
      const textResult = await client.query(
        `SELECT 
          id,
          content,
          metadata,
          0.8 as similarity,
          'text' as search_type
         FROM documents
         WHERE content ILIKE $1
         LIMIT $2`,
        [`%${query}%`, Math.ceil(limit / 2)]
      );
      
      const combinedMap = new Map();
      
      [...vectorResult.rows, ...textResult.rows].forEach(row => {
        if (!combinedMap.has(row.id)) {
          combinedMap.set(row.id, row);
        } else {
          const existing = combinedMap.get(row.id);
          if (row.similarity > existing.similarity) {
            combinedMap.set(row.id, row);
          }
        }
      });
      
      const combined = Array.from(combinedMap.values())
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
      
      return combined.filter(row => row.similarity >= minSimilarity);
    } catch (error) {
      console.error('❌ Error buscando documentos:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async query(question, contextLimit = 3) {
    try {
      const relevantDocs = await this.searchSimilarDocuments(question, contextLimit);
      
      if (relevantDocs.length === 0) {
        return {
          answer: "No encontré información relevante en la base de conocimiento.",
          sources: [],
          provider: this.aiProvider.name
        };
      }
      
      const context = relevantDocs
        .map((doc, i) => `[${i + 1}] ${doc.content}`)
        .join('\n\n');
      
      const systemPrompt = `Eres un asistente útil. Responde la pregunta del usuario basándote ÚNICAMENTE en el contexto proporcionado. No des información personal como número de documento o nombre completo. Si la información no está en el contexto, di que no lo sabes.`;
      const userPrompt = `Contexto:\n${context}\n\nPregunta: ${question}`;
      
      const answer = await this.aiProvider.generateResponse(systemPrompt, userPrompt);
      
      return {
        answer,
        provider: this.aiProvider.name
      };
    } catch (error) {
      console.error('Error en query RAG:', error);
      throw error;
    }
  }

  async listDocuments() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT id, metadata, created_at, 
         LEFT(content, 100) as preview
         FROM documents 
         ORDER BY created_at DESC`
      );
      return result.rows;
    } catch (error) {
      console.error('Error listando documentos:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}