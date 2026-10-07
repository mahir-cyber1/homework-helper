export function berlinToday(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin'}).format(new Date());}
export function shiftDay(date:string,amount:number){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+amount);return d.toISOString().slice(0,10);}
export function monday(date:string){const d=new Date(date+'T12:00:00Z');return shiftDay(date,-((d.getUTCDay()+6)%7));}
export function displayDate(date:string){return new Intl.DateTimeFormat('de-DE',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));}
