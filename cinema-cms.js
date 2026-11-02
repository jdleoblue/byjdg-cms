const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const decode = v => v.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
function parse(html) {
 const value = (key, fallback) => {const m=html.match(new RegExp(`data-cinema-${key}="([^"]*)"`));return m?decode(m[1]):fallback;};
 return {featuredIndex:Number(value('index','3')),headline:value('headline','Two minutes. A thousand little moments.'),intro:value('intro','Old streets, live music, train rides, good food, and time by the sea.'),portrait:value('portrait','images/hero-image-ef811527.jpg')};
}
function render(html, settings, episodes) {
 const c={...parse(html),...settings};
 if(!Number.isInteger(c.featuredIndex)||c.featuredIndex< -1)throw new Error('Choose a featured film.');
 if(c.featuredIndex>=episodes.length)c.featuredIndex=episodes.length?episodes.length-1:-1;
 if(!/^(images\/[a-z0-9_./-]+|https:\/\/[^\s'"()<>]+)$/i.test(c.portrait))throw new Error('About image must use an images/ path or HTTPS address.');
 const ep=episodes[c.featuredIndex];
 const block=`<section class="featured-film" id="featured" data-cinema-index="${c.featuredIndex}" data-cinema-headline="${esc(c.headline)}" data-cinema-intro="${esc(c.intro)}" data-cinema-portrait="${esc(c.portrait)}"${ep?'':' hidden'}>
${ep?`<div class="feature-lead"><div><p class="cinema-eyebrow">Featured film / ${esc(ep.eyebrow)}</p><h2>${esc(c.headline)}</h2></div><p class="feature-intro">${esc(c.intro)}</p></div>
<a class="feature-image" href="${esc(ep.href)}" target="_blank" rel="noopener" aria-label="Watch ${esc(ep.title)}"><img src="${esc(ep.image)}" alt="${esc(ep.title)}" width="1920" height="1080" loading="lazy"></a>
<div class="feature-caption"><div><p class="cinema-eyebrow">Selected from the journal</p><h3>${esc(ep.title)}</h3></div><a class="button" href="${esc(ep.href)}" target="_blank" rel="noopener">Watch Film <span aria-hidden="true">↗</span></a></div>`:''}
</section>`;
 html=html.replace(/<section class="featured-film"[\s\S]*?<\/section>/,()=>block);
 html=html.replace(/(<img class="about-portrait" src=")[^"]*"/,(_,p)=>p+esc(c.portrait)+'"');
 return html;
}
module.exports={parse,render};
