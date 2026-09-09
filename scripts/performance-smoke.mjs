const api = process.env.VIRA_API_URL || "http://localhost:8080/api/v1";
const requests = Number(process.env.VIRA_PERF_REQUESTS || 40);
const concurrency = Number(process.env.VIRA_PERF_CONCURRENCY || 8);
const tag = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
const email = `perf-${tag}@vira.local`;
const password = "PerfPass@12345";

async function request(path, options = {}) {
  const response = await fetch(`${api}${path}`, { ...options, headers: { "content-type": "application/json", ...(options.headers || {}) } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${response.status} ${path}: ${JSON.stringify(body)}`);
  return body?.data;
}

const auth = await request("/auth/register", { method: "POST", body: JSON.stringify({ fullName: "Performance smoke", email, password }) });
const headers = { Authorization: `Bearer ${auth.accessToken}` };
const workspace = await request("/workspaces", { method: "POST", headers, body: JSON.stringify({ name: `Performance ${tag}`, description: "" }) });
const project = await request(`/workspaces/${workspace.id}/projects`, { method: "POST", headers, body: JSON.stringify({ name: "Search load", projectKey: `P${tag.slice(-8)}`, description: "", projectType: "KANBAN" }) });

let cursor = 0;
const latencies = [];
const failures = [];
async function worker() {
  while (cursor < requests) {
    cursor += 1;
    const started = performance.now();
    try { await request(`/projects/${project.id}/tasks/search?q=smoke&page=0&size=30`, { headers }); }
    catch (error) { failures.push(error.message); }
    latencies.push(performance.now() - started);
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, requests) }, worker));
latencies.sort((a, b) => a - b);
const percentile = (ratio) => latencies[Math.min(latencies.length - 1, Math.ceil(latencies.length * ratio) - 1)] || 0;
const result = { requests, concurrency, failures: failures.length, p50Ms: Math.round(percentile(0.5)), p95Ms: Math.round(percentile(0.95)), maxMs: Math.round(percentile(1)) };
console.log(JSON.stringify(result, null, 2));
if (failures.length || result.p95Ms > 2000) process.exitCode = 1;
