const sections={aboutPage:[{key:"introduction",label:"Introduction",selector:".ab-intro"},{key:"story",label:"My Story",selector:".ab-story"},{key:"share",label:"What I Share",selector:".ab-share"},{key:"contact",label:"Contact",selector:".ab-contact"}],home:[{key:'featured',label:'Featured Film',selector:'#featured'},{key:'collection',label:'Film Collection',selector:'#latest'},{key:'contact',label:'Contact',selector:'#contact'},{key:'footer',label:'Footer',selector:'.footer'}],projects:[{key:'contact',label:'Services & Message Form',selector:'.contact-section'},{key:'connect',label:'Let’s Connect',selector:'.connect-section'},{key:'quote',label:'Quote & Location',selector:'.footer-visual'},{key:'footer',label:'Footer',selector:'.footer'}]};
const palettes={stone:{surface:'#c8c2b8',text:'#292722',muted:'#45413a',accent:'#645027',line:'rgba(41,39,34,.25)',panel:'rgba(255,255,255,.22)'},taupe:{surface:'#62584f',text:'#fff9ee',muted:'#eee5d8',accent:'#f1d298',line:'rgba(255,249,238,.28)',panel:'rgba(0,0,0,.12)'},charcoal:{surface:'#2d2b28',text:'#f5f1e8',muted:'#d0c9bd',accent:'#dfbf82',line:'rgba(245,241,232,.24)',panel:'rgba(255,255,255,.05)'}};
function parse(html,page){const result={};for(const {key} of sections[page])result[key]=html.match(new RegExp(`<html\\b[^>]*data-tone-${page}-${key}="([^"]*)"`))?.[1]||'theme';return result;}
function render(html,settings,page){
 const tones={...parse(html,page),...settings};
 let css='';
 for(const {key,selector} of sections[page]){
  if(!['theme',...Object.keys(palettes)].includes(tones[key]))throw new Error('Choose a valid section tone.');
  const attr=`data-tone-${page}-${key}`;
  html=html.replace(/<html\b[^>]*>/i,tag=>tag.replace(new RegExp(`\\s${attr}="[^"]*"`,'g'),'').replace(/>$/,` ${attr}="${tones[key]}">`));
  for(const [tone,p] of Object.entries(palettes)){
   const scope=`html[${attr}="${tone}"] ${selector}`;
   const vars=`--text:${p.text};--muted:${p.muted};--accent:${p.accent};--cinema-accent:${p.accent};--line:${p.line};--panel:${p.panel};`;
   css+=`${scope},${scope} .film-card{${vars}color:var(--text);}\n`;
   css+=`${scope}{background:${p.surface};border-color:var(--line);}\n`;
   css+=`${scope} p,${scope} .feature-intro,${scope} .episode{color:var(--muted);}\n`;
   css+=`${scope} .cinema-eyebrow,${scope} .small-link,${scope} .project-invitation{color:var(--accent);}\n`;
   css+=`${scope} .film-card{background:transparent;border-color:var(--line);}\n`;
   css+=`${scope} .footer-card,${scope} .contact-form,${scope} input,${scope} select,${scope} textarea,${scope} .button,${scope} button{background:var(--panel);color:var(--text);border-color:var(--line);}\n`;
   css+=`${scope} input::placeholder,${scope} textarea::placeholder{color:var(--muted);}\n`;
   css+=`${scope} .quote-box,${scope} .service-icon,${scope} .connect-link span{border-color:var(--line);}\n`;
   css+=`${scope} select option{background:${p.surface};color:var(--text);}\n`;
  }
 }
 html=html.replace(/\s*<style id="byjdg-section-tones">[\s\S]*?<\/style>/i,'');
 return html.replace(/<\/head>/i,()=>`<style id="byjdg-section-tones">\n${css}</style>\n</head>`);
}
module.exports={sections,parse,render};
