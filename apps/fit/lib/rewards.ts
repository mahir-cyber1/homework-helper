export const metrics:Record<string,string>={wall:'Wandliegestütze · Wiederholungen',squat:'Kniebeugen · Wiederholungen',walk:'Gehen · Minuten bei gleichem Tempo'};
export function currentMonth(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit'}).format(new Date());}
export function previousMonth(month:string){const d=new Date(month+'-15T12:00:00Z');d.setUTCMonth(d.getUTCMonth()-1);return d.toISOString().slice(0,7);}
export function monthLabel(month:string){return new Intl.DateTimeFormat('de-DE',{month:'long',year:'numeric',timeZone:'Europe/Berlin'}).format(new Date(month+'-15T12:00:00Z'));}
export function monthlyReward(month:string){const n=Number(month.slice(5,7));const type=n%3===1?'frame':n%3===2?'name':'photo';const labels={frame:'Monatsrahmen',name:'Namensstil',photo:'Eigenes Profilfoto'};return {key:type+':'+month,type,label:labels[type]+' · '+monthLabel(month),color:`hsl(${(Number(month.slice(0,4))*12+n)*137.508%360} 68% 45%)`};}
export type Checkin={month:string;metric:string;score:number;days:number;created_at:string};
export function evaluate(current:Checkin,previous:Checkin|null,first=false){
 if(first)return {eligible:true,gain:null,reason:'Dein erster Video-Check: Der Startbonus ist freigeschaltet.'};
 if(!previous||previous.metric!==current.metric)return {eligible:false,gain:null,reason:'Für deinen nächsten Code fehlt ein vergleichbarer Leistungswert aus deinem letzten Check.'};
 const gain=Math.round((current.score-previous.score)/previous.score*1000)/10;
 const eligible=current.score>previous.score;
 return {eligible,gain,reason:eligible?'Dein Trainingswert ist gestiegen. Dein Geschenk-Code ist freigeschaltet.':'Noch kein Geschenk-Code: Gleiche oder niedrigere Trainingswerte zählen nicht als Verbesserung.'};
}

export function berlinDate(date:Date|string=new Date()){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(date));}
export function nextCheckDate(timestamp:string){const [y,m,d]=berlinDate(timestamp).split('-').map(Number);const end=new Date(Date.UTC(y,m+1,0)).getUTCDate();return new Date(Date.UTC(y,m,Math.min(d,end))).toISOString().slice(0,10);}
export function dateLabel(date:string){return new Intl.DateTimeFormat('de-DE',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Berlin'}).format(new Date(date+'T12:00:00Z'));}
