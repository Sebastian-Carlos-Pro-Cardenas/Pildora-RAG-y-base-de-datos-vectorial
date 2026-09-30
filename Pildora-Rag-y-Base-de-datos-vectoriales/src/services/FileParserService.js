import fs from 'fs';
import mammoth from 'mammoth';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export class FileParserService {
  static async parseFile(filePath, mimeType) {
    switch (mimeType) {
      case 'text/plain':
        return this.parseText(filePath);
      case 'application/pdf':
        return this.parsePDF(filePath);
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return this.parseDOCX(filePath);
      default:
        throw new Error(`Tipo de archivo no soportado: ${mimeType}`);
    }
  }

  static async parseText(filePath) {
    return fs.readFileSync(filePath, 'utf-8');
  }

  static async parsePDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  }

  static async parseDOCX(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
}