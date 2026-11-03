const fs = require('fs');
const path = require('path');
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dec = value => value.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const navPattern = /(<nav\b[^>]*class=["'][^"']*\bnav-links\b[^"']*["'][^>]*>)[\s\S]*?(<\/nav>)/i;
const settingsPattern = /<script\b[^>]*id="site-navigation-settings"[^>]*>([\s\S]*?)<\/script>/i;
function validate(links) {
  if (!Array.isArray(links) || !links.length || links.length > 20) throw new Error('Add between 1 and 20 navigation links.');
  return links.map(link => {
    const label = String(link.label || '').trim();
    const href = String(link.href || '').trim();
    if (!label || label.length > 80) throw new Error('Each navigation link needs button text between 1 and 80 characters.');
    if (!href || /[\u0000-\u0020\u007f\\]/.test(href) || (/^[a-z][a-z0-9+.-]*:/i.test(href) && !/^(https?:|mailto:|tel:)/i.test(href))) throw new Error('Enter a valid URL or page path for each navigation link.');
    if (/^https?:/i.test(href)) { try { new URL(href); } catch { throw new Error('Enter a complete website URL, such as https://example.com.'); } }
    return {label, href, newTab: !!link.newTab};
  });
}
function parse(html) {
  const saved = html.match(settingsPattern);
  if (saved) return validate(JSON.parse(saved[1]));
  const nav = html.match(navPattern)?.[0] || '';
  return [...nav.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map(([, attrs, text]) => ({
    label: dec(text.replace(/<[^>]*>/g,'').trim()),
    href: dec(attrs.match(/\bhref=["']([^"']*)["']/i)?.[1] || ''),
    newTab: /\btarget=["']_blank["']/i.test(attrs)
  }));
}
function render(html, links, filename = 'index.html') {
  links = validate(links);
  const isHome = filename === 'index.html';
  const anchors = links.map(link => {
    let href = link.href;
    if (href.startsWith('#') && !isHome) href = './index.html' + href;
    const local = href.replace(/^\.\//,'');
    const current = !/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href) && (isHome ? ['#top','/','index.html','index.html#top','/index.html'].includes(local) : local.split('#')[0] === filename);
    return `        <a href="${esc(href)}"${current ? ' class="active" aria-current="page"' : ''}${link.newTab ? ' target="_blank" rel="noopener"' : ''}>${esc(link.label)}</a>`;
  }).join('\n');
  html = html.replace(navPattern, (_, start, end) => start + '\n' + anchors + '\n      ' + end);
  const metadata = '<script type="application/json" id="site-navigation-settings">' + JSON.stringify(links).replace(/</g,'\\u003c') + '</script>';
  if (settingsPattern.test(html)) html = html.replace(settingsPattern, () => metadata);
  else html = html.replace('</head>', metadata + '\n</head>');
  return html;
}
function syncDirectory(directory, links) {
  for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
    if (!entry.isFile() || !entry.name.endsWith('.html') || entry.name === 'admin.html') continue;
    const file = path.join(directory,entry.name);
    const html = fs.readFileSync(file,'utf8');
    if (navPattern.test(html)) fs.writeFileSync(file,render(html,links,entry.name),'utf8');
  }
}
module.exports = {parse,validate,render,syncDirectory};
