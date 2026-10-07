'use client';
import {useState,useEffect} from 'react';
import {api} from '@/lib/client-photo';
import RewardLook from './reward-look';
type Profile={name:string;nameStyle:string;frame:string;hasPhoto:boolean;updatedAt:string};
export default function ProfileShortcut({onOpen,active}:{onOpen:()=>void;active:boolean}){
 const [p,setP]=useState<Profile>({name:'Sportfreund',nameStyle:'default',frame:'default',hasPhoto:false,updatedAt:''});
 useEffect(()=>{let mounted=true;const load=()=>api<{profile:Profile}>('/api/profile').then(d=>{if(mounted)setP(d.profile);}).catch(()=>{});void load();window.addEventListener('profile-updated',load);return()=>{mounted=false;window.removeEventListener('profile-updated',load);};},[]);
 return <button className={'profile-shortcut '+(active?'selected':'')} onClick={onOpen} aria-label={'Profil von '+p.name+' öffnen'} aria-pressed={active}><RewardLook name={p.name} frame={p.frame} nameStyle={p.nameStyle} photoSrc={p.hasPhoto?'/api/profile/photo?v='+encodeURIComponent(p.updatedAt):undefined}/></button>;
}
