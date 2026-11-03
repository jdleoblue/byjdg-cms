const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dec=s=>s.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
function parse(html){return {logoText:dec(html.match(/<a\b[^>]*class="logo"[^>]*>([^<]*)<\/a>/i)?.[1]||'by JDG')};}
function render(html,settings){
 const old=parse(html).logoText;
 const text=settings?.logoText ?? old;
 if(typeof text!=='string'||!text.trim()||text.length>80)throw new Error('Enter logo text between 1 and 80 characters.');
 html=html.replace(/(<a\b[^>]*class="logo"[^>]*>)[\s\S]*?(<\/a>)/gi,(_,a,b)=>a+esc(text)+b);
 html=html.replace(/(<div class="footer-brand">)[\s\S]*?(<\/div>)/gi,(_,a,b)=>a+esc(text)+b);
 // Follow the global brand only in standard copyright/attribution copy; preserve custom prose.
 html=html.replace(/© (\d{4}) ([^<]+?)\. All rights reserved\./g,(full,year,brand)=>[old,'ByJDG','by JDG'].includes(dec(brand))?`© ${year} ${esc(text)}. All rights reserved.`:full);
 html=html.replace(/(<p data-project-field="quoteBy">)— ([^<]*)(<\/p>)/, (full,a,brand,b)=>[old,'ByJDG','by JDG'].includes(dec(brand))?a+'— '+esc(text)+b:full);
 return html;
}
module.exports={parse,render};
