import {monthlyReward} from './rewards.ts';
export function retiredDragon(key:string){return /^(frame|name):gift(07|08|09|10)$/.test(key);}
export type Reward={key:string;type:'frame'|'name'|'photo'|'background'|'appbackground'|'font'|'kiro'|'aura'|'badge';label:string;theme:string;color:string};
const legacyCatalog:Reward[]=[
 {key:'frame:gift01',type:'frame',label:'Azur-Rahmen',theme:'simple',color:'#4c79f5'},
 {key:'name:gift02',type:'name',label:'Azur-Namensstil',theme:'simple',color:'#4c79f5'},
 {key:'frame:gift03',type:'frame',label:'Flieder-Rahmen',theme:'simple',color:'#9174df'},
 {key:'name:gift04',type:'name',label:'Flieder-Namensstil',theme:'simple',color:'#9174df'},
 {key:'frame:gift05',type:'frame',label:'Polarlicht-Rahmen',theme:'aurora',color:'#18b8b5'},
 {key:'name:gift06',type:'name',label:'Polarlicht-Namensstil',theme:'aurora',color:'#18b8b5'},
 {key:'frame:gift07',type:'frame',label:'Drachen-Rahmen',theme:'dragon',color:'#bd7619'},
 {key:'name:gift08',type:'name',label:'Drachen-Namensstil',theme:'dragon',color:'#bd7619'},
 {key:'frame:gift09',type:'frame',label:'Kristalldrachen-Rahmen',theme:'crystal',color:'#7651ce'},
 {key:'name:gift10',type:'name',label:'Kristalldrachen-Namensstil',theme:'crystal',color:'#7651ce'},
 {key:'frame:gift11',type:'frame',label:'Champion-Rahmen',theme:'champion',color:'#29a9be'},
 {key:'name:gift12',type:'name',label:'Champion-Namensstil',theme:'champion',color:'#29a9be'},
];
export const rewardCatalog:Reward[]=[legacyCatalog[10],legacyCatalog[11],...[
 ['photo','Eigenes Profilbild'],['background','Champion-Profilhintergrund'],['appbackground','Champion-Welt · alle Menüs'],['font','Champion-Schrift · ganze App'],['kiro','Champion-Kiro'],['aura','Champion-Lichtaura'],['badge','Champion-Abzeichen']
].map(([type,label])=>({key:type+':champion',type:type as Reward['type'],label,theme:'champion',color:'#29a9be'}))];
export function rewardLook(key:string){if(retiredDragon(key))return {theme:'default',color:'#182238'};const r=[...rewardCatalog,...legacyCatalog].find(r=>r.key===key);if(r)return r;if(/^(frame|name):\d{4}-\d{2}$/.test(key)){const old=monthlyReward(key.split(':')[1]);return {theme:'simple',color:old.color};}return {theme:'default',color:'#182238'};}
export function nextReward(issued:string[]){const left=rewardCatalog.filter(r=>!issued.includes(r.key));if(left.length===0)return null;const early=left.find(r=>r.type==='frame'||r.type==='name'||r.type==='photo');if(early)return early;return left[crypto.getRandomValues(new Uint32Array(1))[0]%left.length];}
export function giftSlot(key:string){return 'champion:'+key;}
