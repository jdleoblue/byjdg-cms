const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const defaults={
  introEyebrow:'A little about me',helloEyebrow:'Hello, I’m JDG',introTitle:'Places I’ve been.\nMoments I’ve kept.',portrait:'images/hero-image-ef811527.jpg',portraitAlt:'JDG outdoors wearing a cap',
  introText:'I make travel films about the places I explore and the moments that stay with me. This is where I share a little of the person behind those films.\n\nA beautiful view might be what brings me somewhere. But it’s often the smaller things—a quiet street, a passing conversation, the way a place feels—that I want to remember.',
  storyEyebrow:'My story',storyTitle:'A little curiosity.\nA different\nperspective.',storyText:'For me, making a film is a way to pay closer attention. To slow down, look around, and notice the things I might otherwise walk past.\n\nHere’s where I’d tell you a little about how that started: what first drew me to creating, the experiences that shaped my perspective, and why I keep picking up the camera.\n\nBeyond the videos, there’s a whole person here, too. This space can hold the interests, everyday moments, and personal details I’d want you to know if we were meeting for the first time.',
  shareEyebrow:'What I share',shareTitle:'Come along\nfor the moments.',shareText:'Travel films, coastal escapes, beautiful streets, and glimpses of everyday life along the way. A collection of places and moments, seen through my lens.',youtubeLabel:'See all videos on YouTube',youtubeHref:'https://www.youtube.com/@by-jdg',
  contactEyebrow:'Let’s connect',contactTitle:'A conversation\nstarts with hello.',contactText:'Have a question, an idea, or a story to share? I’d love to hear from you.',contactLabel:'Get in touch',contactHref:'mailto:filmsbyjdg@icloud.com',collaborationText:'For collaborations and creative work,',collaborationLabel:'explore working together',collaborationHref:'./projects.html'
};
const fields=[
 ['introduction','introEyebrow','Section eyebrow'],['introduction','helloEyebrow','Introduction eyebrow'],['introduction','introTitle','Headline','textarea'],['introduction','introText','Paragraphs','textarea'],['introduction','portrait','Portrait image'],['introduction','portraitAlt','Image description'],
 ['story','storyEyebrow','Eyebrow'],['story','storyTitle','Headline','textarea'],['story','storyText','Paragraphs','textarea'],
 ['share','shareEyebrow','Eyebrow'],['share','shareTitle','Headline','textarea'],['share','shareText','Paragraphs','textarea'],['share','youtubeLabel','YouTube button label'],['share','youtubeHref','YouTube link'],
 ['contact','contactEyebrow','Eyebrow'],['contact','contactTitle','Headline','textarea'],['contact','contactText','Paragraphs','textarea'],['contact','contactLabel','Contact button label'],['contact','contactHref','Contact link'],['contact','collaborationText','Collaboration introduction'],['contact','collaborationLabel','Collaboration link label'],['contact','collaborationHref','Collaboration link']
].map(([group,key,label,type='input'])=>({group,key,label,type}));
const settingsPattern=/<script type="application\/json" id="about-page-settings">([\s\S]*?)<\/script>/;
function parse(html){const match=html.match(settingsPattern);return {...defaults,...(match?JSON.parse(match[1]):{})};}
function safeUrl(value,image=false){
 if(!value||/[\u0000-\u0020\u007f\\<>"']/.test(value)||value.startsWith('//')||(/^[a-z][a-z0-9+.-]*:/i.test(value)&&!(image?/^https?:/i:/^(https?:|mailto:|tel:)/i).test(value)))throw Error('Enter a valid '+(image?'portrait image path':'About Me link')+'.');
 if(/^https?:/i.test(value)){try{new URL(value)}catch{throw Error('Enter a complete website URL.')}}
 if(image&&!/^https?:/i.test(value)&&(!/^\/?images\/[\w./%-]+$/.test(value)||value.split('/').includes('..')))throw Error('Use an uploaded portrait from the images folder.');
}
function validate(settings){const data={...defaults,...settings};for(const key of Object.keys(defaults)){if(typeof data[key]!=='string'||data[key].length>50000)throw Error('About Me fields must be text.');}for(const key of ['youtubeHref','contactHref','collaborationHref'])safeUrl(data[key]);safeUrl(data.portrait,true);return data;}
const paragraphs=text=>text.split(/\n\s*\n/).filter(p=>p.trim()).map(p=>'<p>'+esc(p).replace(/\n/g,'<br>')+'</p>').join('');
function render(html,settings,home,theme='black'){
 const d=validate(settings||parse(html));
 // Use the homepage's CTA presentation and shared motion rules on every CMS save.
 html=html.replace(/\.ab-link\{[^}]*\}/, '.ab-link{display:inline-block;font-size:.7rem;text-transform:uppercase;letter-spacing:.28em;margin-top:20px}');
 html=html.replace(/\.ab-link span\{[^}]*\}/, '');
 html=html.replace('@media(prefers-reduced-motion:no-preference){.ab-link span{transition:transform .2s}.ab-link:hover span{transform:translateX(5px)}}', '');
 const motion=home?.match(/<style id="byjdg-cta-hover">[\s\S]*?<\/style>/)?.[0];
 if(motion)html=html.replace(/<style id="byjdg-cta-hover">[\s\S]*?<\/style>/,()=>motion);

 const eyebrow=key=>'<p class="ab-eyebrow">'+esc(d[key])+'</p>';
 const main=`<main class="about-content" id="top"><section class="ab-intro ab-wrap">${eyebrow('introEyebrow')}<div class="ab-grid"><img class="ab-portrait" src="${esc(d.portrait)}" alt="${esc(d.portraitAlt)}" width="640" height="720"><div class="ab-copy">${eyebrow('helloEyebrow')}<h1>${esc(d.introTitle)}</h1>${paragraphs(d.introText)}</div></div></section><section class="ab-story ab-wrap" id="story"><div>${eyebrow('storyEyebrow')}<h2>${esc(d.storyTitle)}</h2></div><div class="ab-prose">${paragraphs(d.storyText)}</div></section><section class="ab-share ab-wrap"><div class="ab-copy">${eyebrow('shareEyebrow')}<h2>${esc(d.shareTitle)}</h2>${paragraphs(d.shareText)}<a class="ab-link watch-link jdg-motion-cta" href="${esc(d.youtubeHref)}" target="_blank" rel="noopener">${esc(d.youtubeLabel)} <span class="jdg-cta-arrow" aria-hidden="true">→</span></a></div><div class="ab-youtube" aria-hidden="true"><svg viewBox="0 0 240 170" fill="none"><rect x="10" y="10" width="220" height="150" rx="42" fill="currentColor"/><path d="M104 53 104 117 160 85Z" fill="var(--bg)"/></svg></div></section><section class="ab-contact ab-wrap" id="contact"><div>${eyebrow('contactEyebrow')}<h2>${esc(d.contactTitle)}</h2></div><div class="ab-contact-copy">${paragraphs(d.contactText)}<a class="ab-link watch-link jdg-motion-cta" href="${esc(d.contactHref)}">${esc(d.contactLabel)} <span class="jdg-cta-arrow" aria-hidden="true">→</span></a><p class="ab-collaboration">${esc(d.collaborationText)} <a href="${esc(d.collaborationHref)}">${esc(d.collaborationLabel)}</a>.</p></div></section></main>`;
 html=html.replace(/<!-- ABOUT_CONTENT_START -->[\s\S]*?<!-- ABOUT_CONTENT_END -->/,()=>`<!-- ABOUT_CONTENT_START -->${main}<!-- ABOUT_CONTENT_END -->`);
 html=html.replace(/<html\b[^>]*>/i,tag=>tag.replace(/\sdata-theme="[^"]*"/,'').replace(/>$/,` data-theme="${theme}">`));
 if(home){
  const footer=home.match(/<footer class="footer">[\s\S]*?<\/footer>/)?.[0];if(footer)html=html.replace(/<footer class="footer">[\s\S]*?<\/footer>/,()=>footer);
  const header=home.match(/<header class="nav">[\s\S]*?<\/header>/)?.[0];if(header)html=html.replace(/<header class="nav">[\s\S]*?<\/header>/,()=>header.replace('href="#top"','href="./index.html"'));
  html=require('./site-navigation').render(html,require('./site-navigation').parse(home),'about.html');
 }
 const metadata='<script type="application/json" id="about-page-settings">'+JSON.stringify(d).replace(/</g,'\\u003c')+'</script>';
 html=settingsPattern.test(html)?html.replace(settingsPattern,()=>metadata):html.replace('</head>',()=>metadata+'\n</head>');
 return html;
}
module.exports={defaults,fields,parse,validate,render};
