const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');

const PORT = 4321;
const ROOT = __dirname;
const INDEX_PATH = process.env.BYJDG_INDEX_PATH || path.join(ROOT, 'index.html');
const IMAGES_DIR = path.join(path.dirname(INDEX_PATH), 'images');
const BACKUPS_DIR = path.join(ROOT, 'backups');

function readIndex() {
  return fs.readFileSync(INDEX_PATH, 'utf8');
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function unescapeHtml(value = '') {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

function matchOne(html, regex, fallback = '') {
  const match = html.match(regex);
  return match ? unescapeHtml(match[1].trim()) : fallback;
}

function extractAttr(tag = '', attr = 'href') {
  const match = tag.match(new RegExp(`${attr}=["']([^"']*)["']`, 'i'));
  return match ? match[1] : '';
}

function parseContent(html) {
  const heroBg = matchOne(html, /\.hero\s*\{[\s\S]*?url\(['"]?([^'")]+)['"]?\) center\/cover no-repeat;/i, 'images/hero-image.jpg');
  const heroBlock = matchOne(html, /<section class="hero">([\s\S]*?)<\/section>/i, '');
  const heroButton = heroBlock.match(/<a class="button"([^>]*)>[\s\S]*?<span class="play">[\s\S]*?<\/span>\s*([^<]+)\s*<\/a>/i);
  const latestHeader = matchOne(html, /<h2 class="section-title">([\s\S]*?)<\/h2>/i, 'Latest Films');
  const latestLinkTag = html.match(/<a class="small-link" href="([^"]*)"[^>]*>\s*([^<]*View All Episodes[^<]*)\s*<\/a>/i);

  const episodeMatches = [...html.matchAll(/<article class="film-card" style="--image: url\(['"]([^'"]+)['"]\);">[\s\S]*?<div class="episode">([\s\S]*?)<\/div>[\s\S]*?<h3>([\s\S]*?)<\/h3>[\s\S]*?<p>([\s\S]*?)<\/p>[\s\S]*?<a class="watch-link" href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/article>/gi)];

  const gearItems = [...html.matchAll(/<li><span>([\s\S]*?)<\/span><span>([\s\S]*?)<\/span><\/li>/gi)].map(m => ({
    label: unescapeHtml(m[1].trim()),
    value: unescapeHtml(m[2].trim())
  }));

  const footerLinks = [...html.matchAll(/<a href="([^"]*)"(?: target="_blank" rel="noopener")?>(YouTube|Instagram|Email|Privacy)<\/a>/gi)].map(m => ({
    label: m[2],
    href: m[1]
  }));

  return {
    filePath: INDEX_PATH,
    hero: {
      image: heroBg,
      eyebrow: matchOne(heroBlock, /<div class="eyebrow">([\s\S]*?)<\/div>/i, 'Cinematic Visual Journal'),
      title: matchOne(heroBlock, /<h1>([\s\S]*?)<\/h1>/i, 'ByJDG'),
      subtitle: matchOne(heroBlock, /<p class="hero-subtitle">([\s\S]*?)<\/p>/i, 'Quiet stories in motion.'),
      buttonText: heroButton ? unescapeHtml(heroButton[2].trim()) : 'Watch Latest Film',
      buttonHref: heroButton ? extractAttr(heroButton[1], 'href') : ''
    },
    latest: {
      title: latestHeader,
      viewAllText: latestLinkTag ? unescapeHtml(latestLinkTag[2].trim()) : 'View All Episodes →',
      viewAllHref: latestLinkTag ? latestLinkTag[1] : 'https://www.youtube.com/@by-jdg'
    },
    episodes: episodeMatches.map(m => ({
      image: m[1],
      eyebrow: unescapeHtml(m[2].trim()),
      title: unescapeHtml(m[3].trim()),
      text: unescapeHtml(m[4].trim()),
      href: m[5],
      cta: unescapeHtml(m[6].trim())
    })),
    about: {
      title: matchOne(html, /<div class="about-panel"[\s\S]*?<h2>([\s\S]*?)<\/h2>/i, 'About'),
      lead: matchOne(html, /<div class="about-panel"[\s\S]*?<p class="lead">([\s\S]*?)<\/p>/i, ''),
      text: matchOne(html, /<div class="about-panel"[\s\S]*?<p class="lead">[\s\S]*?<\/p>\s*<p>([\s\S]*?)<\/p>/i, ''),
      cta: matchOne(html, /<div class="about-panel"[\s\S]*?<a class="small-link" href="[^"]*">([\s\S]*?)<\/a>/i, 'Watch the Journey →'),
      href: matchOne(html, /<div class="about-panel"[\s\S]*?<a class="small-link" href="([^"]*)">/i, '#latest')
    },
    gear: {
      title: matchOne(html, /<div class="gear-panel"[\s\S]*?<h2>([\s\S]*?)<\/h2>/i, 'Gear'),
      items: gearItems,
      cta: matchOne(html, /<div class="gear-panel"[\s\S]*?<a class="small-link" href="[^"]*">([\s\S]*?)<\/a>/i, 'View Full Gear List →'),
      href: matchOne(html, /<div class="gear-panel"[\s\S]*?<a class="small-link" href="([^"]*)">/i, '#contact')
    },
    contact: {
      title: matchOne(html, /<section class="contact"[\s\S]*?<h2>([\s\S]*?)<\/h2>/i, ''),
      text: matchOne(html, /<section class="contact"[\s\S]*?<p>([\s\S]*?)<\/p>/i, '')
    },
    footer: {
      brand: matchOne(html, /<div class="footer-brand">([\s\S]*?)<\/div>/i, 'ByJDG'),
      copyright: matchOne(html, /<footer class="footer">[\s\S]*?<div class="footer-brand">[\s\S]*?<\/div>\s*<div>([\s\S]*?)<\/div>/i, '© 2026 ByJDG. All rights reserved.'),
      links: footerLinks
    }
  };
}

function episodeHtml(ep) {
  return `          <article class="film-card" style="--image: url('${escapeHtml(ep.image)}');">
            <div class="film-content">
              <div class="episode">${escapeHtml(ep.eyebrow)}</div>
              <h3>${escapeHtml(ep.title)}</h3>
              <p>${escapeHtml(ep.text)}</p>
              <a class="watch-link" href="${escapeHtml(ep.href)}" target="_blank" rel="noopener">${escapeHtml(ep.cta || 'Watch Film →')}</a>
            </div>
          </article>`;
}

function gearHtml(item) {
  return `            <li><span>${escapeHtml(item.label)}</span><span>${escapeHtml(item.value)}</span></li>`;
}

function footerLinkHtml(link) {
  const href = escapeHtml(link.href);
  const label = escapeHtml(link.label);
  const external = href.startsWith('http') ? ' target="_blank" rel="noopener"' : '';
  return `        <a href="${href}"${external}>${label}</a>`;
}

function updateHtml(data) {
  let html = readIndex();

  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }

  const backupPath = path.join(BACKUPS_DIR, `index.backup-${Date.now()}.html`);
  fs.copyFileSync(INDEX_PATH, backupPath);

  html = html.replace(/url\(['"]?images\/hero-image\.jpg['"]?\) center\/cover no-repeat;/i, `url('${data.hero.image}') center/cover no-repeat;`);
  html = html.replace(/(<section class="hero">[\s\S]*?<div class="eyebrow">)([\s\S]*?)(<\/div>)/i, `$1${escapeHtml(data.hero.eyebrow)}$3`);
  html = html.replace(/(<section class="hero">[\s\S]*?<h1>)([\s\S]*?)(<\/h1>)/i, `$1${escapeHtml(data.hero.title)}$3`);
  html = html.replace(/(<p class="hero-subtitle">)([\s\S]*?)(<\/p>)/i, `$1${escapeHtml(data.hero.subtitle)}$3`);
  html = html.replace(/(<a class="button" href=")[^"]*(" target="_blank" rel="noopener">[\s\S]*?<span class="play">▶<\/span>\s*)([^<]+)(\s*<\/a>)/i, `$1${escapeHtml(data.hero.buttonHref)}$2${escapeHtml(data.hero.buttonText)}$4`);

  html = html.replace(/(<h2 class="section-title">)([\s\S]*?)(<\/h2>)/i, `$1${escapeHtml(data.latest.title)}$3`);
  html = html.replace(/<a class="small-link" href="[^"]*" target="_blank" rel="noopener">\s*[^<]*View All Episodes[^<]*\s*<\/a>/i, `<a class="small-link" href="${escapeHtml(data.latest.viewAllHref)}" target="_blank" rel="noopener">${escapeHtml(data.latest.viewAllText)}</a>`);

  const episodesBlock = data.episodes.map(episodeHtml).join('\n\n');
  html = html.replace(/<div class="film-grid">[\s\S]*?<\/div>\s*<\/section>/i, `<div class="film-grid">\n${episodesBlock}\n        </div>\n      </section>`);

  html = html.replace(/(<div class="about-panel" id="about">\s*<h2>)([\s\S]*?)(<\/h2>)/i, `$1${escapeHtml(data.about.title)}$3`);
  html = html.replace(/(<p class="lead">)([\s\S]*?)(<\/p>)/i, `$1${escapeHtml(data.about.lead)}$3`);
  html = html.replace(/(<div class="about-panel"[\s\S]*?<p class="lead">[\s\S]*?<\/p>\s*<p>)([\s\S]*?)(<\/p>)/i, `$1${escapeHtml(data.about.text)}$3`);
  html = html.replace(/(<div class="about-panel"[\s\S]*?<a class="small-link" href=")[^"]*(">)([\s\S]*?)(<\/a>)/i, `$1${escapeHtml(data.about.href)}$2${escapeHtml(data.about.cta)}$4`);

  html = html.replace(/(<div class="gear-panel" id="gear">\s*<h2>)([\s\S]*?)(<\/h2>)/i, `$1${escapeHtml(data.gear.title)}$3`);
  html = html.replace(/<ul class="gear-list">[\s\S]*?<\/ul>/i, `<ul class="gear-list">\n${data.gear.items.map(gearHtml).join('\n')}\n          </ul>`);
  html = html.replace(/(<div class="gear-panel"[\s\S]*?<a class="small-link" href=")[^"]*(">)([\s\S]*?)(<\/a>)/i, `$1${escapeHtml(data.gear.href)}$2${escapeHtml(data.gear.cta)}$4`);

  html = html.replace(/(<section class="contact" id="contact">[\s\S]*?<h2>)([\s\S]*?)(<\/h2>)/i, `$1${escapeHtml(data.contact.title)}$3`);
  html = html.replace(/(<section class="contact" id="contact">[\s\S]*?<h2>[\s\S]*?<\/h2>\s*<p>)([\s\S]*?)(<\/p>)/i, `$1${escapeHtml(data.contact.text)}$3`);

  html = html.replace(/(<div class="footer-brand">)([\s\S]*?)(<\/div>)/i, `$1${escapeHtml(data.footer.brand)}$3`);
  html = html.replace(/(<footer class="footer">[\s\S]*?<div class="footer-brand">[\s\S]*?<\/div>\s*<div>)([\s\S]*?)(<\/div>)/i, `$1${escapeHtml(data.footer.copyright)}$3`);
  html = html.replace(/<div class="footer-links">[\s\S]*?<\/div>\s*<\/footer>/i, `<div class="footer-links">\n${data.footer.links.map(footerLinkHtml).join('\n')}\n      </div>\n    </footer>`);

  fs.writeFileSync(INDEX_PATH, html, 'utf8');
  return { ok: true, backupPath, filePath: INDEX_PATH };
}

function publishToGit() {
  return new Promise((resolve) => {
    exec(
      'git add . && git commit -m "Website update from CMS" && git push',
      { cwd: ROOT },
      (error, stdout, stderr) => {
        const output = `${stdout || ''}\n${stderr || ''}`.trim();

        if (
          output.includes('nothing to commit') ||
          output.includes('working tree clean')
        ) {
          resolve({
            ok: true,
            message: 'No new changes to publish.',
            output
          });
          return;
        }

        if (error) {
          resolve({
            ok: false,
            error: output || error.message
          });
          return;
        }

        resolve({
          ok: true,
          message: 'Website published successfully.',
          output
        });
      }
    );
  });
}

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(type === 'application/json' ? JSON.stringify(body, null, 2) : body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/') {
      send(res, 200, fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8'), 'text/html');
      return;
    }

    if (req.method === 'GET' && req.url === '/preview') {
      send(res, 200, readIndex(), 'text/html');
      return;
    }

    if (req.method === 'GET' && req.url === '/api/content') {
      send(res, 200, parseContent(readIndex()));
      return;
    }

    if (req.method === 'POST' && req.url === '/api/save') {
      const data = JSON.parse(await readBody(req));
      send(res, 200, updateHtml(data));
      return;
    }

    if (req.method === 'POST' && req.url === '/api/publish') {
      const result = await publishToGit();
      send(res, result.ok ? 200 : 500, result);
      return;
    }

    if (req.method === 'POST' && req.url === '/api/upload') {
      const data = JSON.parse(await readBody(req));
      if (!data.filename || !data.base64) throw new Error('Missing filename or image data.');
      if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
      const ext = path.extname(data.filename).toLowerCase() || '.jpg';
      const safeBase = path.basename(data.filename, ext).replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
      const filename = `${safeBase}-${crypto.randomBytes(4).toString('hex')}${ext}`;
      const filepath = path.join(IMAGES_DIR, filename);
      fs.writeFileSync(filepath, Buffer.from(data.base64, 'base64'));
      send(res, 200, { ok: true, path: `images/${filename}` });
      return;
    }

    if (req.method === 'GET' && req.url.startsWith('/images/')) {
      const imgPath = path.join(path.dirname(INDEX_PATH), req.url);
      if (!fs.existsSync(imgPath)) return send(res, 404, 'Not found', 'text/plain');
      const ext = path.extname(imgPath).toLowerCase();
      const types = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };
      send(res, 200, fs.readFileSync(imgPath), types[ext] || 'application/octet-stream');
      return;
    }

    send(res, 404, { error: 'Not found' });
  } catch (error) {
    send(res, 500, { error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`ByJDG Local CMS running at http://localhost:${PORT}`);
  console.log(`Editing source file: ${INDEX_PATH}`);
});