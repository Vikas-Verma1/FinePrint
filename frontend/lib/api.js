const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class BackendUnavailable extends Error {}

async function post(path, body) {
  let res;
  try {
    res = await fetch(API + path, { method: "POST", body });
  } catch (e) {
    throw new BackendUnavailable("backend unreachable: " + e.message);
  }
  if (!res.ok) {
    let msg = "HTTP " + res.status;
    try { msg = (await res.json()).detail || msg; } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}

function buildForm({ policyFile, recordsFile, denialFile, policyText, recordsText, denialText }) {
  const fd = new FormData();
  if (policyFile) fd.append("policy", policyFile);
  if (recordsFile) fd.append("records", recordsFile);
  if (denialFile) fd.append("denial", denialFile);
  if (policyText) fd.append("policy_text", policyText);
  if (recordsText) fd.append("records_text", recordsText);
  if (denialText) fd.append("denial_text", denialText);
  return fd;
}

export async function analyze(inputs) {
  const data = await post("/api/analyze", buildForm(inputs));
  if (data.job_id) return pollJob(data.job_id);
  return data;
}

export async function appeal(inputs) {
  const data = await post("/api/appeal", buildForm(inputs));
  if (data.job_id) return pollJob(data.job_id);
  return data;
}

export async function pollJob(jobId, { timeoutMs = 120000, intervalMs = 1500 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, intervalMs));
    let res;
    try { res = await fetch(API + "/api/jobs/" + jobId); } catch (e) { throw new BackendUnavailable(e.message); }
    const j = await res.json();
    if (j.status === "done") return j.result;
    if (j.status === "error") throw new Error(j.error || "job failed");
  }
  throw new Error("job timed out");
}

export async function health() {
  const res = await fetch(API + "/api/health", { cache: "no-store" });
  if (!res.ok) throw new Error("health bad");
  return res.json();
}