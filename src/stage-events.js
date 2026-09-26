import Phaser from 'phaser';
import {random,mix} from './world-art.js';
const {Body}=Phaser.Physics.Matter.Matter;
const sets={
 rocks:new Set(['mountain','canyon','wasteland','mars']),
 crates:new Set(['construction','factory','city','mines']),
 ice:new Set(['arctic','snow','glacier']),
 pads:new Set(['highway','roller','rainbow','alien']),
 water:new Set(['beach','islands','swamp']),
 mud:new Set(['mud']),
};
export function eventDescription(s){
 if(sets.rocks.has(s.id))return 'Камни на трассе';if(sets.crates.has(s.id))return 'Физические ящики';
 if(sets.ice.has(s.id))return 'Лёд и снежные участки';if(sets.pads.has(s.id))return 'Разгонные полосы';
 if(sets.water.has(s.id))return 'Броды и сопротивление воды';if(sets.mud.has(s.id))return 'Вязкие грязевые ванны';
 if(s.id==='storm')return 'Порывы ветра и дождь';if(s.id==='volcano')return 'Лава под переправами';
 if(s.hazard==='ceiling')return 'Низкие своды';if(s.hazard==='dunes')return 'Песок замедляет колёса';
 if(s.gravity<.8)return 'Долгие прыжки';return 'Живые подвесные мосты';
}
export class StageEvents {
 constructor(track){this.track=track;this.scene=track.scene;this.stage=track.stage;this.objects=[];this.next=3400;this.dust=[];this.trailClock=0;this.zone='';this.g=this.scene.add.graphics().setDepth(5);this.fx=this.scene.add.graphics().setDepth(13);}
 ensure(x){
  while(this.next<x+5200){const xx=this.next;this.next+=2100;if(this.track.bridgeAt(xx)||this.track.bridgeAt(xx-160)||this.track.bridgeAt(xx+160))continue;
   let body=null,kind='';const y=this.track.height(xx);
   if(sets.rocks.has(this.stage.id)){kind='rock';body=this.scene.matter.add.polygon(xx,y-23,7,23,{label:'terrain',density:.002,friction:.75,frictionAir:.035,restitution:.05,plugin:{obstacle:true}});}
   if(sets.crates.has(this.stage.id)){kind='crate';body=this.scene.matter.add.rectangle(xx,y-17,32,32,{label:'terrain',density:.0008,friction:.6,frictionAir:.02,chamfer:{radius:3},plugin:{obstacle:true}});}
   if(body)this.objects.push({body,kind,origin:xx});
  }
  for(const o of [...this.objects])if(o.body.position.x<x-1500||o.body.position.y>1400){this.scene.matter.world.remove(o.body);this.objects.splice(this.objects.indexOf(o),1);}
 }
 zoneAt(x){
  if(x<1700||this.track.bridgeAt(x))return '';
  const pos=((x-2300)%2600+2600)%2600;
  if(sets.ice.has(this.stage.id))return pos<600?'ice':'snow';
  if(sets.pads.has(this.stage.id)&&pos<210)return 'pad';
  if(sets.water.has(this.stage.id)&&pos<340)return 'water';
  if(sets.mud.has(this.stage.id)&&pos<380)return 'mud';
  if(this.stage.hazard==='dunes')return 'sand';
  return '';
 }
 step(v,grounded,delta){
  const dt=delta/1000,s=this.stage,x=v.body.position.x,zone=this.zoneAt(x);this.zone=zone;
  for(const w of v.wheels)w.friction=v.spec.grip*(zone==='ice'?.35:zone==='snow'?1.5:1);
  if(grounded&&['water','mud','sand'].includes(zone)){
   const rate=zone==='mud'?.00007:zone==='water'?.000043:.00002;
   for(const b of [v.body,...v.wheels])Body.applyForce(b,b.position,{x:-b.velocity.x*b.mass*rate*(v.spec.style==='hover'?.22:1),y:0});
  }
  if(grounded&&zone==='pad'&&v.throttle>0&&v.body.velocity.x<20)Body.applyForce(v.body,v.body.position,{x:v.body.mass*.0007,y:0});
  this.gust=s.id==='storm'?Math.sin(this.track.clock*.00045)*Math.sin(this.track.clock*.00013):0;
  if(s.id==='storm')Body.applyForce(v.body,v.body.position,{x:this.gust*v.body.mass*.00038,y:0});
  this.trailClock+=delta;
  const quality=this.scene.progress?.data.settings.quality!=='low';
  if(quality&&grounded&&Math.abs(v.body.velocity.x)>1&&this.trailClock>45){
   this.trailClock=0;const w=v.wheels[0];const wet=zone==='water'||zone==='mud';
   for(let i=0;i<2;i++)this.dust.push({x:w.position.x-10,y:w.position.y+w.circleRadius-1,vx:-v.body.velocity.x*8+(i-.5)*7,vy:wet?-40-i*16:-12-i*9,life:0,max:wet?.55:.75,color:zone==='water'?0x9adee0:zone==='mud'?0x775638:s.theme==='ice'?0xffffff:s.palette[1],r:wet?3:4+i*2});
  }
  for(const p of this.dust){p.life+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(zone==='water'?140:-5)*dt;}
  this.dust=this.dust.filter(p=>p.life<p.max).slice(-60);
  this.hint=Math.abs(this.gust)>.55?'ПОРЫВ ВЕТРА '+(this.gust>0?'→':'←'):{ice:'СКОЛЬЗКИЙ ЛЁД',water:'БРОД',mud:'ВЯЗКАЯ ГРЯЗЬ',sand:'РЫХЛЫЙ ПЕСОК',pad:'РАЗГОННАЯ ПОЛОСА'}[zone]||'';
 }
 draw(sample=body=>body){
  const g=this.g;g.clear();const c=this.scene.cameras.main,from=c.scrollX-100,to=c.scrollX+c.width+100;
  for(let x=Math.floor((from-2300)/2600)*2600+2300;x<to+400;x+=2600){if(x<1700)continue;const zone=this.zoneAt(x+5),width=zone==='pad'?210:zone==='ice'?600:zone==='water'?340:380;if(!zone||zone==='snow'||zone==='sand')continue;
   for(let xx=Math.max(x,from-50);xx<Math.min(x+width,to);xx+=18){if(this.track.bridgeAt(xx))continue;const y=this.track.height(xx);
    if(zone==='water'||zone==='mud'){g.fillStyle(zone==='water'?0x46aab9:0x664526,.6).fillEllipse(xx,y-4,35,16);g.lineStyle(2,zone==='water'?0xbae4e4:0xb69458,.7).lineBetween(xx-6,y-6,xx+8,y-5);}
    if(zone==='ice'){g.lineStyle(6,0x66caeb,.7).lineBetween(xx,y-2,xx+18,this.track.height(xx+18)-2);g.lineStyle(1,0xeafaff).lineBetween(xx,y+2,xx+9,y+10);}
    if(zone==='pad'){g.lineStyle(5,this.stage.id==='alien'?0x6eefdd:0xf9b841).lineBetween(xx,y-1,xx+9,y-6).lineBetween(xx+9,y-6,xx+2,y-10);}
   }
   if(x>from&&x<to){const y=this.track.height(x-22);g.fillStyle(0x66513a).fillRect(x-25,y-47,5,46);g.fillStyle(0xf6d777).lineStyle(2,0x534637).beginPath().moveTo(x-43,y-45).lineTo(x-23,y-75).lineTo(x-3,y-45).closePath().fillPath().strokePath();g.lineStyle(3,0x534637).lineBetween(x-23,y-63,x-23,y-54);g.fillStyle(0x534637).fillCircle(x-23,y-49,1.5);}
  }
  for(const o of this.objects){const b=o.body,pose=sample(b);if(pose.position.x<from||pose.position.x>to)continue;
   const da=pose.angle-b.angle,co=Math.cos(da),si=Math.sin(da);
   const vertices=b.vertices.map(v=>{const x=v.x-b.position.x,y=v.y-b.position.y;return {x:pose.position.x+x*co-y*si,y:pose.position.y+x*si+y*co};});
   g.fillStyle(o.kind==='crate'?0xbc8950:mix(this.stage.palette[1],0x50565b,.5)).lineStyle(2,0x514539).beginPath();vertices.forEach((v,i)=>i?g.lineTo(v.x,v.y):g.moveTo(v.x,v.y));g.closePath().fillPath().strokePath();
   if(o.kind==='crate'){const v=vertices;g.lineStyle(4,0xead199).lineBetween(v[0].x+3,v[0].y+3,v[2].x-3,v[2].y-3);g.lineStyle(2,0x6f512e).lineBetween(v[1].x-2,v[1].y+2,v[3].x+2,v[3].y-2);}
   else g.lineStyle(2,0xd1b295,.5).lineBetween(vertices[1].x,vertices[1].y,vertices[2].x,vertices[2].y);
  }
  const f=this.fx;f.clear();for(const p of this.dust)f.fillStyle(p.color,(1-p.life/p.max)*.55).fillCircle(p.x,p.y,p.r+p.life*5);
 }
 destroy(){this.scene.matter.world.remove(this.objects.map(o=>o.body));this.objects=[];this.dust=[];this.g.destroy();this.fx.destroy();}
}
