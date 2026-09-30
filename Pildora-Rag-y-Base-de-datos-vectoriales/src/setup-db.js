import dotenv from 'dotenv';
import createPool from './config/database.js';

dotenv.config();

async function setupDatabase() {
  const pool = createPool();
  
  try {
    console.log('🔧 Configurando base de datos...');
    
    // Crear extensión vector si no existe
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS vector;
    `);
    console.log('✅ Extensión vector configurada');
    
    // Crear tabla documents si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        metadata JSONB,
        embedding vector(1536),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla documents creada/verificada');

    // Crear índice para búsqueda por similitud si no existe
    await pool.query(`
      CREATE INDEX IF NOT EXISTS documents_embedding_index 
      ON documents 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `);
    console.log('✅ Índice de embeddings creado/verificado');

    // Crear índice para búsqueda por texto si no existe
    await pool.query(`
      CREATE INDEX IF NOT EXISTS documents_content_index 
      ON documents 
      USING gin(to_tsvector('spanish', content));
    `);
    console.log('✅ Índice de texto creado/verificado');

    console.log('✨ Base de datos configurada correctamente');
  } catch (error) {
    console.error('❌ Error configurando base de datos:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Ejecutar setup
setupDatabase().catch(console.error);