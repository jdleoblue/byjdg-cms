const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dec = value => value.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const section = /(<section\b[^>]*class="contact"[^>]*>)([\s\S]*?)(<\/section>)/i;
const cta = /(<a\b[^>]*class="[^"]*\bproject-invitation\b[^"]*"[^>]*>)([\s\S]*?)(<\/a>)/i;
const button = /(<form\b[^>]*class="contact-form"[^>]*>[\s\S]*?<button\b[^>]*>)([\s\S]*?)(<\/button>)/i;
function parse(html) {
 const block=html.match(section)?.[2] || '';
 const link=block.match(cta);
 return {buttonText:dec(block.match(button)?.[2].replace(/<[^>]*>/g,'').trim() || 'Send Message'),ctaText:dec(link?.[2].replace(/<svg\b[\s\S]*?<\/svg>/i,'').replace(/<[^>]*>/g,'').trim() || 'Start a project'),ctaHref:dec(link?.[1].match(/\bhref="([^"]*)"/i)?.[1] || './projects.html')};
}
function validate(settings) {
 for(const field of ['buttonText','ctaText'])if(typeof settings[field]!=='string'||!settings[field].trim()||settings[field].length>120)throw new Error('Enter button and CTA text between 1 and 120 characters.');
 const href=settings.ctaHref;
 if(typeof href!=='string'||!href.trim()||/[\u0000-\u0020\u007f\\]/.test(href)||(/^[a-z][a-z0-9+.-]*:/i.test(href)&& !/^(https?:|mailto:|tel:)/i.test(href)))throw new Error('Enter a valid Start a Project URL or page path.');
 if(/^https?:/i.test(href))try{new URL(href);}catch{throw new Error('Enter a complete Start a Project URL.');}
 return settings;
}
function render(html,settings) {
 const s=validate({...parse(html),...settings});
 return html.replace(section,(_,start,body,end)=>{
  body=body.replace(button,(_,a,b,c)=>a+esc(s.buttonText)+c);
  body=body.replace(cta,(_,a,b,c)=>a.replace(/\bhref="[^"]*"/i,()=>`href="${esc(s.ctaHref)}"`)+esc(s.ctaText)+(b.match(/\s*<svg\b[\s\S]*?<\/svg>/i)?.[0] || '')+c);
  return start+body+end;
 });
}
module.exports={parse,validate,render};
