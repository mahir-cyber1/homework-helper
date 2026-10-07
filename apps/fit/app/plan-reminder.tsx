'use client';
import {useState,useEffect,useRef} from 'react';
import {Bell,X} from 'lucide-react';
import {api} from '@/lib/client-photo';
import type {PlanEvent} from '@/lib/planner';
export default function PlanReminder({onStart}:{onStart:(category:string)=>void}){
 const [due,setDue]=useState<PlanEvent[]>([]),[events,setEvents]=useState<PlanEvent[]>([]);const seen=useRef(new Set<string>());
 useEffect(()=>{let live=true;const load=()=>api<{events:PlanEvent[]}>('/api/plan').then(d=>{if(live)setEvents(d.events);}).catch(()=>{});void load();const timer=setInterval(load,60000);window.addEventListener('plan-updated',load);window.addEventListener('focus',load);return()=>{live=false;clearInterval(timer);window.removeEventListener('plan-updated',load);window.removeEventListener('focus',load);};},[]);
 useEffect(()=>{function check(){const now=Date.now();for(const e of events){const key=e.id+e.startsAt,delta=now-Date.parse(e.startsAt);if(e.completed||delta<0||delta>86400000||seen.current.has(key))continue;try{if(localStorage.getItem('fit-plan-reminded-'+key))continue;localStorage.setItem('fit-plan-reminded-'+key,'1');}catch{}seen.current.add(key);setDue(d=>[...d,e]);if(delta<300000&&'Notification' in window&&Notification.permission==='granted'){try{const n=new Notification('Beginn mit dem Training',{body:e.title+' · '+e.time,tag:key,icon:'/fit-icon.jpg'});n.onclick=()=>{window.focus();onStart(e.category);n.close();};}catch{}}}}check();const timer=setInterval(check,15000);document.addEventListener('visibilitychange',check);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',check);};},[events,onStart]);
 if(!due.length)return null;const e=due[0];return <aside className="plan-reminder" role="status"><Bell size={21}/><div><strong>Beginn mit dem Training</strong><span>{e.title} · {e.time} Uhr</span></div><button onClick={()=>{onStart(e.category);setDue(d=>d.slice(1));}}>Training öffnen</button><button className="dismiss" aria-label="Erinnerung schließen" onClick={()=>setDue(d=>d.slice(1))}><X size={20}/></button></aside>;
}
