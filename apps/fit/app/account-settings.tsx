'use client';
import {useEffect,useState} from 'react';
import {browserClient} from '@/lib/supabase-browser';
import {Button} from '@/components/ui/button';
export default function AccountSettings(){const [email,setEmail]=useState(''),[error,setError]=useState('');useEffect(()=>{void browserClient().auth.getUser().then(({data})=>setEmail(data.user?.email||''));},[]);return <div className="profile-edit entry-fields"><h2>Dein Benutzerkonto</h2><p>{email}</p><a href="/password">Passwort ändern</a><Button variant="outline" onClick={async()=>{const {error}=await browserClient().auth.signOut({scope:'local'});if(error){setError(error.message);return;}for(const key of Object.keys(localStorage))if(key.startsWith('fit-'))localStorage.removeItem(key);location.replace('/login');}}>Abmelden / Benutzer wechseln</Button>{error&&<p role="alert">{error}</p>}</div>}
