const fs = require('fs'), path = require('path'), crypto = require('crypto');
const {execFileSync} = require('child_process');
const os = require('os');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function parse(html) {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  const tag = tags.find(t => /\brel=["'](?:shortcut )?icon["']/i.test(t));
  const href = tag?.match(/\bdata-site-icon-source=["']([^"']*)["']/i)?.[1] || tag?.match(/\bhref=["']([^"']*)["']/i)?.[1] || '/images/by-jdg-gold-favicon.png';
  return {path:href.replace(/&amp;/g,'&').split(/[?#]/)[0].replace(/^\//,'')};
}
function validate(settings) {
  const value = settings?.path;
  if(typeof value !== 'string' || !/^images\/[a-z0-9_./-]+\.(png|ico|jpg|jpeg|webp)$/i.test(value) || value.split('/').includes('..')) throw Error('Choose an uploaded PNG, ICO, JPG, or WebP website icon.');
  return {path:value};
}
function version(settings) {return crypto.createHash('sha256').update(validate(settings).path).digest('hex').slice(0,12);}
function render(html, settings) {
  const data = validate(settings), v = version(data);
  html = html.replace(/<link\b[^>]*\brel=["'](?:shortcut icon|icon|apple-touch-icon)["'][^>]*>\s*/gi,'');
  const tags = `<link rel="icon" type="image/png" sizes="32x32" data-site-icon-source="${esc(data.path)}" href="/images/site-icon-${v}-32.png?v=${v}">\n<link rel="apple-touch-icon" sizes="180x180" href="/images/site-icon-${v}-180.png?v=${v}">\n`;
  return html.replace(/<head\b[^>]*>\s*(?:<meta\b[^>]*charset[^>]*>\s*)?/i, m => m + tags);
}
function generate(directory, settings) {
  const data = validate(settings), source = path.join(directory,data.path), v = version(data);
  if (!fs.existsSync(source)) throw Error('The selected website icon is missing. Please upload it again.');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(),'byjdg-icon-'));
  try {
    const pngs = [16,32,48,180].map(size => {
      const dest = path.join(temp,`${size}.png`);
      execFileSync('/usr/bin/sips',['-s','format','png','-z',String(size),String(size),source,'--out',dest],{stdio:'pipe'});
      return fs.readFileSync(dest);
    });
    const header = Buffer.alloc(6 + 3*16); header.writeUInt16LE(1,2); header.writeUInt16LE(3,4);
    let offset = header.length;
    [16,32,48].forEach((size,i) => {const n=6+i*16;header[n]=size;header[n+1]=size;header.writeUInt16LE(1,n+4);header.writeUInt16LE(32,n+6);header.writeUInt32LE(pngs[i].length,n+8);header.writeUInt32LE(offset,n+12);offset+=pngs[i].length;});
    fs.mkdirSync(path.join(directory,'images'),{recursive:true});
    fs.writeFileSync(path.join(directory,`images/site-icon-${v}-32.png`),pngs[1]);
    fs.writeFileSync(path.join(directory,`images/site-icon-${v}-180.png`),pngs[3]);
    fs.writeFileSync(path.join(directory,'favicon.ico'),Buffer.concat([header,...pngs.slice(0,3)]));
  } finally {fs.rmSync(temp,{recursive:true,force:true});}
}
function syncDirectory(directory,settings) {
  generate(directory,settings);
  const visit = dir => {
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
      if(entry.isFile() && entry.name.endsWith('.html') && entry.name!=='admin.html') {
        const filename=path.join(dir,entry.name), html=fs.readFileSync(filename,'utf8');
        if(/<head\b/i.test(html)) fs.writeFileSync(filename,render(html,settings));
      }
    }
    const deliveries=path.join(dir,'delivery');
    if(fs.existsSync(deliveries)) for(const entry of fs.readdirSync(deliveries,{withFileTypes:true})) if(entry.isDirectory()) visit(path.join(deliveries,entry.name));
  };
  visit(directory);
}
module.exports={parse,validate,render,syncDirectory};
