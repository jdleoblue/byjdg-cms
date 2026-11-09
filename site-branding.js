const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dec=s=>s.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const settingsPattern=/<script\b[^>]*id="site-branding-settings"[^>]*>([\s\S]*?)<\/script>/i;
function validate(settings){
 const logoText=settings?.logoText,logoImage=settings?.logoImage??'';
 if(typeof logoText!=='string'||!logoText.trim()||logoText.length>80)throw Error('Enter logo text between 1 and 80 characters.');
 if(typeof logoImage!=='string'||(logoImage&&!/^images\/[a-z0-9_-][a-z0-9._-]*\.(?:png|jpe?g|webp)$/i.test(logoImage)))throw Error('Upload a PNG, JPG or WebP logo image.');
 return {logoText,logoImage};
}
function parse(html){
 const metadata=html.match(settingsPattern);if(metadata)return validate(JSON.parse(metadata[1]));
 return {logoText:dec(html.match(/<a\b[^>]*class="logo"[^>]*>([^<]*)<\/a>/i)?.[1]||'by JDG'),logoImage:''};
}
function removeFooterLogo(html){
 return html.replace(/(<footer class="footer">)([\s\S]*?)(<\/footer>)/gi,(_,open,body,close)=>open+body.replace(/\s*<div class="footer-brand">[\s\S]*?<\/div>/gi,'').replace(/<div>/,'<div class="footer-copyright">')+close);
}
function parseCopyright(html){
 const footer=html.match(/<footer class="footer">[\s\S]*?<\/footer>/i)?.[0]||'';
 const normalized=removeFooterLogo(footer);
 return dec(normalized.match(/<div class="footer-copyright">([\s\S]*?)<\/div>/i)?.[1]||'© 2026 by JDG. All rights reserved.');
}
function renderCopyright(html,text){
 return removeFooterLogo(html).replace(/(<footer class="footer">[\s\S]*?<div class="footer-copyright">)[\s\S]*?(<\/div>)/i,(_,open,close)=>open+esc(text)+close);
}
function render(html,settings){
 const previous=parse(html),{logoText:text,logoImage}=validate({...previous,...settings});
 const content=logoImage?`<img class="site-logo-image" src="/${esc(logoImage)}" alt="${esc(text)}" decoding="async">`:esc(text);
 html=html.replace(/(<a\b[^>]*class="logo"[^>]*>)[\s\S]*?(<\/a>)/gi,(_,a,b)=>a+content+b);
 html=removeFooterLogo(html);
 // Keep names as text; the optional image only replaces the navigation logo.
 html=html.replace(/© (\d{4}) ([^<]+?)\. All rights reserved\./g,(full,year,brand)=>[previous.logoText,'ByJDG','by JDG'].includes(dec(brand))?`© ${year} ${esc(text)}. All rights reserved.`:full);
 html=html.replace(/(<p data-project-field="quoteBy">)— ([^<]*)(<\/p>)/,(full,a,brand,b)=>[previous.logoText,'ByJDG','by JDG'].includes(dec(brand))?a+'— '+esc(text)+b:full);
 html=html.replace(/\s*<style id="byjdg-logo-image">[\s\S]*?<\/style>/gi,'');
 const style='<style id="byjdg-logo-image">.nav .logo .site-logo-image{display:block;width:auto;height:42px;max-width:200px;object-fit:contain}@media(max-width:650px){.nav .logo .site-logo-image{height:34px;max-width:160px}}</style>';
 const metadata='<script type="application/json" id="site-branding-settings">'+JSON.stringify({logoText:text,logoImage}).replace(/</g,'\\u003c')+'</script>';
 html=html.replace(settingsPattern,'');return html.replace(/<\/head>/i,()=>metadata+'\n'+style+'\n</head>');
}
module.exports={parse,validate,render,removeFooterLogo,parseCopyright,renderCopyright};
