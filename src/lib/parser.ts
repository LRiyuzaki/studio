// lib/parser.ts

export async function parseFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  
  if (file.type === 'application/pdf') {
    // Dynamically import to prevent server-side bundling issues
    const { default: pdf } = await import('pdf-parse');
    const data = await pdf(Buffer.from(buffer));
    return data.text;
  }
  
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    // Dynamically import to prevent server-side bundling issues
    const { default: mammoth } = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value;
  }
  
  // Plain text
  return new TextDecoder().decode(buffer);
}
