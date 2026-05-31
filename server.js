const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Groq = require('groq-sdk');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '50mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Health check — Render needs this
app.get('/', (req, res) => {
  res.json({ status: 'CliniqAI server is running' });
});

// Regular chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, system } = req.body;
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1500,
      messages: [
        { role: 'system', content: system },
        ...messages
      ]
    });
    const aiText = response.choices[0]?.message?.content || 'No response.';
    res.json({ content: [{ type: 'text', text: aiText }] });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const { question, system } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const mimeType = file.mimetype;
    const fileName = file.originalname;
    const userQuestion = question?.trim() ||
      'Please provide a comprehensive medical summary and analysis.';

    const systemPrompt = `${system || 'You are CliniqAI, an advanced clinical intelligence assistant.'}

ANALYSIS INSTRUCTIONS:
- Analyze content carefully and thoroughly
- Cross-reference with Harrison's, Robbins, Goodman & Gilman, Gray's Anatomy
- Cross-reference with WHO, CDC, ACC/AHA, IDSA clinical guidelines
- Structure response with ## headers and bullet points
- Highlight key diagnoses, treatments, mechanisms, clinical pearls
- Flag anything contradicting current evidence-based guidelines
- End with educational disclaimer`;

    if (mimeType === 'application/pdf') {
      let extractedText = '';
      let pageCount = 0;
      try {
        const pdfData = await pdfParse(file.buffer, { max: 0 });
        extractedText = pdfData.text || '';
        pageCount = pdfData.numpages || 0;
      } catch (e) {
        console.error('PDF parse error:', e.message);
      }

      if (extractedText) {
        extractedText = extractedText
          .replace(/\r\n/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
          .trim();
      }

      if (extractedText.length > 8000) {
        extractedText = extractedText.substring(0, 8000) +
          '\n\n[Document continues — first section shown]';
      }

      let fileContext = extractedText && extractedText.trim().length > 30
        ? `The user uploaded "${fileName}" (${pageCount} pages).\n\n=== DOCUMENT CONTENT ===\n${extractedText}\n=== END ===\n\nBase analysis on EXACT content above then cross-reference with medical textbooks.`
        : `Scanned PDF "${fileName}" — text not extractable. Use medical knowledge based on filename.`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 2000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${fileContext}\n\nUSER REQUEST: "${userQuestion}"\n\nRespond thoroughly with ## headers.` }
        ]
      });

      const aiText = response.choices[0]?.message?.content || 'No response.';
      return res.json({ content: [{ type: 'text', text: aiText }] });
    }

    if (mimeType.startsWith('image/')) {
      const base64Image = file.buffer.toString('base64');
      const imageUrl = `data:${mimeType};base64,${base64Image}`;

      try {
        const response = await groq.chat.completions.create({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          max_tokens: 2000,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: imageUrl } },
                {
                  type: 'text',
                  text: `Analyze this medical image "${fileName}".\n\nUSER REQUEST: "${userQuestion}"\n\nDescribe findings, provide clinical interpretation, differential diagnoses, and cross-reference with Harrison's and current guidelines.`
                }
              ]
            }
          ]
        });
        const aiText = response.choices[0]?.message?.content || 'No response.';
        return res.json({ content: [{ type: 'text', text: aiText }] });
      } catch (visionError) {
        const fallback = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 1500,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Medical image "${fileName}" uploaded. USER REQUEST: "${userQuestion}". Provide clinical information about what this image type typically shows and what to look for.` }
          ]
        });
        const aiText = fallback.choices[0]?.message?.content || 'No response.';
        return res.json({ content: [{ type: 'text', text: aiText }] });
      }
    }

    return res.status(400).json({ error: 'Only PDF and image files are supported' });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload error: ' + error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`CliniqAI server running on port ${PORT}`);
});