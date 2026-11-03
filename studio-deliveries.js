'use strict';
(function(){
const root=document.getElementById('deliveries');
let rows=[],selected=null,project=0,busy=false;
const q=s=>root.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const item=()=>rows.find(d=>d.id===selected);
async function api(path='',body){const res=await fetch('/api/deliveries'+path,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const value=await res.json();if(!res.ok||value.ok===false)throw Error(value.error||'Request failed.');return value;}
function status(text){q('.d-status').textContent=text;}
function collect(){const d=item();if(!d)return;d.client=q('#d-client').value;d.message=q('#d-message').value;const p=d.projects[project];p.title=q('#d-title').value;p.date=q('#d-date').value;p.message=q('#d-note').value;p.files=[...root.querySelectorAll('.d-file')].map(el=>({name:el.querySelector('[data-field="name"]').value,details:el.querySelector('[data-field="details"]').value,url:el.querySelector('[data-field="url"]').value}));}
function render(){
 q('.d-list').innerHTML=rows.length?rows.map(d=>`<button type="button" class="d-choice" data-delivery="${d.id}" aria-pressed="${d.id===selected}"><span>${esc(d.client)}</span><small>${esc(d.status)}${d.dirty?' · Unpublished changes':''} · ${d.projects.length} project${d.projects.length===1?'':'s'}</small></button>`).join(''):'<p class="muted">No deliveries yet. Create your first client delivery to get started.</p>';
 const d=item();q('.d-editor').hidden=!d;if(!d)return;project=Math.min(project,d.projects.length-1);q('#d-client').value=d.client;q('#d-message').value=d.message;q('.d-state').textContent=d.status+(d.dirty?' · Unpublished changes':'');q('.d-projects').innerHTML=d.projects.map((p,i)=>`<button type="button" class="d-project" data-project="${i}" aria-pressed="${i===project}">${esc(p.title||'Untitled project')}</button>`).join('');
 const p=d.projects[project];q('#d-title').value=p.title;q('#d-date').value=p.date;q('#d-note').value=p.message;
 q('.d-files').innerHTML=p.files.map((f,i)=>`<div class="d-file"><div class="d-filehead"><span>File ${i+1}</span><button type="button" class="secondary" data-delete-file="${i}">Remove file</button></div><div class="row"><div><label for="df-name-${i}">Display name</label><input id="df-name-${i}" data-field="name" maxlength="200" value="${esc(f.name)}" placeholder="Final film"></div><div><label for="df-details-${i}">Format / size (optional)</label><input id="df-details-${i}" data-field="details" maxlength="300" value="${esc(f.details)}" placeholder="4K MP4 · 2.1 GB"></div></div><label for="df-url-${i}">Google Drive sharing link</label><input id="df-url-${i}" data-field="url" type="url" maxlength="2048" value="${esc(f.url)}" placeholder="https://drive.google.com/file/d/…/view"></div>`).join('')||'<p class="muted">No files in this project. Add a file and paste its Google Drive sharing link.</p>';
 q('#d-link').value='https://www.byjdg.com/delivery/'+d.id+'/';q('[data-action="remove"]').disabled=d.status!=='published';q('[data-action="publish"]').textContent=d.status==='published'?'Publish changes':'Publish delivery';q('[data-action="delete-project"]').disabled=d.projects.length<2;
}
function replace(d){rows[rows.findIndex(x=>x.id===d.id)]=d;}
async function save(){collect();const d=item();const result=await api('/'+d.id,d);replace(result.delivery);return result.delivery;}
root.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b||busy)return;const a=b.dataset.action;
 try{
 if(b.dataset.delivery){if(item()){await save();}selected=b.dataset.delivery;project=0;render();status('');return;}
 if(b.dataset.project!==undefined){collect();project=Number(b.dataset.project);render();status('Project selected. Save draft to keep changes.');return;}
 if(b.dataset.deleteFile!==undefined){collect();item().projects[project].files.splice(Number(b.dataset.deleteFile),1);render();status('File removed from the draft. Save or publish to apply.');return;}
 if(a==='new'){if(item())await save();const result=await api('',{});rows.unshift(result.delivery);selected=result.delivery.id;project=0;render();status('New draft created locally. Nothing is published.');return;}
 if(!item())return;
 collect();
 if(a==='add-project'){item().projects.push({title:'New project',date:'',message:'',files:[]});project=item().projects.length-1;render();status('Project added to the draft.');return;}
 if(a==='delete-project'){if(!confirm('Remove this project and its links from the draft? Google Drive files will stay unchanged.'))return;item().projects.splice(project,1);project=0;render();status('Project removed from the draft. Save or publish to apply.');return;}
 if(a==='add-file'){item().projects[project].files.push({name:'',details:'',url:''});render();status('Add a name and Google Drive link, then save.');return;}
 if(a==='copy'){await navigator.clipboard.writeText(q('#d-link').value);status(item().status==='published'?'Link copied. Check the live page has finished deploying before sharing.':'Link copied. Publish this delivery before sending it to your client.');return;}
 if(a==='remove'&&!confirm('Remove this published delivery page? It will become unavailable after deployment. Its content remains in public GitHub history. You must disable Google Drive sharing separately.'))return;
 if(a==='publish'&&!q('#d-public').checked){status('Check the public-page notice before publishing.');q('#d-public').focus();return;}
 busy=true;root.setAttribute('aria-busy','true');root.querySelectorAll('button').forEach(x=>x.disabled=true);
 if(a==='save'){await save();render();status('Draft saved on this Mac. The live page is unchanged.');}
 if(a==='preview'){const win=window.open('about:blank','_blank');try{const d=await save();if(win){win.opener=null;win.location='/api/deliveries/'+d.id+'/preview';}else status('Allow popups to view the local preview.');}catch(error){if(win)win.close();throw error;}render();status(win?'Local preview opened. No page has been published.':'Allow popups to view the local preview.');}
 if(a==='publish'){status('Saving and publishing this delivery…');const result=await api('/'+selected+'/publish',{delivery:item(),acknowledgePublic:true});replace(result.delivery);render();status(result.message);}
 if(a==='remove'){status('Removing the delivery page…');const result=await api('/'+selected+'/remove',{});replace(result.delivery);render();status(result.message);}
 }catch(error){status(error.message);}finally{busy=false;root.removeAttribute('aria-busy');root.querySelectorAll('button').forEach(x=>x.disabled=false);const d=item();if(d){q('[data-action="remove"]').disabled=d.status!=='published';q('[data-action="delete-project"]').disabled=d.projects.length<2;}}
});
api().then(result=>{rows=result.deliveries;selected=rows[0]?.id||null;render();}).catch(error=>status('Unable to load deliveries: '+error.message));
})();
