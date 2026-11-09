const fs = require('fs');
const path = require('path');
const fields = require('./projects-fields.json');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const decode = value => value.replace(/<br\s*\/?\s*>/gi, '\n').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
function parse(html) {
 const values = {};
 for (const f of fields) {
  const m = html.match(new RegExp(`<([a-z0-9]+)\\b[^>]*data-project-field="${f.key}"[^>]*>([\\s\\S]*?)<\\/\\1>`, 'i'));
  if (!m) throw new Error(`Projects field missing: ${f.label}`);
  values[f.key] = decode(m[2]);
 }
 for (let i=0;i<3;i++) values[`connect${i}Href`] = decode(html.match(new RegExp(`data-project-href="connect${i}"[^>]*href="([^"]*)"`))[1]);
 values.formAction = decode(html.match(/<form[^>]*action="([^"]*)"/)[1]);
 values.image = html.match(/\.hero\s*\{[\s\S]*?url\(['"]([^'"]+)['"]\)/)[1];
 return values;
}
function render(html, values, theme) {
 if (!['black','white'].includes(theme)) throw new Error('Invalid appearance.');
 const current = parse(html);
 const v = {...current, ...values};
 for (const f of fields) {
  if (typeof v[f.key] !== 'string') throw new Error(`Invalid Projects field: ${f.label}`);
  const text = escape(v[f.key]).replace(/\r?\n/g, '<br>');
  html = html.replace(new RegExp(`(<([a-z0-9]+)\\b[^>]*data-project-field="${f.key}"[^>]*>)[\\s\\S]*?(<\\/\\2>)`, 'i'), (_,open,tag,close)=>open+text+close);
 }
 for (let i=0;i<3;i++) {
  const value=v[`connect${i}Href`];
  if (!/^(https?:\/\/|mailto:)/i.test(value)) throw new Error('Contact links must start with https://, http:// or mailto:.');
  html=html.replace(new RegExp(`(data-project-href="connect${i}"[^>]*href=")[^"]*"`),(_,prefix)=>prefix+escape(value)+'"');
 }
 if (!/^https:\/\//i.test(v.formAction)) throw new Error('Form destination must start with https://.');
 if (!/^(images\/[a-z0-9_./-]+|https:\/\/[^\s'"()<>#]+)(?:#fp=\d{1,3}(?:\.\d{1,2})?,\d{1,3}(?:\.\d{1,2})?,[1-3](?:\.\d{1,2})?)?$/i.test(v.image)) throw new Error('Use an images/ path or HTTPS image address.');
 html=html.replace(/(<form[^>]*action=")[^"]*"/,(_,prefix)=>prefix+escape(v.formAction)+'"');
 html=html.replace(/(\.hero\s*\{[\s\S]*?url\()['"][^'"]+['"]\)/,(_,prefix)=>prefix+"'"+escape(v.image)+"')");
 return html.replace(/<html\b[^>]*>/i,tag=>tag.replace(/\sdata-theme=["'][^"']*["']/gi,'').replace(/>$/,` data-theme="${theme}">`));
}
module.exports = {fields, parse, render};
