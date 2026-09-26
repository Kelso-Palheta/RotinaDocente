let _pdfjsLib = null;
let _tesseract = null;

async function getPdfjsLib() {
  if (_pdfjsLib) return _pdfjsLib;
  _pdfjsLib = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs');
  _pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(
    new Blob([worker.default || ''], { type: 'text/javascript' })
  );
  return _pdfjsLib;
}

async function getTesseract() {
  if (_tesseract) return _tesseract;
  _tesseract = await import('tesseract.js');
  return _tesseract.default || _tesseract;
}

export async function extractTextFromPDF(file) {
  if (typeof window === 'undefined') return '';
  const pdfjsLib = await getPdfjsLib();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  
  const parts = [];
  let totalChars = 0;

  // Primeiro, tenta extração direta de texto (PDFs gerados digitalmente)
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str).join(' ').replace(/\s+/g, ' ').trim();
    if (text) {
      parts.push(text);
      totalChars += text.length;
    }
  }

  // Se o texto extraído for muito curto (provavelmente PDF escaneado com imagens)
  if (totalChars < 50) {
    console.log("PDF parece ser escaneado. Iniciando pipeline de OCR com Tesseract.js...");
    const tesseract = await getTesseract();
    parts.length = 0; // Limpar partes extraídas

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 }); // Escala maior para melhor precisão do OCR
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;

      // Executa OCR na imagem renderizada (focado em português)
      const { data: { text } } = await tesseract.recognize(canvas, 'por', {
        logger: m => {
          if(m.status === 'recognizing text') {
             console.log(`OCR Página ${i}/${pdf.numPages}: ${(m.progress * 100).toFixed(2)}%`);
          }
        }
      });

      if (text) parts.push(text.trim());
    }
  }

  return parts.join('\n\n');
}

export async function extractTextFromImage(fileOrBlobOrDataUrl) {
  if (typeof window === 'undefined') return '';
  const tesseract = await getTesseract();
  
  // Executa OCR diretamente na fonte de imagem (focado em português)
  const { data: { text } } = await tesseract.recognize(fileOrBlobOrDataUrl, 'por', {
    logger: m => {
      if(m.status === 'recognizing text') {
         console.log(`OCR Imagem: ${(m.progress * 100).toFixed(2)}%`);
      }
    }
  });

  return text ? text.trim() : '';
}

