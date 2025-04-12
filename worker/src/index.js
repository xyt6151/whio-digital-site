export default {
  async fetch(request, env, ctx) {
    const originalUrl = new URL(request.url);
    let pathname = originalUrl.pathname;

    // Handle CORS preflight early
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    // Canonicalize root index
    if (pathname === '/index.html' || pathname === '/index') {
      return Response.redirect(`${originalUrl.origin}/`, 301);
    }

    // Remove .html extension
    if (pathname.endsWith('.html')) {
      const cleanPath = pathname.slice(0, -5);
      return Response.redirect(`${originalUrl.origin}${cleanPath}${originalUrl.search}${originalUrl.hash}`, 301);
    }

    // Remove trailing slash (except root)
    if (pathname.endsWith('/') && pathname !== '/') {
      const cleanPath = pathname.slice(0, -1);
      return Response.redirect(`${originalUrl.origin}${cleanPath}${originalUrl.search}${originalUrl.hash}`, 301);
    }

    // API endpoints: pass through
    if (pathname.startsWith('/utils/')) {
      const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
      const { success } = await env.whiodigital_site_ratelimit.limit({ key: clientIP });

      if (!success) {
        return withCors(new Response("Too Many Requests", { status: 429 }));
      }

      if (pathname === '/utils/list-articles') {
        const resp = await handleListArticles(env);
        return withCors(resp);
      }

      return withCors(new Response('Not Found', { status: 404 }));
    }

    // Rewrite clean URLs to .html files
    let rewrittenPath;
    if (pathname === '/') {
      rewrittenPath = '/index.html';
    } else if (/^\/(about|blog|article)$/.test(pathname)) {
      rewrittenPath = `${pathname}.html`;
    } else {
      // Optionally handle 404 here
      rewrittenPath = pathname;
    }

    // Rewrite URL to static asset
    const newUrl = new URL(request.url);
    newUrl.pathname = rewrittenPath;

    // Fetch static file from your origin (GitHub Pages, R2, etc.)
    return fetch(newUrl.toString(), request);
  }
};

async function handleListArticles(env) {
  const owner = 'xyt6151';
  const repo = 'whio-digital-site';
  const branch = 'main';
  const githubToken = env.GITHUB_TOKEN;

  console.log("GitHub token present?", !!githubToken);
  console.log("GitHub token length:", githubToken ? githubToken.length : 0);

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/articles?ref=${branch}`;

  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'whio-site-utils-worker'  // REQUIRED by GitHub API
  };
  if (githubToken) {
    headers['Authorization'] = `token ${githubToken}`;
  }

  try {
    const dirResp = await fetch(apiUrl, { headers, redirect: "follow" });
    const contentType = dirResp.headers.get('content-type') || '';

    console.log("GitHub API status:", dirResp.status);
    console.log("GitHub API content-type:", contentType);

    const text = await dirResp.text();
    console.log("GitHub API response snippet:", text.slice(0, 200));

    if (!dirResp.ok || !contentType.includes('application/json')) {
      return new Response(`GitHub API error: ${dirResp.status}`, { status: 500 });
    }

    let files;
    try {
      files = JSON.parse(text);
    } catch (e) {
      console.log("JSON parse error:", e);
      return new Response(`Worker error: Unexpected response format`, { status: 500 });
    }

    const mdFiles = files.filter(f => f.name.endsWith('.md'));

    const articles = await Promise.all(mdFiles.map(async (file) => {
      try {
        const rawResp = await fetch(file.download_url);
        if (!rawResp.ok) throw new Error('Failed to fetch raw markdown');
        const rawText = await rawResp.text();

        // Extract YAML front matter
        const match = /^---\s*([\s\S]*?)\s*---/.exec(rawText);
        let meta = {};
        if (match) {
          try {
            meta = parseYAML(match[1]);
          } catch (e) {
            console.warn(`YAML parse error in ${file.name}:`, e);
          }
        }

        // Respect 'show' flag (default true)
        const show = meta.show !== 'false';

        return show ? {
          slug: file.name.replace(/\.md$/, ''),
          title: meta.title || file.name,
          description: meta.description || '',
          date: meta.date || '',
          url: file.download_url,
        } : null;
      } catch (e) {
        console.warn(`Error processing ${file.name}:`, e);
        return null;
      }
    }));

    const filtered = articles.filter(Boolean);

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    return new Response(JSON.stringify(filtered, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.log("Worker error:", err);
    return new Response(`Worker error: ${err.message}`, { status: 500 });
  }
}

// Minimal YAML parser (safe, no deps)
function parseYAML(yamlText) {
  const lines = yamlText.split('\n');
  const result = {};
  for (const line of lines) {
    const match = /^(\w+):\s*(.*)$/.exec(line);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      result[key] = value;
    }
  }
  return result;
}

function withCors(response) {
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', '*');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
} 