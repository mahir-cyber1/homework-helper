import {createClient} from 'npm:@supabase/supabase-js@2.117.3';
import {rewardCatalog,nextReward} from './reward-catalog.ts';
import {berlinDate,currentMonth,evaluate,metrics,nextCheckDate} from './rewards.ts';
import {calendarWindow,validPlan} from './planner.ts';
type State={profile:any;age:number|null;selection:string[];meals:any[];checks:any[];codes:any[];schedule:any;progress:any;events:any[]};
const initial=():State=>({profile:{name:'Mein Profil',nameStyle:'default',frame:'default',photo_key:null,updatedAt:new Date().toISOString()},age:null,selection:[],meals:[],checks:[],codes:[],schedule:null,progress:{level:0,last_weekly:null,metric:'wall',score:null,video_key:null},events:[]});
const MAX_LEVEL=10000000;
const weekDate=(s:string)=>berlinDate(new Date(Date.parse(s)+7*86400000));
class Problem extends Error{constructor(message:string,public status=400){super(message);}}
function check(ok:unknown,message:string,status=400):asserts ok {if(!ok)throw new Problem(message,status);}
function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});}
function dateValid(v:unknown){return typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;}
Deno.serve(async(req:Request)=>{
 try{
  const token=req.headers.get('Authorization')?.replace(/^Bearer /,'');check(token,'Bitte melde dich an.',401);
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await db.auth.getUser(token);check(user&&!authError,'Deine Sitzung ist abgelaufen.',401);
  const uid=user.id,admin=user.app_metadata?.fit_admin===true;
  const url=new URL(req.url),path=url.pathname.split('/fit-api/')[1]||'',method=req.method;
  const {data:row,error:loadError}=await db.from('fit_accounts').select('data,revision').eq('id',uid).maybeSingle();if(loadError)throw loadError;
  let state:State={...initial(),...row?.data};const revision=row?.revision??null;
  async function save(){
   check(JSON.stringify(state).length<2000000,'Dein Konto ist voll. Bitte entferne alte Einträge.');
   const result=revision===null?await db.from('fit_accounts').insert({id:uid,data:state}).select('id'):await db.from('fit_accounts').update({data:state,revision:revision+1,updated_at:new Date().toISOString()}).eq('id',uid).eq('revision',revision).select('id');
   if(result.error?.code==='23505'||(!result.error&&!result.data?.length))throw new Problem('Gleichzeitig wurde etwas geändert. Bitte erneut versuchen.',409);if(result.error)throw result.error;
  }
  const storage=db.storage.from('fit-private');
  const owned=(key:unknown):key is string=>typeof key==='string'&&key.startsWith(uid+'/')&&!key.includes('..');
  async function remove(keys:(string|null|undefined)[]){const safe=keys.filter(owned);if(safe.length){const r=await storage.remove(safe);if(r.error)throw r.error;}}
  async function media(key:string|null){check(owned(key),'Datei nicht gefunden.',404);const r=await storage.createSignedUrl(key,60);if(r.error)throw r.error;return new Response(null,{status:302,headers:{Location:r.data.signedUrl,'Cache-Control':'private, no-store'}});}
  async function uploadPhoto(value:FormDataEntryValue|null){check(value instanceof File&&value.type==='image/jpeg'&&value.size<=2097152,'Bitte ein JPEG-Foto bis 2 MB verwenden.');const bytes=new Uint8Array(await value.arrayBuffer());check(bytes[0]===255&&bytes[1]===216,'Ungültiges Foto.');const key=uid+'/'+crypto.randomUUID()+'.jpg';const r=await storage.upload(key,bytes,{contentType:'image/jpeg'});if(r.error)throw r.error;return key;}
  async function body(){const text=await req.text();check(text.length<=20000,'Die Anfrage ist zu groß.',413);try{return JSON.parse(text);}catch{throw new Problem('Ungültige Anfrage.');}}
  const unlocked=()=>state.codes.filter(c=>c.redeemed_at);
  function monthly(){const s=state.schedule,last=s?.last_check_at||null,nextDate=last?nextCheckDate(last):null;return {count:s?.count||0,last,nextDate,today:berlinDate(),canCheck:!nextDate||berlinDate()>=nextDate,previous:s?{month:berlinDate(last).slice(0,7),metric:s.metric,score:s.score,days:0,created_at:last}:null,first:!s};}
  function code(reward:any,month:string){return {code:'FIT-'+crypto.randomUUID().replaceAll('-','').slice(0,16).toUpperCase(),month,reward:reward.key,label:reward.label,redeemed_at:null};}
  async function validateVideo(v:any){check(owned(v.videoKey)&&/^[-a-f0-9]+\.video$/.test(v.videoKey.slice(uid.length+1)),'Ungültiges Video.');check(v.fullBody==='true'&&Number.isFinite(Number(v.duration))&&Number(v.duration)>=3&&Number(v.duration)<=10.5,'Bitte bestätige ein Video von 3–10 Sekunden.');const info=await storage.info(v.videoKey);check(!info.error&&info.data&&Number(info.data.size)>0&&Number(info.data.size)<=26214400&&['video/mp4','video/webm','video/quicktime'].includes(String(info.data.contentType)),'Das Video konnte nicht geprüft werden.');return v.videoKey as string;}
  if(path==='account'){
   if(method==='GET')return json({age:state.age,id:uid,email:user.email,admin});
   if(method==='POST'){const b=await body();check(Number.isInteger(b.age)&&b.age>=3&&b.age<=110,'Ungültiges Alter.');state.age=b.age;await save();return json({saved:true});}
  }
  if(path==='chat'&&method==='GET')return json({ready:false});
  if((path==='chat'||path==='week'||/^meals\/[^/]+\/analyze$/.test(path))&&method==='POST')throw new Problem('Kiro ist noch nicht mit einer KI verbunden.',503);
  if(path==='profile'){
   if(method==='GET')return json({profile:{...state.profile,hasPhoto:!!state.profile.photo_key},unlocks:unlocked()});
   if(method==='POST'){const form=await req.formData(),name=String(form.get('name')||'').trim(),nameStyle=String(form.get('nameStyle')||'default'),frame=String(form.get('frame')||'default'),photo=form.get('photo');check(name.length>0&&name.length<=30&&!/[\x00-\x1f]/.test(name),'Bitte einen Namen mit 1–30 Zeichen eingeben.');const allowed=(key:string,type:string)=>key==='default'||(key.startsWith(type+':')&&unlocked().some(c=>c.reward===key));check(allowed(nameStyle,'name')&&allowed(frame,'frame'),'Bitte zuerst den passenden Code einlösen.',403);if(photo)check(unlocked().some(c=>c.reward.startsWith('photo:')),'Profilfoto noch nicht freigeschaltet.',403);const old=state.profile.photo_key,key=photo?await uploadPhoto(photo):old;state.profile={name,nameStyle,frame,photo_key:key,updatedAt:new Date().toISOString()};try{await save();}catch(e){if(key!==old)await remove([key]);throw e;}if(key!==old)await remove([old]);return json({saved:true});}
  }
  if(path==='profile/photo'){
   if(method==='GET')return await media(state.profile.photo_key);
   if(method==='DELETE'){const old=state.profile.photo_key;state.profile.photo_key=null;state.profile.updatedAt=new Date().toISOString();await save();await remove([old]);return json({deleted:true});}
  }
  if(path==='profile/redeem'&&method==='POST'){const b=await body(),c=state.codes.find(c=>c.code===String(b.code).trim().toUpperCase());check(c,'Dieser Code gehört nicht zu deinem Konto.',404);check(!c.redeemed_at,'Dieser Code wurde schon eingelöst.',409);c.redeemed_at=new Date().toISOString();await save();return json({label:c.label});}
  if(path==='cosmetics'){
   if(method==='GET')return json({selection:state.selection});
   if(method==='POST'){const b=await body();check(Array.isArray(b.selection)&&b.selection.length<=10&&b.selection.every((k:unknown)=>typeof k==='string'&&/^(background|appbackground|font|kiro|aura|badge):/.test(k)&&unlocked().some(c=>c.reward===k)),'Diese Auswahl ist nicht freigeschaltet.',403);state.selection=[...new Set<string>(b.selection)];await save();return json({saved:true});}
  }
  if(path==='plan'){
   const window=calendarWindow();
   if(method==='GET')return json({events:state.events.filter(e=>e.date>=window.min&&e.date<=window.max).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)),window});
   if(method==='POST'){const b=await body(),valid=validPlan(b),old=state.events.find(e=>e.id===b.id);if(b.id){check(old,'Termin nicht gefunden.',404);Object.assign(old,valid);}else{state.events=state.events.filter(e=>e.date>=window.min);check(state.events.length<1000,'Bitte zuerst alte Termine entfernen.');state.events.push({...valid,id:crypto.randomUUID(),completed:false});}await save();return json({saved:true});}
   if(method==='PATCH'){const b=await body(),old=state.events.find(e=>e.id===b.id);check(old&&typeof b.completed==='boolean','Termin nicht gefunden.',404);old.completed=b.completed;await save();return json({saved:true});}
   if(method==='DELETE'){const id=url.searchParams.get('id');check(state.events.some(e=>e.id===id),'Termin nicht gefunden.',404);state.events=state.events.filter(e=>e.id!==id);await save();return json({deleted:true});}
  }
  if(path==='meals'){
   if(method==='GET'){const from=url.searchParams.get('from'),to=url.searchParams.get('to');check(dateValid(from)&&dateValid(to),'Ungültiger Zeitraum.');return json({meals:state.meals.filter(m=>m.date>=from!&&m.date<=to!).sort((a,b)=>(b.date+b.created_at).localeCompare(a.date+a.created_at))});}
   if(method==='POST'){const form=await req.formData(),date=String(form.get('date')),description=String(form.get('description')||'').trim();check(dateValid(date)&&description.length<=500,'Bitte Datum und Beschreibung prüfen.');check(state.meals.length<2000,'Bitte zuerst alte Mahlzeiten entfernen.');const key=await uploadPhoto(form.get('photo')),meal={id:crypto.randomUUID(),date,description,photo_key:key,created_at:new Date().toISOString(),feedback:null};state.meals.push(meal);try{await save();}catch(e){await remove([key]);throw e;}return json({meal},201);}
  }
  if(/^meals\/[^/]+\/photo$/.test(path)&&method==='GET'){const m=state.meals.find(m=>m.id===path.split('/')[1]);return await media(m?.photo_key);}
  if(path==='rewards/photo'&&method==='GET'){const m=state.checks.find(c=>c.month===url.searchParams.get('month'));return await media(m?.photo_key);}
  if(path==='rewards'){
   const s=monthly();
   if(method==='GET'){const reward=nextReward(state.codes.map(c=>c.reward));return json({month:currentMonth(),current:state.checks[0]?{...state.checks[0],isVideo:true}:null,history:state.checks,codes:state.codes,reward:reward||{label:'Alle neun Geschenk-Codes freigeschaltet'},complete:!reward,...s});}
   if(method==='POST'){check(s.canCheck,'Dein nächster Monatscheck ist ab '+s.nextDate+' möglich.',409);const b=await body(),score=Number(b.score),metric=String(b.metric);check(metrics[metric]&&Number.isInteger(score)&&score>=1&&score<=200,'Bitte den Trainingswert prüfen.');const current={month:currentMonth(),metric,score,days:0,created_at:new Date().toISOString()},evaluation=evaluate(current,s.previous,s.first);check(evaluation.eligible,evaluation.reason,422);const key=await validateVideo(b);check(!state.checks.some(c=>c.photo_key===key)&&state.progress.video_key!==key,'Bitte ein neues Video aufnehmen.');const reward=nextReward(state.codes.map(c=>c.reward));const old=state.checks.slice(11);state.checks=[{...current,photo_key:key},...state.checks].slice(0,12);state.schedule={last_check_at:current.created_at,count:s.count+1,metric,score};if(reward)state.codes.push(code(reward,current.month));await save();await remove(old.map(c=>c.photo_key));return json({saved:true,evaluation,nextDate:nextCheckDate(current.created_at)});}
   if(method==='DELETE'){const month=url.searchParams.get('month'),old=state.checks.filter(c=>c.month===month);state.checks=state.checks.filter(c=>c.month!==month);await save();await remove(old.map(c=>c.photo_key));return json({deleted:true});}
  }
  if(path==='progress'){
   const p=state.progress,nextDate=p.last_weekly?weekDate(p.last_weekly):null,canCheck=!nextDate||berlinDate()>=nextDate;
   if(method==='GET')return json({level:p.level,nextDate,canCheck,metric:p.metric,score:p.score,maxLevel:MAX_LEVEL});
   if(method==='POST'){check(canCheck,'Nächster Wochencheck: '+nextDate,409);const b=await body(),score=Number(b.score),metric=String(b.metric),experience=Number(b.experience);check(metrics[metric]&&Number.isInteger(score)&&score>=1&&score<=200&&[1,3,5].includes(experience),'Bitte Trainingsangaben prüfen.');check(!p.last_weekly||(metric===p.metric&&score>p.score),'Für ein neues Level muss derselbe Trainingswert höher sein.',422);const key=await validateVideo(b);check(key!==p.video_key&&!state.checks.some(c=>c.photo_key===key),'Bitte ein neues Video aufnehmen.');const now=new Date().toISOString(),level=Math.min(MAX_LEVEL,p.last_weekly?p.level+1:Math.max(p.level,experience));state.progress={level,last_weekly:now,metric,score,video_key:key};await save();await remove([p.video_key]);return json({level,nextDate:weekDate(now),message:'Wochencheck gespeichert. Dein App-Level ist jetzt '+level+'.'});}
  }
  if(path==='admin'){
   if(method==='GET')return json({authenticated:admin,rewards:admin?rewardCatalog.map((r,i)=>({...r,number:i+1,...state.codes.find(c=>c.reward===r.key)})):[]});
   if(method==='POST'){check(admin,'Dieses Benutzerkonto hat keine Admin-Rechte. Ein gemeinsames Passwort gewährt keinen Zugriff.',403);for(const r of rewardCatalog)if(!state.codes.some(c=>c.reward===r.key))state.codes.push(code(r,'admin'));await save();return json({authenticated:true,rewards:rewardCatalog.map((r,i)=>({...r,number:i+1,...state.codes.find(c=>c.reward===r.key)}))});}
   if(method==='DELETE')return json({authenticated:false,rewards:[]});
  }
  if(path==='admin/level'&&method==='POST'){check(admin,'Admin-Rechte erforderlich.',403);const b=await body();check(Number.isInteger(b.level)&&b.level>=0&&b.level<=MAX_LEVEL,'Ungültiges Level.');state.progress.level=b.level;await save();return json({level:b.level});}
  if(path==='profile/reset'&&method==='DELETE'){const b=await body();check(b.confirmed===true,'Bitte Löschen bestätigen.');state=initial();await save();for(let i=0;i<50;i++){const r=await storage.list(uid,{limit:100});if(r.error)throw r.error;if(!r.data.length)break;await remove(r.data.map(f=>uid+'/'+f.name));}return json({deleted:true});}
  throw new Problem('Nicht gefunden.',404);
 }catch(e){if(e instanceof Problem)return json({error:e.message},e.status);console.error('fit-api failure',e instanceof Error?e.name:'database');return json({error:'Speichern oder Laden fehlgeschlagen. Bitte erneut versuchen.'},500);}
});
