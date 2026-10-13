const { json, authorized, config, github } = require('./_lib');
const SAFE_PACKAGE = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*){1,5}$/;
module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Use POST.' });
  if (!authorized(req)) return json(res, 401, { error: 'Unauthorized. Check your admin PIN.' });
  try {
    const { appName, packageName, startUrl, orientation = 'portrait' } = req.body || {};
    if (typeof appName !== 'string' || appName.trim().length < 2 || appName.trim().length > 40)
      return json(res, 400, { error: 'App name must be 2–40 characters.' });
    if (typeof packageName !== 'string' || !SAFE_PACKAGE.test(packageName) || packageName.length > 180)
      return json(res, 400, { error: 'Use a valid package ID, e.g. com.example.myapp.' });
    let parsed;
    try { parsed = new URL(startUrl); } catch { return json(res, 400, { error: 'Enter a valid HTTPS website URL.' }); }
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password)
      return json(res, 400, { error: 'Only HTTPS URLs without embedded credentials are allowed.' });
    if (!['portrait', 'landscape', 'auto'].includes(orientation))
      return json(res, 400, { error: 'Invalid orientation.' });
    const c = config();
    await github(`/actions/workflows/${encodeURIComponent(c.workflow)}/dispatches`, {
      method: 'POST', body: JSON.stringify({ ref: process.env.GITHUB_BRANCH || 'main', inputs: {
        app_name: appName.trim(), package_name: packageName, start_url: parsed.toString(), orientation
      }})
    });
    return json(res, 202, { status: 'submitted', message: 'GitHub Actions accepted the build request. Check Build Status in a few seconds.' });
  } catch (e) {
    return json(res, 502, { error: e.message || 'Could not submit build.' });
  }
};
