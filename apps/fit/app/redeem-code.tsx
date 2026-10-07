'use client';
import {useState} from 'react';
import {Gift} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {api} from '@/lib/client-photo';
export default function RedeemCode({onRedeemed}:{onRedeemed?:()=>void}){
 const [code,setCode]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[note,setNote]=useState('');
 async function redeem(){if(busy)return;setBusy(true);setError('');setNote('');try{const r=await api<{label:string}>('/api/profile/redeem',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});setCode('');setNote('Freigeschaltet: '+r.label);onRedeemed?.();}catch(e){setError(e instanceof Error?e.message:'Code nicht gültig.');}finally{setBusy(false);}}
 return <div className="redeem-box"><span className="bonus-icon"><Gift size={23}/></span><h2>Geschenk-Code einlösen</h2><form onSubmit={e=>{e.preventDefault();void redeem();}}><Input aria-label="Dein Geschenk-Code" value={code} maxLength={24} onChange={e=>setCode(e.target.value)} placeholder="FIT-…" autoCapitalize="characters" autoComplete="off" spellCheck={false}/><Button type="submit" disabled={busy||!code.trim()}>{busy?'…':'Einlösen'}</Button></form>{error&&<p className="error" role="alert">{error}</p>}{note&&<p className="save-note" role="status">{note}</p>}</div>;
}
