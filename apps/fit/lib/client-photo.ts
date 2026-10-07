import {browserClient} from './supabase-browser';
export async function preparePhoto(file:File){if(file.size>20*1024*1024)throw new Error('Bitte wähle ein Foto unter 20 MB.');const url=URL.createObjectURL(file);try{const image=new Image();await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error('Das Foto konnte nicht geöffnet werden. Bitte wähle JPEG, PNG oder WebP.'));image.src=url;});const ratio=Math.min(1,1280/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*ratio);canvas.height=Math.round(image.height*ratio);const context=canvas.getContext('2d');if(!context)throw new Error('Das Foto konnte nicht verarbeitet werden.');context.drawImage(image,0,0,canvas.width,canvas.height);const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Das Foto konnte nicht verarbeitet werden.')),'image/jpeg',.82));if(blob.size>2*1024*1024)throw new Error('Das Foto ist zu groß.');return new File([blob],'foto.jpg',{type:'image/jpeg'});}finally{URL.revokeObjectURL(url);}}
export async function api<T>(url:string,options?:RequestInit):Promise<T>{let uploaded:string|null=null;
 if(options?.body instanceof FormData&&options.body.get('video') instanceof File){
  const form=options.body,file=form.get('video') as File,client=browserClient();
  const {data:{user}}=await client.auth.getUser();if(!user)throw new Error('Bitte melde dich an.');
  uploaded=user.id+'/'+crypto.randomUUID()+'.video';
  const result=await client.storage.from('fit-private').upload(uploaded,file,{contentType:file.type});if(result.error)throw new Error('Video-Upload fehlgeschlagen: '+result.error.message);
  const body:Record<string,string>={videoKey:uploaded};form.forEach((v,k)=>{if(typeof v==='string')body[k]=v;});
  options={...options,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)};
 }
 const response=await fetch(url,options);
 if(response.status===401){location.replace('/login');throw new Error('Bitte erneut anmelden.');}
 if(!response.ok&&uploaded)await browserClient().storage.from('fit-private').remove([uploaded]);
 const data=await response.json() as T&{error?:string};if(!response.ok)throw new Error(data.error||'Die Daten konnten nicht geladen werden.');return data;}
