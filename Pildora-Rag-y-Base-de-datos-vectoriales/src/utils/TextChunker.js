export class TextChunker {
  static chunkText(text, chunkSize = 200, overlap = 30) {
    const chunks = [];
    
    const lines = text.split('\n');
    let currentChunk = [];
    let wordCount = 0;
    
    for (const line of lines) {
      const lineWords = line.trim().split(' ').filter(w => w.length > 0);
      
      if (wordCount + lineWords.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n'));
        
        const overlapLines = currentChunk.slice(-Math.ceil(overlap / 10));
        currentChunk = overlapLines;
        wordCount = overlapLines.join(' ').split(' ').length;
      }
      
      currentChunk.push(line);
      wordCount += lineWords.length;
    }
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n'));
    }
    
    return chunks.filter(chunk => chunk.trim().length > 0);
  }
}