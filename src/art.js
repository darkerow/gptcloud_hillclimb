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
const wheel=(x,y,r)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#243747"/><circle cx="${x}" cy="${y}" r="${r-5}" fill="none" stroke="#496272" stroke-width="3"/><circle cx="${x}" cy="${y}" r="${r*.48}" fill="#c4d6db"/><path d="M${x-r*.65} ${y}h${r*1.3}M${x} ${y-r*.65}v${r*1.3}" stroke="#657f8d" stroke-width="3"/><circle cx="${x}" cy="${y}" r="4" fill="#263c4d"/>`;
export function vehicleArt(v){
  const c=hex(v.color),a=v.style;let shape='';
  if(a==='mono')shape=`${wheel(138,137,29)}<g stroke="#263f52" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"><path d="m124 111-2-17h29l9 22-13 17h-21z" fill="#345768"/><path d="m130 77-13 25 16 30m7-55 20 24-16 31" fill="none" stroke-width="10"/><path d="m121 43 21-5 12 38-24 12-14-13z" fill="${c}"/><path d="m139 46 25 17 14-14" fill="none" stroke="${c}" stroke-width="9"/><circle cx="128" cy="25" r="18" fill="#29465d"/><path d="m130 14 21 4 2 11-23 3" fill="#9ce9ec"/><path d="m130 34 24 1-10 13-20-7" fill="${c}"/><path d="M123 135h37" stroke-width="7"/></g>`;
  else{
    const r=a==='monster'?36:a==='tractor'?35:a==='race'?23:28;
    const left=a==='race'?46:56,right=a==='bus'||a==='truck'||a==='fire'?219:207;
    shape=wheel(left,138,r)+wheel(right,138,v.frontRadius?Math.max(19,r-10):r);
    if(v.wheelCount>=3)shape+=wheel(132,138,a==='tank'?23:r);
    if(a==='tank')shape+=wheel(94,138,23)+wheel(168,138,23);
    let body='';
    if(a==='bike')body=`<path d="m56 138 63-58 88 58H56m151 0-21-64-26-9" fill="none" stroke="${c}" stroke-width="8"/><path d="m92 99 58 2" stroke="#273c4f" stroke-width="10"/><path d="m117 59-10 29 25 34m-9-70 38 30" fill="none" stroke="#35566e" stroke-width="10"/><path d="m108 37 23-2 10 35-29 3z" fill="${c}"/><circle cx="119" cy="23" r="16" fill="#29475e"/><path d="m120 13 18 6v10h-18" fill="#b4edec"/>`;
    else if(a==='tank')body=`<path d="M30 106h199l12 30H26z" fill="${c}"/><path d="m91 105 12-34h63l25 34" fill="${c}"/><path d="M157 80h74v13h-74" fill="#6a7e5b"/>`;
    else if(['bus','truck','fire','ambulance','van'].includes(a)){
      body=`<path d="M22 63h190l32 29v39H22z" fill="${c}"/><path d="M180 74h27l24 21h-51z" fill="#bfe8ee"/><path d="M170 65v63" fill="none"/><path d="M31 118h125" stroke="#ffd178" stroke-width="5"/>`;
      if(['bus','van'].includes(a))for(let x=34;x<153;x+=33)body+=`<rect x="${x}" y="75" width="24" height="24" rx="2" fill="#bddde7"/>`;
      if(a==='ambulance')body+='<path d="M88 72v38M70 91h36" stroke="#de554b" stroke-width="12"/>';
      if(a==='fire')body+='<path d="M27 48h173M27 59h173M45 48v11m25-11v11m25-11v11m25-11v11m25-11v11m25-11v11" stroke="#91aab6" stroke-width="4"/>';
      if(a==='truck')body+=`<path d="M25 51h129v53H25z" fill="${c}"/>`;
    }else if(a==='tractor')body=`<path d="M25 90h89v-9h116v49H25z" fill="${c}"/><path d="M38 43h61v58H38z" fill="#c9e6db"/><path d="M29 40h80m71 43v39" stroke="${c}" stroke-width="9"/>`;
    else if(a==='race')body=`<path d="m23 109 57-11 29-21h38l31 29 61 12v16H22z" fill="${c}"/><path d="m112 76 25-15 22 33h-40" fill="#344d61"/><path d="M25 80h47v9H25M211 121h40v10h-40" fill="${c}"/>`;
    else if(a==='hover')body=`<ellipse cx="139" cy="133" rx="109" ry="25" fill="#2e495a"/><path d="m30 110 48-28h115l48 28-17 28H44z" fill="${c}"/><path d="m91 83 24-43h41l34 43" fill="#b6e5e9"/><circle cx="55" cy="87" r="22" fill="#435e6c"/><path d="m43 72 24 28m0-28-24 28" stroke="#c0e6df" stroke-width="5"/>`;
    else if(a==='rocket')body=`<path d="m26 91 165 0 55 22-55 23H26z" fill="${c}"/><path d="m27 94-32 17 32 20" fill="#ffc361"/><path d="m100 91 15-31h39l33 31" fill="#bde8ec"/>`;
    else{body=`<path d="M28 98h146l58 20-4 18H28z" fill="${c}"/><path d="m82 98 29-44h52l29 44z" fill="#c3e9ec"/><path d="M136 56v41" stroke="#2b475a"/><path d="M37 115h73" stroke="#ffc866" stroke-width="5"/>`;
      if(a==='buggy')body+=`<path d="m65 99 35-56h68l35 56" fill="none" stroke="#334f61" stroke-width="6"/>`;
      if(a==='police')body+='<path d="M27 117h198" stroke="#345c81" stroke-width="12"/><path d="M127 47h19" stroke="#63bfdc" stroke-width="7"/><path d="M146 47h19" stroke="#e8675d" stroke-width="7"/>';
      if(a==='hotrod')body+='<path d="M183 87v23m14-23v23m14-23v23" stroke="#7499a9" stroke-width="6"/>';
    }
    shape+=`<g stroke="#2c4354" stroke-width="3.5" stroke-linejoin="round">${body}</g>`;
  }
  return `<svg class="vehicle-art" viewBox="0 0 280 185" role="img" aria-label="${v.name}"><ellipse cx="140" cy="165" rx="115" ry="9" fill="#284757" opacity=".11"/>${shape}</svg>`;
}
export function stageArt(s){const [sky,soil,cap,line,mount,accent]=s.palette.map(hex);return `<svg class="stage-art" viewBox="0 0 320 145" aria-hidden="true"><rect width="320" height="145" fill="${sky}"/><circle cx="255" cy="33" r="17" fill="${accent}"/><path d="M0 117 63 50 134 112 207 61 320 120V145H0" fill="${mount}" opacity=".7"/><path d="M-5 104 Q42 ${45+s.seed%4*12} 93 95T189 93T329 97V145H-5" fill="${soil}" stroke="${line}" stroke-width="5"/><path d="M-5 103 Q42 ${45+s.seed%4*12} 93 94T189 92T329 96" fill="none" stroke="${cap}" stroke-width="13"/>${s.hazard==='ceiling'?`<path d="M0 0H320v18l-35 9-15-12-28 20-22-17-46 19-43-20-49 12-25-18L0 30z" fill="${soil}"/>`:''}</svg>`;}
