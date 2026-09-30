import { GoogleGenAI } from '@google/genai';
import { config } from '../config/config.js';

class GeminiProvider {
  constructor() {
    this.client = new GoogleGenAI(config.googleApiKey);
    this.name = 'Gemini';
  }

  async generateEmbedding(text) {
    const result = await this.client.models.embedContent({
      model: 'gemini-embedding-001',
      contents: [text],
      config: {
        outputDimensionality: 1536
      }
    });
    return result.embeddings[0].values;
  }

  async generateResponse(systemPrompt, userPrompt) {
    const result = await this.client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
      },
    });
    return result.text;
  }
}

export default GeminiProvider;