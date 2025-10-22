
// lib/parser.ts
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export async function parseFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  
  if (file.type === 'application/pdf') {
    // pdf-parse expects a Buffer, not an ArrayBuffer
    const data = await pdf(Buffer.from(buffer));
    return data.text;
  }
  
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value;
  }
  
  // Plain text
  return new TextDecoder().decode(buffer);
}
