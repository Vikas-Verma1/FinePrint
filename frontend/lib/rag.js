// Splits saved policy text into clause chunks and retrieves the most relevant ones.
export function chunkPolicy(text) {
  const chunks = [];
  let ref = "§1";
  let buf = [];
  for (const line of (text || "").split(/\r?\n/)) {
    const m = line.match(/§?\s?(\d+(?:\.\d+)*[a-z]?)[.)\s]/);
    if (m && line.trim().length < 120) {
      if (buf.join(" ").trim()) chunks.push({ ref, text: buf.join(" ") });
      ref = "§" + m[1];
      buf = [line];
    } else {
      buf.push(line);
    }
    if (buf.join(" ").length > 900) {
      chunks.push({ ref, text: buf.join(" ") });
      buf = [];
    }
  }
  if (buf.join(" ").trim()) chunks.push({ ref, text: buf.join(" ") });
  return chunks.slice(0, 400);
}

const STOP = ["the","and","for","with","what","does","my","policy","there","this","that","have","has","is","are","you","your","any","in","of","to"];

export function retrieve(chunks, question, topK = 4) {
  const words = (question.toLowerCase().match(/[a-z]{3,}/g) || []).filter((w) => !STOP.includes(w));
  return chunks
    .map((c) => {
      const low = c.text.toLowerCase();
      let s = 0;
      for (const w of words) if (low.includes(w)) s++;
      return { ...c, s };
    })
    .filter((c) => c.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, topK);
}