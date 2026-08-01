const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function typeLines(el, lines, progEl) {
  if (!el) return;
  el.innerHTML = "";
  const cursor = document.createElement("span");
  cursor.className = "cursor";
  for (let i = 0; i < lines.length; i++) {
    let text = lines[i];
    const div = document.createElement("div");
    div.className = "log-line" + (text.startsWith("!") ? " bad" : text.includes("✓") ? " info" : "");
    if (text.startsWith("!")) text = "⚠ " + text.slice(2);
    el.appendChild(div);
    el.appendChild(cursor);
    for (let c = 0; c <= text.length; c++) {
      div.textContent = text.slice(0, c);
      await sleep(7);
    }
    if (progEl) progEl.style.width = Math.round(((i + 1) / lines.length) * 100) + "%";
    await sleep(200);
  }
  cursor.remove();
}