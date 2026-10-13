const crypto = require('node:crypto');
function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}
function authorized(req) {
  const expected = process.env.ADMIN_PIN;
  const provided = req.headers['x-admin-pin'];
  if (!expected || !provided) return false;
  const a = Buffer.from(String(expected)); const b = Buffer.from(String(provided));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function config() {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const workflow = process.env.GITHUB_WORKFLOW_FILE || 'build-webview.yml';
  if (!owner || !repo || !token) throw new Error('Missing GITHUB_OWNER, GITHUB_REPO, or GITHUB_TOKEN environment variable.');
  return { owner, repo, token, workflow };
}
async function github(path, options = {}) {
  const c = config();
  const response = await fetch(`https://api.github.com/repos/${c.owner}/${c.repo}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${c.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`GitHub API ${response.status}: ${body.slice(0, 500)}`);
  return body ? JSON.parse(body) : {};
}
module.exports = { json, authorized, config, github };
