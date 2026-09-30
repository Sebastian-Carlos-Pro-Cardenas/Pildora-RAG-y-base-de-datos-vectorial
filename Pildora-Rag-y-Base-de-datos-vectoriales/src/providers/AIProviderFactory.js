import OpenAIProvider from './OpenAIProvider.js';
import GeminiProvider from './GeminiProvider.js';

export class AIProviderFactory {
  static createProvider(providerName) {
    switch (providerName.toLowerCase()) {
      case 'openai':
        return new OpenAIProvider();
      case 'gemini':
        return new GeminiProvider();
      default:
        throw new Error(`Proveedor no soportado: ${providerName}`);
    }
  }
}