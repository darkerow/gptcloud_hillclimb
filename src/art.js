import {vehiclePreview} from './vehicle-art.js';
import {hex} from './catalog.js';
export const icons={
  wheel:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="m6 6 4 4m4 4 4 4M6 18l4-4m4-4 4-4"/>',
  flag:'<path d="M5 21V3m0 1c5-4 9 4 15 0v11c-6 4-10-4-15 0"/>',
  engine:'<path d="M5 7h12l4 4v7H5l-3-3V9h3m3-5h6m-3 0v3m-9 4v6m19-8v10"/>',
  spring:'<path d="M8 2h8l-9 4 10 4-10 4 10 4-9 4h8"/>',
  fuel:'<path d="M4 21V4h10v17M4 11h10m0 3h3v5a2 2 0 0 0 4 0V8l-4-4M2 21h14"/>',
  bolt:'<path d="m14 2-9 12h6l-1 8 9-13h-6z"/>',
  trophy:'<path d="M7 3h10v6a5 5 0 0 1-10 0V3Zm0 2H3v3a4 4 0 0 0 5 4m9-7h4v3a4 4 0 0 1-5 4m-4 2v5m-4 2h8"/>',
  settings:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
  pause:'<path d="M8 4v16M16 4v16"/>',
  play:'<path d="m8 4 12 8-12 8z"/>',
  back:'<path d="m14 5-7 7 7 7"/>',
  coin:'<circle cx="12" cy="12" r="9"/><path d="M12 6v12m3-9h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9"/>',
  gem:'<path d="m7 3-5 6 10 13L22 9l-5-6ZM2 9h20M7 3l5 19 5-19"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/>',
  check:'<path d="m4 12 5 5L20 6"/>',
  garage:'<path d="M3 21V9l9-7 9 7v12M7 21V11h10v10M7 15h10M7 18h10"/>',
  shop:'<path d="m4 8 2-5h12l2 5m-16 0v12h16V8M3 8h18M8 20v-7h8v7"/>',
  sound:'<path d="M3 9h4l6-5v16l-6-5H3Zm14-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16"/>',
  reset:'<path d="M4 10a8 8 0 1 1 1 8M4 3v7h7"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>'
};
export const icon=(name)=>`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.wheel}</svg>`;
export function vehicleArt(v){return `<img class="vehicle-art" src="${vehiclePreview(v)}" alt="${v.name}" draggable="false" width="360" height="200">`;}
let previewId=0;
export function stageArt(s){
 const id=`vista-${s.id}-${previewId++}`,[sky,soil,cap,line,mount,accent]=s.palette.map(hex),dark=['night','moon','mars','purple','lava'].includes(s.theme),ice=s.theme==='ice';
 let props='';
 const tree=(x,y,i)=>s.id==='forest'||ice?`<path d="M${x} ${y}v-51" stroke="#66513b" stroke-width="6"/><path d="m${x-22} ${y-9} 22-60 23 60Zm5-20 17-48 18 48" fill="${ice?'#598d88':'#3f7e43'}" stroke="#365b3c" stroke-width="2"/>`:`<path d="M${x} ${y}v-49" stroke="#6d5039" stroke-width="6"/><path d="m${x} ${y-18}-15-20m15 16 17-21" stroke="#6d5039" stroke-width="3"/><g fill="${s.theme==='autumn'?'#d5953b':'#64a743'}" stroke="${s.theme==='autumn'?'#996539':'#427d3b'}" stroke-width="2"><circle cx="${x-17}" cy="${y-46}" r="20"/><circle cx="${x+16}" cy="${y-48}" r="22"/><circle cx="${x-2}" cy="${y-65}" r="24"/></g><circle cx="${x-8}" cy="${y-71}" r="14" fill="${s.theme==='autumn'?'#efc45b':'#8ec455'}"/>`;
 for(let i=0;i<6;i++){
  const x=30+i*115,y=219+Math.sin(i*2+s.seed)*15;
  if(['green','forest','autumn','night'].includes(s.theme)&&s.hazard!=='ceiling')props+=tree(x,y,i);
  if(s.theme==='desert')props+=`<path d="M${x} ${y}v-50m0 27h-16v-23m16 11h17v-27" stroke="#557544" stroke-width="10" stroke-linecap="round" fill="none"/><path d="M${x-2} ${y-3}v-47" stroke="#8fa962" stroke-width="3"/>`;
  if(s.theme==='beach')props+=`<path d="m${x} ${y} 10-61" stroke="#a27642" stroke-width="7"/><path d="m${x+10} ${y-61}-30 4 23-16 7 8 9-12 25 22-30-6 20 26Z" fill="#528c3b"/>`;
  if(s.theme==='city')props+=`<path d="M${x-30} ${y}v-${60+i%3*18}h57V${y}" fill="${i%2?'#829697':'#a58573'}" stroke="#52626c" stroke-width="3"/><path d="M${x-19} ${y-48}h10m14 0h10m-34 18h10m14 0h10" stroke="#f7e9b4" stroke-width="11"/>`;
  if(ice)props+=tree(x,y,i);
  if(['moon','mars','purple'].includes(s.theme))props+=`<ellipse cx="${x}" cy="${y}" rx="29" ry="9" fill="${mount}"/><path d="m${x-20} ${y} 5-9 13-4 11 14" fill="${cap}" stroke="${line}" stroke-width="2"/>`;
 }
 const stars=dark?Array.from({length:25},(_,i)=>`<circle cx="${(i*97+49)%640}" cy="${(i*37+14)%185}" r="${i%4===0?1.6:1}" fill="#fff3cf" opacity=".8"/>`).join(''):'';
 const defs=`<defs><linearGradient id="${id}" x2="0" y2="1"><stop stop-color="${sky}"/><stop offset="1" stop-color="${dark?mount:'#e3f4ea'}"/></linearGradient><pattern id="${id}-dirt" width="54" height="38" patternUnits="userSpaceOnUse"><rect width="54" height="38" fill="${soil}"/><path d="m6 12 7-3 5 5-4 3Zm29 19 6-3 4 3-4 2" fill="${line}" opacity=".25"/><path d="m6 11 7-2m24 3h5" stroke="${accent}" opacity=".2" stroke-width="2"/></pattern></defs>`;
 return `<svg class="stage-art" viewBox="0 0 640 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${defs}<rect width="640" height="320" fill="url(#${id})"/>${stars}<circle cx="510" cy="66" r="30" fill="${dark?'#e4e1bd':'#fff0a5'}"/>${s.id==='moon'?'<circle cx="504" cy="62" r="23" fill="#699dae"/><path d="m493 48 19 4-5 18-8 5-8-16" fill="#97c38a"/>':''}<path d="M0 188Q80 80 149 156T289 146T429 164T640 119V320H0" fill="${mount}" opacity=".5"/><path d="M0 220 80 144 122 183 197 125 269 202 346 162 438 217 520 136 640 210V320H0" fill="${mount}"/>${s.theme==='ice'||s.id==='mountain'?'<path d="m157 164 40-39 31 37-24-12-8 7-10-8Zm338-1 25-27 30 29-25-10-6 7-9-8" fill="#e2f1ed"/>':''}${props}<path d="M-5 225Q65 179 146 221T300 227T467 222T650 236V325H-5" fill="url(#${id}-dirt)" stroke="${line}" stroke-width="5"/><path d="M-5 222Q65 176 146 218T300 224T467 219T650 233" fill="none" stroke="${cap}" stroke-width="14"/><path d="M-5 216Q65 170 146 212T300 218T467 213T650 227" fill="none" stroke="${ice?'#f5ffff':s.theme==='green'?'#afe257':accent}" stroke-width="3"/>${s.hazard==='ceiling'?`<path d="M0 0H640V22l-43 12-30-15-25 47-25-42-67 24-38-30-52 38-21-33-41 15-39-13-53 30-40-39-39 22-35-18-52 14Z" fill="${soil}" stroke="${line}" stroke-width="4"/>`:''}${s.id==='rainbow'?'<path d="M40 188Q320-130 600 188" fill="none" stroke="#dc83b6" stroke-width="13" opacity=".45"/><path d="M40 202Q320-100 600 202" fill="none" stroke="#b3dfa1" stroke-width="12" opacity=".45"/>':''}</svg>`;
}
