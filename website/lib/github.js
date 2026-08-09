// GitHub Contents API wrapper — config.json parhne aur update karne ke liye.
// Extension isi file ko fetch karta hai, is liye payment success par yahan likhna hi
// "activation" hai.

const API = 'https://api.github.com';

function cfg() {
  const token = process.env.GH_TOKEN;
  const owner = process.env.GH_OWNER;
  const repo = process.env.GH_REPO;
  const branch = process.env.GH_BRANCH || 'main';
  const path = process.env.GH_CONFIG_PATH || 'config.json';
  if (!token || !owner || !repo) {
    throw new Error('GH_TOKEN / GH_OWNER / GH_REPO env vars set nahi hain');
  }
  return { token, owner, repo, branch, path };
}

async function gh(pathname, options = {}) {
  const { token } = cfg();
  const res = await fetch(`${API}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'vu-prime-payments',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  return res;
}

/** Repo se koi bhi JSON file parhta hai. Return: { data, sha } — file na ho to sha = null. */
export async function readJsonFile(filePath) {
  const { owner, repo, branch } = cfg();
  const res = await gh(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(branch)}`,
    { method: 'GET', cache: 'no-store' }
  );
  if (res.status === 404) return { data: null, sha: null };
  if (!res.ok) throw new Error(`GitHub read failed (${res.status}): ${await res.text()}`);
  const body = await res.json();
  const content = Buffer.from(body.content || '', 'base64').toString('utf8');
  let data = null;
  try {
    data = JSON.parse(content);
  } catch (e) {
    throw new Error(`${filePath} valid JSON nahi hai: ${e.message}`);
  }
  return { data, sha: body.sha };
}

async function writeJsonFile(filePath, data, sha, message) {
  const { owner, repo, branch } = cfg();
  const content = Buffer.from(`${JSON.stringify(data, null, 2)}\n`, 'utf8').toString('base64');
  const res = await gh(`/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`, {
    method: 'PUT',
    body: JSON.stringify({ message, content, branch, ...(sha ? { sha } : {}) }),
  });
  if (res.status === 409 || res.status === 422) {
    const err = new Error('conflict');
    err.conflict = true;
    throw err;
  }
  if (!res.ok) throw new Error(`GitHub write failed (${res.status}): ${await res.text()}`);
  return res.json();
}

/**
 * Read-modify-write with conflict retry. `mutate(data)` ko object milta hai;
 * agar wo `false` return kare to kuch likha nahi jata (already up to date).
 */
export async function updateJsonFile(filePath, mutate, message, { attempts = 4 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    const { data, sha } = await readJsonFile(filePath);
    const next = await mutate(data, sha);
    if (next === false) return { skipped: true };
    try {
      await writeJsonFile(filePath, next, sha, message);
      return { skipped: false, data: next };
    } catch (e) {
      if (!e.conflict) throw e;
      lastErr = e;
      // Koi aur commit beech mein aa gaya — thoda ruk kar dobara parho.
      await new Promise((r) => setTimeout(r, 250 * 2 ** i));
    }
  }
  throw lastErr || new Error('config.json update nahi ho saka');
}

export function configPath() {
  return cfg().path;
}

export function ordersPath() {
  return process.env.GH_ORDERS_PATH || 'processed-orders.json';
}

/** Raw (CDN-free) config — status endpoint ke liye kaafi hai. */
export async function readConfig() {
  return readJsonFile(configPath());
}
