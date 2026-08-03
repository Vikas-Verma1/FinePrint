// frontend/lib/extractText.js
// Client-side text extraction for uploaded files (frontend-only).

export async function extractFileText(file) {
  const name = (file?.name || "").toLowerCase();

  if (name.endsWith(".txt") || name.endsWith(".md")) {
    try {
      return await file.text();
    } catch {
      return "";
    }
  }

  if (name.endsWith(".pdf")) {
    return await extractPdfText(file);
  }

  // Images need OCR (backend). Chat will fall back to the analysis report.
  return "";
}

async function extractPdfText(file) {
  try {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc =
      "https://unpkg.com/pdfjs-dist@" + pdfjs.version + "/build/pdf.worker.min.mjs";

    const data = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data }).promise;

    const maxPages = Math.min(pdf.numPages, 60);
    let text = "";
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((it) => it.str).join(" ") + "\n";
    }
    return text;
  } catch (e) {
    console.warn("Client PDF extraction failed:", e);
    return "";
  }
}