'use client';
import {useState} from 'react';
import {browserClient} from '@/lib/supabase-browser';
import '../login/login.css';
export default function Password(){const [password,setPassword]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);return <main className="login-page"><section className="login-card"><h1>Neues Passwort</h1><form onSubmit={async e=>{e.preventDefault();setBusy(true);const {error}=await browserClient().auth.updateUser({password});setBusy(false);if(error)setMessage(error.message);else location.replace('/');}}><label htmlFor="new-password">Mindestens 8 Zeichen</label><input id="new-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)}/><button className="login-submit" disabled={busy}>Passwort speichern</button><p role="status">{message}</p></form><a href="/">Zurück zu Fit</a></section></main>}
