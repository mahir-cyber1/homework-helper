'use client';
import {UserRound,Crown,Sparkles,Gem} from 'lucide-react';
import {rewardLook} from '@/lib/reward-catalog';
export default function RewardLook({name='Sportfreund',frame='default',nameStyle='default',photoSrc}:{name?:string;frame?:string;nameStyle?:string;photoSrc?:string}){
 const f=rewardLook(frame),n=rewardLook(nameStyle);
 return <div className="reward-look rank-upgrade">
  <div className={'profile-avatar look-frame theme-'+f.theme} style={{'--look-color':f.color} as React.CSSProperties}>
   {f.theme==='champion'&&<span className="champion-title"><Crown size={17} aria-hidden="true"/><strong>CHAMPION</strong></span>}
   <div className="avatar-inner">{photoSrc?<img src={photoSrc} alt="Dein Profilfoto"/>:<UserRound size={39}/>}</div>
   {f.theme==='aurora'&&<span className="frame-emblem aurora-emblem" aria-hidden="true"><Sparkles size={18}/></span>}
   {['dragon','crystal'].includes(f.theme)&&<span className="frame-emblem" aria-hidden="true">🐉</span>}
   {f.theme==='champion'&&<><span className="frame-emblem champion-crown"><Crown size={19}/></span><span className="look-bubbles" aria-hidden="true"><i/><i/><i/><i/></span></>}
  </div>
  <h2 className={'look-name theme-'+n.theme} style={{'--look-color':n.color} as React.CSSProperties}>
   {n.theme==='champion'&&<Crown className="name-crown" size={19} aria-hidden="true"/>}
   {n.theme==='aurora'&&<Sparkles size={17} aria-hidden="true"/>}
   {n.theme==='crystal'&&<Gem size={18} aria-hidden="true"/>}
   <span className="rank-display-name">{name}</span>
   {['dragon','crystal'].includes(n.theme)&&<span className="name-emblem" aria-hidden="true">🐉</span>}
   {n.theme==='champion'&&<span className="name-bubbles" aria-hidden="true"><i/><i/><i/></span>}
  </h2>
 </div>;
}
