'use client';
import {useEffect,useState} from 'react';
import {api} from '@/lib/client-photo';
import {Button} from '@/components/ui/button';
export default function ChampionSettings({unlocks}:{unlocks:{reward:string;label:string}[]}){
 const [selection,setSelection]=useState<string[]>([]),[busy,setBusy]=useState(false),[note,setNote]=useState('');
 useEffect(()=>{api<{selection:string[]}>('/api/cosmetics').then(d=>setSelection(d.selection)).catch(()=>setNote('Dein Look konnte nicht geladen werden.'));},[]);
 async function save(){setBusy(true);try{await api('/api/cosmetics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({selection})});window.dispatchEvent(new Event('cosmetics-updated'));setNote('Champion-Look gespeichert.');}catch(e){setNote(e instanceof Error?e.message:'Speichern fehlgeschlagen.');}finally{setBusy(false);}}
 const extras=unlocks.filter(r=>/^(background|appbackground|font|kiro|aura|badge):/.test(r.reward));
 return <div className="champion-settings"><h2>Deine Champion-Welt</h2>{extras.length?extras.map(r=><label key={r.reward}><input type="checkbox" checked={selection.includes(r.reward)} onChange={e=>setSelection(s=>e.target.checked?[...s,r.reward]:s.filter(k=>k!==r.reward))}/>{r.label}</label>):<p className="muted">Hintergründe, Schrift und Kiro-Looks erscheinen nach dem Einlösen deiner Geschenk-Codes.</p>}{extras.length>0&&<Button disabled={busy} onClick={save}>{busy?'Wird gespeichert…':'Look übernehmen'}</Button>}{note&&<p role="status">{note}</p>}</div>;
}
