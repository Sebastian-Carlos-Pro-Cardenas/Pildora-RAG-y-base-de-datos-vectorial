import OpenAI from 'openai';
import { config } from '../config/config.js';

class OpenAIProvider {
  constructor() {
    this.client = new OpenAI({
      apiKey: config.openaiApiKey
    });
    this.name = 'OpenAI';
  }

  async generateEmbedding(text) {
    const response = await this.client.embeddings.create({
      model: "text-embedding-3-small",
      input: text
    });
    return response.data[0].embedding;
  }

  async generateResponse(systemPrompt, userPrompt) {
    const completion = await this.client.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3
    });
    return completion.choices[0].message.content;
  }
}

export default OpenAIProvider;