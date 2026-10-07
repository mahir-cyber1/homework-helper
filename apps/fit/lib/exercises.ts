export type Exercise={name:string;dose:string;equipment:string;steps:string[];images:string[];weighted?:boolean;minLevel?:number;variant?:boolean};
export function groupAge(age:number){return age<=8?5:age<=11?10:age<=17?15:age<65?30:70;}
export function ageRange(age:number){return age<=8?'3–8 Jahre':age<=11?'9–11 Jahre':age<=17?'12–17 Jahre':age<65?'18–64 Jahre':'65+ Jahre';}
const art=(slug:string)=>[1,3].map(i=>`/exercise-drawings/${slug}-${i}.svg`);
const squat:Exercise={name:'Kniebeuge',dose:'2 × 8–12 Wiederholungen',equipment:'Keines; bei Bedarf stabiler Halt',images:art('bodyweight-squat'),steps:['Stelle dich hüftbreit hin. Halte dich bei Bedarf an einer festen Auflage fest.','Schiebe die Hüfte zurück und beuge die Knie nur so weit, wie es bequem ist. Die Knie folgen den Fußspitzen.','Richte dich kontrolliert wieder auf.']};
const mini:Exercise={name:'Mini-Kniebeuge',dose:'2 × 8–12 Wiederholungen',equipment:'Stabiler Stuhl zum Festhalten',images:art('bodyweight-squat'),steps:['Halte dich an einer stabilen Stuhllehne fest, Füße hüftbreit.','Beuge die Knie ein kleines Stück. Die Knie folgen den Fußspitzen.','Richte dich langsam wieder auf.']};
const push:Exercise={name:'Liegestütz an der Wand',dose:'2 × 8–12 Wiederholungen',equipment:'Wand',images:art('wall-push-up'),steps:['Stelle die Hände auf Brusthöhe an die Wand und gehe etwas zurück.','Halte den Körper gerade und beuge die Ellenbogen langsam.','Drücke dich kontrolliert von der Wand weg.']};
const narrow:Exercise={...push,name:'Wandliegestütz – leichter Einstieg',steps:['Stelle die Hände auf Brusthöhe schulterbreit an die Wand und bleibe nah davor.','Halte den Körper gerade und beuge die Ellenbogen langsam. Ein kleiner Bewegungsweg genügt.','Drücke dich zurück. Bleibe nah an der Wand, wenn es zu schwer wird.']};
const leg:Exercise={name:'Bird Dog',dose:'2 × 6–8 je Seite',equipment:'Matte',images:art('bird-dog'),steps:['Komme in den Vierfüßlerstand. Hände unter die Schultern, Knie unter die Hüfte.','Strecke einen Arm und das gegenüberliegende Bein langsam aus. Der Rücken bleibt ruhig.','Kehre zurück und wechsle die Seite. Strecke nur so weit, wie du stabil bleibst.']};
const bridge:Exercise={name:'Beckenheben',dose:'2 × 8–12 Wiederholungen',equipment:'Matte',images:art('glute-bridge'),steps:['Lege dich auf den Rücken, stelle die Füße auf und beuge die Knie.','Hebe das Becken, bis Schultern, Hüfte und Knie eine Linie bilden.','Senke langsam ab. Vermeide ein Hohlkreuz.']};
const curl:Exercise={name:'Bizeps-Curl',dose:'2 × 8–12 Wiederholungen',equipment:'Leichte Hanteln',weighted:true,images:art('bicep-curl'),steps:['Stehe aufrecht, Arme neben dem Körper, Handflächen nach vorn.','Beuge die Ellenbogen und führe die Hanteln langsam nach oben.','Senke sie kontrolliert ab, ohne mit dem Oberkörper zu schwingen.']};
const row:Exercise={name:'Rudern mit Hantel',dose:'2 × 8–12 je Seite',equipment:'Leichte Hantel, stabile Auflage',weighted:true,images:art('one-arm-dumbbell-row'),steps:['Stütze dich auf einer festen Auflage ab und neige den Oberkörper aus der Hüfte.','Ziehe die Hantel mit dem Ellenbogen nah am Körper Richtung Hüfte.','Senke sie langsam ab und halte den Rücken ruhig.']};
const dead:Exercise={name:'Dead Bug',dose:'2 × 6–8 je Seite',equipment:'Matte',images:art('dead-bug'),steps:['Lege dich auf den Rücken und hebe Arme und gebeugte Beine an.','Strecke einen Arm und das gegenüberliegende Bein langsam vom Körper weg.','Halte den unteren Rücken ruhig. Kehre zurück und wechsle die Seite.']};
const circles:Exercise={name:'Armkreisen',dose:'2 × 15–20 Sekunden',equipment:'Keines',images:art('arm-circles'),steps:['Stehe aufrecht und strecke die Arme seitlich aus.','Zeichne kleine, langsame Kreise. Die Schultern bleiben entspannt.','Senke die Arme für eine Pause und wechsle die Kreisrichtung.']};
const calf:Exercise={name:'Wadenheben',dose:'2 × 8–12 Wiederholungen',equipment:'Stabile Auflage zum Festhalten',images:art('calf-raise'),steps:['Stehe aufrecht und halte dich an einer festen Auflage fest.','Hebe beide Fersen langsam vom Boden.','Senke sie kontrolliert wieder ab.']};
const side:Exercise={name:'Seitheben',dose:'2 × 8–12 Wiederholungen',equipment:'Sehr leichte Hanteln',weighted:true,images:art('lateral-raise'),steps:['Stehe aufrecht mit leicht gebeugten Ellenbogen.','Hebe die Arme seitlich bis höchstens Schulterhöhe.','Senke langsam ab. Die Schultern bleiben entspannt.']};
const press:Exercise={name:'Brustdrücken mit Hanteln',dose:'2 × 8–12 Wiederholungen',equipment:'Stabile Trainingsbank, leichte Hanteln',weighted:true,images:art('dumbbell-bench-press'),steps:['Lege dich auf eine stabile Trainingsbank. Füße fest am Boden, Hanteln über der Brust.','Senke die Ellenbogen langsam seitlich bis etwa auf Schulterhöhe. Schultern bleiben ruhig.','Drücke die Hanteln kontrolliert wieder hoch.']};
const kick:Exercise={name:'Trizeps-Kickback',dose:'2 × 8–12 je Seite',equipment:'Leichte Hantel',weighted:true,images:art('tricep-kickback'),steps:['Neige den Oberkörper aus der Hüfte, Rücken ruhig.','Halte den Oberarm nah am Körper und strecke den Ellenbogen langsam.','Beuge ihn wieder kontrolliert, ohne zu schwingen.']};
export const groups:Record<string,Exercise[]>={'Ganzkörper':[squat,push,dead,bridge],'Brust':[push,narrow,press],'Rücken':[leg,bridge,row],'Arme':[curl,kick,push,narrow],'Schultern':[circles,side,push],'Bauch':[dead,bridge],'Beine & Po':[squat,mini,bridge,calf]};
const variation=(base:Exercise,name:string,instruction:string,minLevel=0):Exercise=>({...base,name,minLevel,variant:true,steps:[...base.steps,instruction]});
const extra:Record<string,Exercise[]>={
 'Ganzkörper':[
  leg,calf,circles,
  variation(squat,'Kniebeuge mit ruhigem Absenken','Senke dich in etwa 3 Sekunden ab. Bleibe im bequemen Bewegungsbereich.',3),
  variation(push,'Wandliegestütz mit kurzer Pause','Halte in einer bequemen gebeugten Position eine Sekunde inne, dann drücke dich zurück.',5),
  variation(leg,'Bird Dog mit kontrolliertem Zurückführen','Führe Arm und Bein langsam zurück, ohne seitlich auszuweichen.',10),
  variation(bridge,'Beckenheben mit gleichmäßigem Tempo','Hebe und senke das Becken jeweils in etwa 3 Sekunden. Atme dabei weiter.',20),
  variation(dead,'Dead Bug mit genauer Seitenkontrolle','Pausiere nach jedem Seitenwechsel kurz in der Ausgangsposition und prüfe, ob dein Rücken ruhig bleibt.',30)
 ],
 'Brust':[
  variation(push,'Wandliegestütz mit kleinem Bewegungsweg','Beuge die Ellenbogen nur ein kleines Stück. Eine saubere, schmerzfreie Bewegung genügt.'),
  variation(push,'Wandliegestütz mit ruhigem Absenken','Beuge die Ellenbogen in etwa 3 Sekunden. Bleibe so nah an der Wand, dass die Bewegung leicht bleibt.',3),
  variation(push,'Wandliegestütz mit kurzer Pause','Pausiere eine Sekunde in einer bequemen gebeugten Position.',5),
  variation(push,'Wandliegestütz mit bewusster Ausatmung','Atme beim Wegdrücken aus. Halte den Atem nicht an.',10),
  variation(press,'Brustdrücken mit langsamer Rückführung','Senke die sehr leichten Hanteln in etwa 3 Sekunden kontrolliert ab.',20),
  variation(push,'Wandliegestütz mit gleichmäßigem Rhythmus','Drücke und senke jeweils in etwa 3 Sekunden. Qualität ist wichtiger als Anzahl.',30)
 ],
 'Rücken':[
  variation(leg,'Bird Dog mit kleinem Bewegungsweg','Strecke Arm und Bein nur ein Stück aus, bis du die Position sicher halten kannst.'),
  variation(bridge,'Beckenheben mit kleinem Bewegungsweg','Hebe dein Becken nur so weit an, wie dein Rücken bequem und ruhig bleibt.'),
  variation(leg,'Bird Dog mit kurzer Pause','Halte die ausgestreckte Position eine Sekunde, ohne ins Hohlkreuz zu fallen.',3),
  variation(bridge,'Beckenheben mit ruhigem Absenken','Senke das Becken in etwa 3 Sekunden ab.',5),
  variation(leg,'Bird Dog mit langsamer Rückführung','Kehre in etwa 3 Sekunden in den Vierfüßlerstand zurück.',10),
  variation(row,'Rudern mit kurzer Pause','Halte die leichte Hantel oben eine Sekunde, ohne die Schulter hochzuziehen.',20),
  variation(leg,'Bird Dog mit gleichmäßigem Rhythmus','Strecke und führe jeweils langsam zurück. Die Hüfte bleibt parallel zum Boden.',30)
 ],
 'Arme':[
  circles,
  variation(push,'Wandliegestütz mit kleinem Bewegungsweg','Beginne nah an der Wand und bewege dich nur im bequemen Bereich.'),
  variation(push,'Wandliegestütz mit ruhiger Rückführung','Beuge die Ellenbogen langsam in etwa 3 Sekunden.',3),
  variation(circles,'Armkreisen mit Richtungswechsel','Wechsle die Kreisrichtung nach einer kurzen Pause. Die Kreise bleiben klein.',5),
  variation(push,'Wandliegestütz mit kurzer Pause','Halte die bequeme gebeugte Position eine Sekunde.',10),
  variation(curl,'Bizeps-Curl mit langsamer Rückführung','Senke die leichte Hantel in etwa 3 Sekunden ohne Schwung.',20),
  variation(push,'Wandliegestütz mit gleichmäßigem Tempo','Beuge und strecke die Ellenbogen jeweils langsam und atme ruhig weiter.',30)
 ],
 'Schultern':[
  variation(circles,'Armkreisen rückwärts','Zeichne kleine Rückwärtskreise. Halte deine Schultern entspannt.'),
  variation(circles,'Armkreisen mit kurzen Pausen','Senke deine Arme zwischendurch ab und lockere die Schultern.'),
  variation(circles,'Armkreisen mit Richtungswechsel','Wechsle nach einer Pause von vorwärts zu rückwärts.',3),
  variation(push,'Wandliegestütz mit bewusster Schulterkontrolle','Halte die Schultern fern von den Ohren und vermeide ein Hochziehen.',5),
  variation(circles,'Armkreisen mit gleichmäßigem Rhythmus','Halte die Kreise klein und gleichmäßig. Mehr Tempo ist nicht nötig.',10),
  variation(side,'Seitheben mit langsamer Rückführung','Senke die sehr leichten Hanteln in etwa 3 Sekunden.',20),
  variation(push,'Wandliegestütz mit ruhigem Tempo','Bewege dich langsam in beide Richtungen und lasse die Schultern entspannt.',30)
 ],
 'Bauch':[
  leg,
  variation(dead,'Dead Bug mit kleinem Bewegungsweg','Strecke Arm und Bein nur so weit, wie der untere Rücken ruhig bleiben kann.'),
  variation(bridge,'Beckenheben mit bewusster Atmung','Atme beim Anheben aus und beim Absenken ein. Halte die Luft nicht an.'),
  variation(dead,'Dead Bug mit langsamer Rückführung','Kehre in etwa 3 Sekunden zur Ausgangsposition zurück.',3),
  variation(leg,'Bird Dog mit kurzer Pause','Halte die ausgestreckte Position eine Sekunde. Der Rumpf bleibt ruhig.',5),
  variation(dead,'Dead Bug mit bewusster Ausatmung','Atme beim Ausstrecken ruhig aus und halte den Rücken stabil.',10),
  variation(bridge,'Beckenheben mit kontrollierter Pause','Pausiere oben eine Sekunde ohne Hohlkreuz.',20),
  variation(dead,'Dead Bug mit gleichmäßigem Rhythmus','Strecke langsam aus und führe langsam zurück. Bei nachlassender Kontrolle mache eine Pause.',30)
 ],
 'Beine & Po':[
  variation(calf,'Wadenheben mit kleinem Bewegungsweg','Hebe die Fersen nur ein Stück. Halte dich an einer festen Auflage fest.'),
  variation(bridge,'Beckenheben mit bewusster Atmung','Atme beim Anheben aus. Bleibe im bequemen Bewegungsweg.'),
  variation(squat,'Kniebeuge mit ruhigem Absenken','Senke dich in etwa 3 Sekunden ab.',3),
  variation(calf,'Wadenheben mit kurzer Pause','Halte oben eine Sekunde, mit festem Halt.',5),
  variation(bridge,'Beckenheben mit langsamer Rückführung','Senke das Becken in etwa 3 Sekunden ab.',10),
  variation(squat,'Kniebeuge mit gleichmäßigem Rhythmus','Senke und richte dich jeweils in etwa 3 Sekunden auf.',20),
  variation(calf,'Wadenheben mit genauer Bewegungskontrolle','Hebe und senke beide Fersen langsam. Vermeide ein Ausweichen der Knöchel.',30)
 ]
};
export const UNLOCK_LEVELS=[3,5,10,20,30];
export function ageBand(age:number){return age<6?'Spielerische Bewegung':age<13?'Kinder · Bewegung & Technik':age<18?'Jugendliche · Grundlagen':age>=65?'65+ · Kraft & Stabilität':'Erwachsene · Krafttraining';}
export function exerciseCatalogForAge(age:number):Record<string,Exercise[]>{
 if(age<6)return {'Ganzkörper':[mini,circles,calf,variation(circles,'Kleine Rückwärtskreise','Probiere kleine Kreise in die andere Richtung.'),variation(mini,'Langsame Mini-Kniebeuge','Bewege dich langsam mit einem Erwachsenen und stabilem Halt.',3),variation(circles,'Kreise mit einer Pause','Senke die Arme ab, lockere sie und beginne wieder, wenn du möchtest.',5),variation(calf,'Ruhiges Wadenheben','Mit festem Halt: Hebe und senke beide Fersen langsam.',10),variation(mini,'Mini-Kniebeuge mit ruhiger Atmung','Atme ruhig weiter, während du die Knie ein kleines Stück beugst.',20),variation(circles,'Gleichmäßige kleine Kreise','Versuche kleine, gleichmäßige Kreise ohne Eile.',30)].map(e=>({...e,dose:'Ein paar lockere Bewegungen, solange es Spaß macht'}))};
 const gentle=age<13||age>=65;
 return Object.fromEntries(Object.entries(groups).map(([name,list])=>[name,[...list,...extra[name]].filter(e=>!(age<18&&e.weighted)&&!(age>=65&&e.weighted)).map(e=>({...e,dose:gentle?(e.dose.includes('Sekunden')?'1 × 10–15 Sekunden':e.dose.includes('je Seite')?'1 × 4–6 je Seite':'1 × 6–8 Wiederholungen'):age<18?(e.dose.includes('je Seite')?'1–2 × 6 je Seite':e.dose.includes('Sekunden')?'1–2 × 15 Sekunden':'1–2 × 6–10 Wiederholungen'):e.dose}))]));
}
export function exercisesForAge(age:number,level=0):Record<string,Exercise[]>{return Object.fromEntries(Object.entries(exerciseCatalogForAge(age)).map(([group,list])=>[group,list.filter(e=>(e.minLevel||0)<=level)]));}
