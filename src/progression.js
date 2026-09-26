import {VEHICLES, STAGES, MAX_LEVEL, UPGRADES, PAINTS, upgradeCost} from './catalog.js';
export const SAVE_KEY='hill-garage-v3';
const int=(n,max=1e12)=>Number.isFinite(Number(n))?Math.min(max,Math.max(0,Math.floor(Number(n)))):0;
const known=(xs,id)=>xs.some(x=>x.id===id);
export const MISSIONS=[
  ['first','Первый маршрут','Проедь 500 м за все заезды','distance',500,1200],
  ['collector','Звон монет','Собери 60 монет на трассе','pickups',60,1800],
  ['flight','Выше облаков','Проведи 15 секунд в воздухе','airtime',15,2200],
  ['explorer','Исследователь','Открой 3 трассы','stages',3,2500],
  ['mechanic','Механик','Купи 8 улучшений','upgrades',8,3000],
  ['fleet','Автопарк','Открой 5 машин','vehicles',5,3500],
  ['flips','Акробат','Сделай и приземли 3 полных оборота','flips',3,4000],
  ['long','Дальний рейс','Проедь 10 000 м суммарно','distance',10000,5000],
  ['fuel','Всегда в пути','Подбери 20 канистр','refills',20,4500],
  ['veteran','Ещё попытка','Начни 25 заездов в карьере','runs',25,5000],
  ['master','Рекордсмен','Проедь 1500 м за один заезд','best',1500,6000],
  ['tourist','Большое путешествие','Открой 10 трасс','stages',10,10000]
].map(([id,name,description,stat,target,reward])=>({id,name,description,stat,target,reward}));
function defaults(){return {
  version:3,coins:2500,gems:15,ownedVehicles:['car','monowheel'],ownedStages:['countryside'],
  selectedVehicle:'car',selectedStage:'countryside',upgrades:{},records:{},paints:{},
  custom:{frame:'standard',wheels:'standard',engine:'standard'},
  boosters:{nitro:3,fuel:2,magnet:2},stats:{distance:0,pickups:0,airtime:0,flips:0,refills:0,runs:0,best:0},
  claimed:[],dailyClaimed:[],dailyGifts:[],settings:{sound:true,music:false,quality:'auto',hints:true}
};}
/** Strict whitelist: imported JSON never becomes HTML or executable code. */
export function cleanSave(raw){
  const d=defaults(); if(!raw||typeof raw!=='object'||raw.version!==3)return d;
  d.coins=int(raw.coins); d.gems=int(raw.gems);
  d.ownedVehicles=[...new Set(['car','monowheel',...(Array.isArray(raw.ownedVehicles)?raw.ownedVehicles:[])])].filter(id=>known(VEHICLES,id));
  d.ownedStages=[...new Set(['countryside',...(Array.isArray(raw.ownedStages)?raw.ownedStages:[])])].filter(id=>known(STAGES,id));
  if(d.ownedVehicles.includes(raw.selectedVehicle)) d.selectedVehicle=raw.selectedVehicle;
  if(d.ownedStages.includes(raw.selectedStage)) d.selectedStage=raw.selectedStage;
  for(const v of VEHICLES){
    d.upgrades[v.id]={};
    for(const u of UPGRADES)d.upgrades[v.id][u.id]=int(raw.upgrades?.[v.id]?.[u.id],MAX_LEVEL);
    if(PAINTS.includes(raw.paints?.[v.id]))d.paints[v.id]=raw.paints[v.id];
    for(const s of STAGES){const key=`${v.id}:${s.id}`;if(raw.records?.[key])d.records[key]=int(raw.records[key],1e9);}
  }
  for(const key of Object.keys(d.stats))d.stats[key]=int(raw.stats?.[key]);
  for(const key of Object.keys(d.boosters))d.boosters[key]=int(raw.boosters?.[key],9999);
  d.claimed=MISSIONS.filter(m=>raw.claimed?.includes?.(m.id)).map(m=>m.id);
  for(const key of ['dailyClaimed','dailyGifts'])d[key]=(Array.isArray(raw[key])?raw[key]:[]).filter(x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)).slice(-60);
  for(const key of ['sound','music','hints'])if(typeof raw.settings?.[key]==='boolean')d.settings[key]=raw.settings[key];
  if(['auto','low'].includes(raw.settings?.quality))d.settings.quality=raw.settings.quality;
  for(const [key,values] of Object.entries({frame:['standard','light','heavy'],wheels:['standard','large','road'],engine:['standard','sport','diesel']}))
    if(values.includes(raw.custom?.[key]))d.custom[key]=raw.custom[key];
  return d;
}
export class Progress {
  constructor(storage){
    try{this.storage=storage===undefined?globalThis.localStorage:storage;}catch{this.storage=null;}
    this.persistent=!!this.storage;
    try{
      const saved=this.storage?.getItem(SAVE_KEY);
      this.data=saved?cleanSave(JSON.parse(saved)):defaults();
      if(!saved){
        const v=this.storage?.getItem('hillclimb-vehicle');if(['car','monowheel'].includes(v))this.data.selectedVehicle=v;
        for(const id of ['car','monowheel']){
          const n=int(this.storage?.getItem(`hillclimb-best-${id}`)||(id==='car'?this.storage?.getItem('hillclimb-best'):0));
          this.data.records[`${id}:countryside`]=n; this.data.stats.best=Math.max(this.data.stats.best,n);
        }
      }
    }catch{this.data=defaults();}
    this.save();
  }
  save(){try{this.storage?.setItem(SAVE_KEY,JSON.stringify(this.data));}catch{this.persistent=false;}}
  ownsVehicle(id){return this.data.ownedVehicles.includes(id);}
  ownsStage(id){return this.data.ownedStages.includes(id);}
  best(v,s){return this.data.records[`${v}:${s}`]||0;}
  levels(v){return this.data.upgrades[v]||{};}
  spend(amount,action,currency='coins'){
    if(!['coins','gems'].includes(currency)||!Number.isFinite(amount)||amount<0||this.data[currency]<amount)return false;
    this.data[currency]-=amount;action();this.save();return true;
  }
  buyVehicle(id){const v=VEHICLES.find(v=>v.id===id);return !!v&&(this.ownsVehicle(id)||this.spend(v.price,()=>this.data.ownedVehicles.push(id)));}
  buyStage(id){const s=STAGES.find(s=>s.id===id);return !!s&&(this.ownsStage(id)||this.spend(s.price,()=>this.data.ownedStages.push(id)));}
  upgrade(id,key){
    if(!this.ownsVehicle(id)||!UPGRADES.some(u=>u.id===key))return false;
    const level=this.levels(id)[key]||0;if(level>=MAX_LEVEL)return false;
    return this.spend(upgradeCost(level),()=>{this.data.upgrades[id]??={};this.data.upgrades[id][key]=level+1;});
  }
  stat(key){
    if(key==='vehicles')return this.data.ownedVehicles.length;
    if(key==='stages')return this.data.ownedStages.length;
    if(key==='upgrades')return Object.values(this.data.upgrades).reduce((n,v)=>n+Object.values(v).reduce((a,b)=>a+b,0),0);
    return this.data.stats[key]||0;
  }
  claimMission(id){
    const m=MISSIONS.find(m=>m.id===id);
    if(!m||this.data.claimed.includes(id)||this.stat(m.stat)<m.target)return false;
    this.data.claimed.push(id);this.data.coins+=m.reward;this.data.gems+=3;this.save();return true;
  }
  daily(){
    // UTC ISO form is stable even on browsers with a different en-CA locale.
    const d=new Date();const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const n=Array.from(key).reduce((n,c)=>n*31+c.charCodeAt(0),0)>>>0;
    return {key,vehicle:VEHICLES[n%VEHICLES.length].id,stage:STAGES[(n>>>4)%STAGES.length].id,target:500,reward:3500,done:this.data.dailyClaimed.includes(key)};
  }
  claimGift(){const {key}=this.daily();if(this.data.dailyGifts.includes(key))return false;this.data.dailyGifts.push(key);this.data.dailyGifts=this.data.dailyGifts.slice(-60);this.data.coins+=1000;this.data.gems+=5;this.save();return true;}
  completeDaily(distance){const d=this.daily();if(d.done||distance<d.target)return false;this.data.dailyClaimed.push(d.key);this.data.dailyClaimed=this.data.dailyClaimed.slice(-60);this.data.coins+=d.reward;this.data.gems+=10;this.save();return true;}
  export(){return JSON.stringify(this.data,null,2);}
  import(text){
    if(typeof text!=='string'||text.length>150000)throw new Error('Файл слишком большой');
    let raw;try{raw=JSON.parse(text);}catch{throw new Error('Это не JSON-сохранение');}
    if(raw?.version!==3)throw new Error('Неподдерживаемая версия сохранения');
    this.data=cleanSave(raw);this.save();
  }
}
