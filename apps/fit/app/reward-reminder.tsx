'use client';
import {useState,useEffect} from 'react';
import {Bell} from 'lucide-react';
import {api} from '@/lib/client-photo';
export default function RewardReminder({onOpen}:{onOpen:()=>void}){
 const [ready,setReady]=useState(false);
 useEffect(()=>{let live=true;async function refresh(){try{const d=await api<{count:number;canCheck:boolean}>('/api/rewards');if(live)setReady(d.count>0&&d.canCheck);}catch{if(live)setReady(false);}}void refresh();const timer=setInterval(()=>{if(document.visibilityState==='visible')void refresh();},60000);const visible=()=>{if(document.visibilityState==='visible')void refresh();};document.addEventListener('visibilitychange',visible);window.addEventListener('reward-updated',visible);return()=>{live=false;clearInterval(timer);document.removeEventListener('visibilitychange',visible);window.removeEventListener('reward-updated',visible);};},[]);
 return ready?<button className="reward-reminder" onClick={onOpen} aria-label="Dein neuer Video-Check ist freigeschaltet. Geschenke öffnen"><Bell size={19}/><span>Video-Check bereit</span></button>:null;
}
