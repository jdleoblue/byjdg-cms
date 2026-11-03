'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const {execFile}=require('child_process');
const run=(cwd,args)=>new Promise((resolve,reject)=>execFile('git',args,{cwd,maxBuffer:2*1024*1024},(err,out,stderr)=>err?reject(new Error((stderr||out||err.message).trim())):resolve(out.trim())));
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validId=id=>typeof id==='string'&&/^[a-f0-9]{32}$/.test(id);
function validate(raw){
 if(!raw||!validId(raw.id))throw Error('Invalid delivery ID.');
 const text=(v,max)=>{if(typeof v!=='string'||v.length>max)throw Error('Invalid delivery text.');return v.trim();};
 const d={id:raw.id,client:text(raw.client,160),message:text(raw.message,4000),projects:[]};
 if(!d.client)throw Error('Enter a client name.');
 if(!Array.isArray(raw.projects)||raw.projects.length<1||raw.projects.length>100)throw Error('Add between 1 and 100 projects.');
 d.projects=raw.projects.map(p=>{
 const project={title:text(p.title,200),date:text(p.date,80),message:text(p.message,4000),files:[]};
 if(!project.title)throw Error('Enter a title for every project.');
 if(!Array.isArray(p.files)||p.files.length>200)throw Error('Invalid file list.');
 project.files=p.files.map(f=>{const file={name:text(f.name,200),details:text(f.details,300),url:text(f.url,2048)};if(!file.name)throw Error('Enter a display name for each file.');let url;try{url=new URL(file.url);}catch{throw Error('Enter a valid Google Drive sharing link.');}if(url.protocol!=='https:'||!['drive.google.com','docs.google.com'].includes(url.hostname)||url.username||url.password)throw Error('Use an HTTPS Google Drive sharing link.');return file;});return project;});return d;
}
function render(d,preview=false,icon){
 const nav=d.projects.map((p,i)=>`<button class="project-link" data-project="project-${i}" aria-current="${i===0}">${escape(p.title)}<small>${escape(p.date)}</small></button>`).join('');
 const projects=d.projects.map((p,i)=>`<article class="project" id="project-${i}"${i?' hidden':''}><div class="eyebrow">${escape(p.date||'Project delivery')}</div><h2>${escape(p.title)}</h2><p class="muted">${escape(p.message)}</p><div class="files-heading"><span class="eyebrow">Project files</span><span class="muted">${p.files.length} ${p.files.length===1?'file':'files'}</span></div>${p.files.length?p.files.map((f,n)=>`<div class="file"><span class="number" aria-hidden="true">${String(n+1).padStart(2,'0')}</span><div><div class="file-title">${escape(f.name)}</div><p class="meta">${escape(f.details)}</p></div><a class="download" href="${escape(f.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escape('Open '+f.name+' in Google Drive')}">Open / Download <span aria-hidden="true">↗</span></a></div>`).join(''):'<p class="empty">No files have been added yet.</p>'}<p class="help">Files open in Google Drive. Use its download button to save them; Google may ask you to sign in.</p></article>`).join('');
 const values={TITLE:escape(d.client),CLIENT:escape(d.client),MESSAGE:escape(d.message),NAV:nav,PROJECTS:projects,PREVIEW:preview?'<div class="preview">Local preview — this delivery is not being published by viewing this page.</div>':''};
 const html=fs.readFileSync(path.join(__dirname,'delivery-page.html'),'utf8').replace(/\{\{([A-Z]+)\}\}/g,(_,key)=>values[key]);
 return icon?require('./site-icon').render(html,icon):html;
}
function create(options){
 const {dataDir,liveDir}=options;fs.mkdirSync(dataDir,{recursive:true,mode:0o700});const dbPath=path.join(dataDir,'deliveries.json');let busy=false;
 const renderPage=(d,preview=false)=>{const source=options.iconSource||path.join(liveDir,'index.html');return render(d,preview,fs.existsSync(source)?require('./site-icon').parse(fs.readFileSync(source,'utf8')):undefined);};
 const read=()=>fs.existsSync(dbPath)?JSON.parse(fs.readFileSync(dbPath,'utf8')):[];
 const write=rows=>{const tmp=dbPath+'.tmp';fs.writeFileSync(tmp,JSON.stringify(rows,null,2),{mode:0o600});fs.renameSync(tmp,dbPath);};
 function save(raw){const rows=read(),old=rows.find(d=>d.id===raw.id);if(!old)throw Error('Delivery not found.');const d={...old,...validate(raw),updatedAt:new Date().toISOString(),dirty:true};rows[rows.indexOf(old)]=d;write(rows);return d;}
 async function publish(d,remove){
 if(!liveDir||!fs.existsSync(path.join(liveDir,'.git')))throw Error('Live website repository is unavailable.');
 // Refuse to mix delivery commits with unrelated staged work or pending commits.
 if(await run(liveDir,['diff','--cached','--name-only']))throw Error('Other website changes are staged. Finish those before publishing a delivery.');
 await run(liveDir,['fetch','origin']);
 const branch=await run(liveDir,['rev-parse','--abbrev-ref','HEAD']);if(branch==='HEAD')throw Error('Live repository must be on its publishing branch.');
 const remote=await run(liveDir,['rev-parse','@{u}']);const head=await run(liveDir,['rev-parse','HEAD']);if(remote!==head)throw Error('Live website has pending or newer commits. Synchronize it before publishing a delivery.');
 const relative=`delivery/${d.id}/index.html`,target=path.join(liveDir,relative);const before=fs.existsSync(target)?fs.readFileSync(target):null;
 if(await run(liveDir,['status','--porcelain','--',relative]))throw Error('This delivery has unfinished local publishing changes. Resolve them before retrying.');
 let committed=false;
 try{
 if(remove){if(fs.existsSync(target))fs.unlinkSync(target);}else{fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,renderPage(d));}
 await run(liveDir,['add','-A','--',`delivery/${d.id}`]);
 if(await run(liveDir,['diff','--cached','--name-only','--',relative])){await run(liveDir,['commit','-m',remove?'Remove delivery page':'Publish delivery page','--',relative]);committed=true;}
 await run(liveDir,['push','origin',branch]);
 }catch(error){
 if(!committed){await run(liveDir,['reset','--',relative]).catch(()=>{});if(before){fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,before);}else if(fs.existsSync(target))fs.unlinkSync(target);}
 else error.message+=' The delivery commit is saved locally, but was not confirmed pushed. Synchronize the live repository before retrying.';
 throw error;
 }
 const rows=read(),item=rows.find(x=>x.id===d.id);if(item){item.status=remove?'removed':'published';item.dirty=false;item.publishedAt=new Date().toISOString();write(rows);}
 return {ok:true,delivery:item,url:`https://www.byjdg.com/delivery/${d.id}/`,message:remove?'Removal pushed. Allow time for the website deployment. Disable Google Drive sharing separately.':'Delivery pushed. Allow time for the website deployment before sending the link.'};
 }
 async function handle(req,res){
 const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith('/api/deliveries'))return false;
 const send=(code,value,type='application/json')=>{res.writeHead(code,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(type==='application/json'?JSON.stringify(value):value);};
 if(!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host||'')){send(403,{error:'Local Studio access only.'});return true;}
 if(!/^\/api\/deliveries(?:\/[a-f0-9]{32}(?:\/(?:preview|publish|remove))?)?$/.test(url.pathname)){send(404,{error:'Not found'});return true;}
 // Only the local Studio may change deliveries; block cross-origin browser requests.
 if(req.method!=='GET'){
 const origin=req.headers.origin;if(origin&&origin!==`http://${req.headers.host}`){send(403,{error:'Use Website Studio to manage deliveries.'});return true;}
 if(!(req.headers['content-type']||'').startsWith('application/json')){send(415,{error:'JSON required.'});return true;}
 if(busy){send(409,{error:'Another delivery operation is running. Please wait.'});return true;}busy=true;
 }
 try{
 const parts=url.pathname.split('/').filter(Boolean),id=parts[2],action=parts[3];
 if(req.method==='GET'&&!id){send(200,{deliveries:read(),publicRepository:true});return true;}
 const rows=read();let item=rows.find(x=>x.id===id);
 if(req.method==='GET'&&action==='preview'&&item){send(200,renderPage(item,true),'text/html; charset=utf-8');return true;}
 if(req.method!=='POST'){send(404,{error:'Not found'});return true;}
 let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>1024*1024)throw Error('Delivery data is too large.');}const data=JSON.parse(body||'{}');
 if(!id){item={id:crypto.randomBytes(16).toString('hex'),client:'New client',message:'Your files are ready. Thank you for creating with me. — JDG',projects:[{title:'New project',date:'',message:'',files:[]}],status:'draft',dirty:false,createdAt:new Date().toISOString()};rows.unshift(item);write(rows);send(200,{ok:true,delivery:item});return true;}
 if(!item)throw Error('Delivery not found.');
 if(!action){send(200,{ok:true,delivery:save({...data,id})});return true;}
 if(action==='publish'){if(data.acknowledgePublic!==true)throw Error('Acknowledge the public page notice before publishing.');item=save({...data.delivery,id});if(!item.projects.some(p=>p.files.length))throw Error('Add at least one file before publishing.');send(200,await publish(item,false));return true;}
 if(action==='remove'){if(item.status!=='published')throw Error('Only a published page can be removed.');send(200,await publish(item,true));return true;}
 send(404,{error:'Not found'});return true;
 }catch(error){send(400,{ok:false,error:error.message});return true;}finally{if(req.method!=='GET')busy=false;}
 }
 return {handle,read};
}
module.exports={create,validate,render};
