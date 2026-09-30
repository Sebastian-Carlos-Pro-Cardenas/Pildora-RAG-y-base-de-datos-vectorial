# RAG API Service

Sistema de Recuperación Aumentada de Generación (RAG) que permite procesar documentos y realizar consultas sobre ellos utilizando IA.

## Estructura del Proyecto

```
/src
  /config          # Configuraciones del proyecto
    config.js      # Configuración general
    database.js    # Configuración de la base de datos
  /middleware      # Middlewares de Express
    index.js       # Logging y manejo de errores
  /providers       # Proveedores de IA
    AIProviderFactory.js  # Factory para crear proveedores
    GeminiProvider.js     # Implementación de Google Gemini
    OpenAIProvider.js     # Implementación de OpenAI
  /routes          # Rutas de la API
    api.js         # Rutas principales
    upload.js      # Rutas de carga de archivos
  /services        # Servicios principales
    FileParserService.js  # Procesamiento de archivos
    RAGService.js         # Lógica principal RAG
  /utils           # Utilidades
    TextChunker.js        # División de texto en chunks
  server.js        # Punto de entrada
  setup-db.js      # Script de configuración de BD
```

## Requisitos

- Node.js v18 o superior
- PostgreSQL 15 o superior con extensión `vector` instalada
- API keys de OpenAI o Google Gemini

## Configuración

1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Crear archivo `.env` en la raíz:
   ```env
   PORT=3000
   AI_PROVIDER=openai    # o 'gemini'
   OPENAI_API_KEY=tu_clave_de_openai
   GOOGLE_API_KEY=tu_clave_de_google
   DATABASE_URL=postgres://usuario:contraseña@localhost:5432/nombre_db
   ```
4. Configurar la base de datos:
   ```bash
   npm run setup
   ```

## Uso

### Iniciar el servidor

```bash
npm start        # Modo producción
npm run dev      # Modo desarrollo con hot-reload
```

### Endpoints

#### 1. Health Check

```http
GET /api/health
```

#### 2. Subir Documento

```http
POST /upload
Content-Type: multipart/form-data

file: <archivo>
metadata: <json opcional>
```

Formatos soportados: `.txt`, `.pdf`, `.docx`

#### 3. Consultar (RAG)

```http
POST /api/query
Content-Type: application/json

{
  "question": "tu pregunta aquí",
  "context_limit": 3    // opcional, default: 3
}
```

#### 4. Listar Documentos

```http
GET /api/documents
```

#### 5. Búsqueda Semántica

```http
POST /api/search
Content-Type: application/json

{
  "query": "texto a buscar",
  "limit": 5    // opcional, default: 5
}
```

## Características

- Procesamiento de múltiples tipos de documentos
- Soporte para múltiples proveedores de IA (OpenAI, Google Gemini)
- Búsqueda semántica y por texto
- División inteligente de documentos
- Manejo de metadatos
- Índices optimizados para búsqueda

## Licencia

MIT

Proyecto RAG modular usando PostgreSQL (pgvector) y múltiples proveedores de IA.

## Cómo funcionan los embeddings

- El servicio genera embeddings usando el proveedor configurado (OpenAI por defecto).
- Para almacenar los embeddings en PostgreSQL con `pgvector`, convertimos el array de números en una cadena con formato `[v1,v2,...]` y la insertamos con `... $3::vector`.
- En las búsquedas, se convierten los embeddings de la consulta al mismo formato y se utiliza la operación `<=>` para distancia, y `1 - (embedding <=> query)` para obtener una medida de similitud.

## Notas y recomendaciones

- Verifica que la dimensión del vector que genera tu proveedor coincide con `vector(1536)` usado en `setup-db.js`. Si usas otro modelo de embeddings, ajusta la dimensión en la definición de tabla.
- Si la inserción falla por formato del vector, revisa la versión de `pg` y la configuración del driver para soportar `pgvector`. En algunos entornos es necesario usar `pgvector` como extensión y/o adaptar la forma de pasar parámetros.
- Para pruebas rápidas, usa OpenAI con un modelo de embeddings compatible (p. ej. text-embedding-3-small) y prueba con pequeños archivos `.txt`.

## Siguientes pasos posibles

- Añadir pruebas unitarias (Jest) y mocks para los proveedores.
- Mejorar chunking (por caracteres o por oraciones) para chunks más naturales.
- Añadir control de versiones y metadatos más detallados para los documentos.
