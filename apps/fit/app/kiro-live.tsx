'use client';
import {useEffect,useRef,useState} from 'react';
import {Camera,CameraOff,Mic,MicOff,X,Play} from 'lucide-react';
import {Button} from '@/components/ui/button';
export default function KiroLive({onClose,pulse,startMic}:{onClose:()=>void;pulse:number;startMic:boolean}){
 const [speaking,setSpeaking]=useState(false),[micOn,setMicOn]=useState(false),[cameraOn,setCameraOn]=useState(false),[pending,setPending]=useState(false),[error,setError]=useState('');
 const video=useRef<HTMLVideoElement>(null),audioStream=useRef<MediaStream|null>(null),cameraStream=useRef<MediaStream|null>(null),context=useRef<AudioContext|null>(null),raf=useRef(0),alive=useRef(true),timer=useRef<ReturnType<typeof setTimeout>|null>(null),cameraBusy=useRef(false);
 function demo(){if(timer.current)clearTimeout(timer.current);setSpeaking(true);timer.current=setTimeout(()=>{if(alive.current)setSpeaking(false);},2300);}
 function stopMic(){cancelAnimationFrame(raf.current);audioStream.current?.getTracks().forEach(t=>t.stop());audioStream.current=null;void context.current?.close().catch(()=>{});context.current=null;setMicOn(false);}
 function stopCamera(){cameraStream.current?.getTracks().forEach(t=>t.stop());cameraStream.current=null;if(video.current)video.current.srcObject=null;setCameraOn(false);}
 async function microphone(){if(pending)return;if(micOn){stopMic();return;}setPending(true);setError('');try{
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('Mikrofon in diesem Browser nicht verfügbar. Du kannst die Animation trotzdem testen.');
  const stream=await navigator.mediaDevices.getUserMedia({audio:true});if(!alive.current){stream.getTracks().forEach(t=>t.stop());return;}audioStream.current=stream;
  const Audio=(window as any).AudioContext||(window as any).webkitAudioContext;if(!Audio)throw new Error('Die Mikrofon-Vorschau ist hier nicht verfügbar.');const ctx:AudioContext=new Audio();context.current=ctx;await ctx.resume();if(!alive.current)return;
  const analyser=ctx.createAnalyser();analyser.fftSize=512;ctx.createMediaStreamSource(stream).connect(analyser);const samples=new Uint8Array(analyser.fftSize);let heard=false,lastVoice=0;
  function tick(){if(!alive.current||!audioStream.current)return;analyser.getByteTimeDomainData(samples);let sum=0;for(const value of samples)sum+=(value-128)**2;const loud=Math.sqrt(sum/samples.length)>5;
   if(loud){heard=true;lastVoice=performance.now();}else if(heard&&performance.now()-lastVoice>800){heard=false;demo();}
   raf.current=requestAnimationFrame(tick);
  }setMicOn(true);tick();
 }catch(e){stopMic();if(alive.current)setError(e instanceof Error&&e.message.includes('verfügbar')?e.message:'Mikrofon nicht freigegeben. Erlaube den Zugriff im Browser oder teste die Animation mit dem Knopf.');}finally{if(alive.current)setPending(false);}}
 async function camera(){if(cameraBusy.current)return;if(cameraOn){stopCamera();return;}cameraBusy.current=true;setError('');try{
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('Kamera in diesem Browser nicht verfügbar.');
  const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});if(!alive.current){stream.getTracks().forEach(t=>t.stop());return;}cameraStream.current=stream;setCameraOn(true);
 }catch{if(alive.current)setError('Kamera nicht freigegeben. Erlaube den Kamerazugriff in deinem Browser.');}finally{cameraBusy.current=false;}}
 useEffect(()=>{if(cameraOn&&video.current){video.current.srcObject=cameraStream.current;void video.current.play().catch(()=>{});}},[cameraOn]);
 useEffect(()=>{alive.current=true;demo();if(startMic)void microphone();return()=>{alive.current=false;cancelAnimationFrame(raf.current);if(timer.current)clearTimeout(timer.current);audioStream.current?.getTracks().forEach(t=>t.stop());cameraStream.current?.getTracks().forEach(t=>t.stop());void context.current?.close().catch(()=>{});};},[]);
 useEffect(()=>{if(pulse)demo();},[pulse]);
 return <section className="kiro-live" aria-label="Kiro Sprachvorschau"><div className="live-top"><span>KIRO LIVE · VORSCHAU</span><Button variant="ghost" onClick={onClose} aria-label="Sprachmodus schließen"><X size={20}/></Button></div><div className={'kiro-face '+(speaking?'is-speaking':'')} aria-label={speaking?'Stumme Sprech-Animation':'Kiro Gesicht'} role="img"><img className="morph-logo" src="/kiro-logo.png" alt=""/><div className="face-head"><div className="face-eyes"><i/><i/></div><div className="face-mouth"/></div></div><h2>{speaking?'Sprech-Animation':'Was ist?'}</h2><p className="live-status" role="status">{micOn?'Sprich los. Nach einer Pause bewegt sich Kiros Mund als Demo.':'Teste Kiros Animation oder schalte dein Mikrofon ein.'}</p>{cameraOn&&<div className="live-camera"><video ref={video} autoPlay muted playsInline/><span>Deine Kamera · Vorschau</span></div>}<div className="live-controls"><Button variant="outline" onClick={microphone} disabled={pending} aria-pressed={micOn}>{micOn?<MicOff size={18}/>:<Mic size={18}/>}<span>{pending?'Wird geöffnet…':micOn?'Mikrofon aus':'Mikrofon an'}</span></Button><Button variant="outline" onClick={camera} aria-pressed={cameraOn}>{cameraOn?<CameraOff size={18}/>:<Camera size={18}/>}<span>{cameraOn?'Kamera aus':'Kamera an'}</span></Button><Button variant="ghost" onClick={demo}><Play size={17}/>Animation testen</Button></div><p className="live-note">Noch keine KI-Antworten oder Übungsbewertung. Ton und Kamerabild bleiben auf deinem Gerät und werden nicht aufgezeichnet.</p>{error&&<p className="error" role="alert">{error}</p>}</section>;
}
