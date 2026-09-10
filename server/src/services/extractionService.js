import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export const extractionService = {
  /**
   * Extract text from buffer based on mimetype and original filename
   */
  async extractText(buffer, originalname, mimetype) {
    const ext = originalname.split('.').pop().toLowerCase();

    if (mimetype === 'application/pdf' || ext === 'pdf') {
      const data = await pdfParse(buffer);
      return this.cleanText(data.text);
    }

    if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      ext === 'docx'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return this.cleanText(result.value);
    }

    // Default to plain text parsing (utf-8)
    const rawText = buffer.toString('utf-8');
    return this.cleanText(rawText);
  },

  /**
   * Cleans extracted text to remove excessive empty lines and control chars
   */
  cleanText(text) {
    if (!text) return '';
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, '  ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
};
