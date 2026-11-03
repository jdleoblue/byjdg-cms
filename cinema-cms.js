const aboutToneStyles = `
<style id="byjdg-about-tone">
html[data-about-tone="stone"] #about {
 --about-surface:#c8c2b8; --text:#292722; --muted:#45413a; --cinema-accent:#645027;
}
html[data-about-tone="taupe"] #about {
 --about-surface:#62584f; --text:#fff9ee; --muted:#eee5d8; --cinema-accent:#f1d298;
}
html[data-about-tone="charcoal"] #about {
 --about-surface:#2d2b28; --text:#f5f1e8; --muted:#d0c9bd; --cinema-accent:#dfbf82;
}
html[data-about-tone="stone"] #about,
html[data-about-tone="taupe"] #about,
html[data-about-tone="charcoal"] #about {
 background:var(--about-surface); color:var(--text); border-color:var(--muted);
}
html[data-about-tone="stone"] #about p,
html[data-about-tone="taupe"] #about p,
html[data-about-tone="charcoal"] #about p { color:var(--muted); }
html[data-about-tone="stone"] #about .lead,
html[data-about-tone="taupe"] #about .lead,
html[data-about-tone="charcoal"] #about .lead { color:var(--text); }
html[data-about-tone="stone"] #about .small-link,
html[data-about-tone="taupe"] #about .small-link,
html[data-about-tone="charcoal"] #about .small-link { color:var(--cinema-accent); }
</style>
`;
const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const decode = v => v.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
function parse(html) {
 const value = (key, fallback) => {const m=html.match(new RegExp(`data-cinema-${key}="([^"]*)"`));return m?decode(m[1]):fallback;};
 return {aboutTone:html.match(/<html\b[^>]*data-about-tone="([^"]*)"/i)?.[1] || 'theme',ctaText:value('cta','Watch Film'),eyebrow:value('eyebrow','Selected from the journal'),featuredIndex:Number(value('index','3')),headline:value('headline','Two minutes. A thousand little moments.'),intro:value('intro','Old streets, live music, train rides, good food, and time by the sea.'),portrait:value('portrait','images/hero-image-ef811527.jpg')};
}
function render(html, settings, episodes) {
 const c={...parse(html),...settings};
 if(!Number.isInteger(c.featuredIndex)||c.featuredIndex< -1)throw new Error('Choose a featured film.');
 if(c.featuredIndex>=episodes.length)c.featuredIndex=episodes.length?episodes.length-1:-1;
 if(!/^(images\/[a-z0-9_./-]+|https:\/\/[^\s'"()<>]+)$/i.test(c.portrait))throw new Error('About image must use an images/ path or HTTPS address.');
 if(typeof c.ctaText !== 'string' || typeof c.eyebrow !== 'string') throw new Error('Featured CTA and eyebrow must be text.');
 if(!['theme','stone','taupe','charcoal'].includes(c.aboutTone)) throw new Error('Choose a valid About section tone.');
 const ep=episodes[c.featuredIndex];
 const block=`<section class="featured-film" id="featured" data-cinema-index="${c.featuredIndex}" data-cinema-cta="${esc(c.ctaText)}" data-cinema-eyebrow="${esc(c.eyebrow)}" data-cinema-headline="${esc(c.headline)}" data-cinema-intro="${esc(c.intro)}" data-cinema-portrait="${esc(c.portrait)}"${ep?'':' hidden'}>
${ep?`<div class="feature-lead"><div><p class="cinema-eyebrow">Featured film / ${esc(ep.eyebrow)}</p><h2>${esc(c.headline)}</h2></div><p class="feature-intro">${esc(c.intro)}</p></div>
<a class="feature-image" href="${esc(ep.href)}" target="_blank" rel="noopener" aria-label="Watch ${esc(ep.title)}"><img src="${esc(ep.image)}" alt="${esc(ep.title)}" width="1920" height="1080" loading="lazy"></a>
<div class="feature-caption"><div><p class="cinema-eyebrow">${esc(c.eyebrow)}</p><h3>${esc(ep.title)}</h3></div><a class="button" href="${esc(ep.href)}" target="_blank" rel="noopener">${esc(c.ctaText)} <span aria-hidden="true"><svg class="cta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 18 18 6M6 6h12v12"/></svg></span></a></div>`:''}
</section>`;
 html=html.replace(/<section class="featured-film"[\s\S]*?<\/section>/,()=>block);
 html=html.replace(/(<img class="about-portrait" src=")[^"]*"/,(_,p)=>p+esc(c.portrait)+'"');
 return applyAboutTone(html,c.aboutTone);
}
function applyAboutTone(html,tone) {
 if(!['theme','stone','taupe','charcoal'].includes(tone)) throw new Error('Choose a valid About section tone.');
 html=html.replace(/<html\b[^>]*>/i,tag=>tag.replace(/\sdata-about-tone="[^"]*"/gi,'').replace(/>$/,` data-about-tone="${tone}">`));
 if(!html.includes('id="byjdg-about-tone"'))html=html.replace(/<\/head>/i,()=>aboutToneStyles+'\n</head>');
 return html;
}
module.exports={parse,render,applyAboutTone};
