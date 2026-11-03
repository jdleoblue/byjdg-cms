const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const decode = s => s.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
function meta(html,key){
 for(const tag of html.match(/<meta\b[^>]*>/gi)||[]){
  const attrs={};for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g))attrs[m[1].toLowerCase()]=decode(m[3]);
  if((attrs.name||attrs.property||'').toLowerCase()===key)return attrs.content||'';
 }return '';
}
function parse(html){return {title:decode(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]||''),description:meta(html,'description'),socialImage:meta(html,'og:image')};}
function render(html,settings){
 if(!settings)return html;
 const data={...parse(html),...settings};
 for(const key of ['title','description','socialImage'])if(typeof data[key]!=='string')throw new Error('Page settings must be text.');
 if(!data.title.trim())throw new Error('Please enter a page title for each page.');
 if(data.socialImage&&!/^https:\/\/[^\s<>"']+$/i.test(data.socialImage))throw new Error('Social sharing images need a full HTTPS address, or leave the field blank.');
 const title=`<title>${escape(data.title)}</title>`;
 html=/<title\b/i.test(html)?html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i,()=>title):html.replace(/<\/head>/i,()=>title+'\n</head>');
 const values={'description':data.description,'og:title':data.title,'og:description':data.description,'twitter:title':data.title,'twitter:description':data.description,'og:image':data.socialImage,'twitter:image':data.socialImage};
 for(const [key,value] of Object.entries(values)){
  const pattern=new RegExp(`<meta\\b(?=[^>]*(?:name|property)\\s*=\\s*["']${key}["'])[^>]*>`, 'gi');
  html=html.replace(pattern,'');
  if(value)html=html.replace(/<\/head>/i,()=>`  <meta ${key.startsWith('og:')?'property':'name'}="${key}" content="${escape(value)}" />\n</head>`);
 }
 return html;
}
module.exports={parse,render};
