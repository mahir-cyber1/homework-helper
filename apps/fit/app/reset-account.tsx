'use client';
import {useState} from 'react';
import {Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {AlertDialog,AlertDialogTrigger,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from '@/components/ui/alert-dialog';
import {api} from '@/lib/client-photo';
export default function ResetAccount({disabled=false}:{disabled?:boolean}){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function reset(){
  if(busy)return;setBusy(true);setError('');
  try{
   await api('/api/profile/reset',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({confirmed:true})});
   try{for(const key of Object.keys(localStorage))if(key.startsWith('fit-'))localStorage.removeItem(key);for(const key of Object.keys(sessionStorage))if(key.startsWith('fit-'))sessionStorage.removeItem(key);}catch{}
   window.location.replace('/');
  }catch(e){setError(e instanceof Error?e.message:'Zurücksetzen fehlgeschlagen. Bitte versuche es erneut.');setBusy(false);}
 }
 return <div className="reset-account"><h2>Neu anfangen</h2><p>Entferne dein Profil und alle gespeicherten Fit-Daten dauerhaft.</p><AlertDialog open={open} onOpenChange={value=>{if(!busy){setOpen(value);setError('');}}}><AlertDialogTrigger asChild><Button variant="destructive" disabled={disabled}><Trash2 size={18}/>Account zurücksetzen</Button></AlertDialogTrigger><AlertDialogContent className="reset-dialog" onEscapeKeyDown={e=>{if(busy)e.preventDefault();}}><AlertDialogHeader><AlertDialogTitle>Alle Fit-Daten löschen?</AlertDialogTitle><AlertDialogDescription>Name, Profilfoto, alle Cosmetics, Geschenk-Codes, Level, Wochen- und Monatsfortschritte, Videos, Mahlzeiten, Fotos und Auswertungen werden gelöscht. Deine Altersgruppe wird zurückgesetzt. Das ist nicht rückgängig zu machen. Dein Benutzerkonto für die Anmeldung bleibt bestehen.</AlertDialogDescription></AlertDialogHeader>{error&&<p id="reset-error" className="error" role="alert">{error}</p>}<AlertDialogFooter><AlertDialogCancel disabled={busy}>Abbrechen</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={busy} onClick={e=>{e.preventDefault();void reset();}}>{busy?'Wird gelöscht…':'Alles löschen'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>;
}
