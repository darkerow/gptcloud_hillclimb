import Phaser from 'phaser';
import {vehicleById} from './catalog.js';
import {suspensionFor} from './suspension.js';
import {createVehicleSprites,driverAnchor} from './vehicle-art.js';
const {Body,Constraint,Query}=Phaser.Physics.Matter.Matter;
const clamp=Phaser.Math.Clamp;
export function createVehicle(scene,type,x,groundY,spec=vehicleById(type)){
  const group=Body.nextGroup(true),mono=type==='monowheel';
  const options={collisionFilter:{group},restitution:0,frictionAir:0.009};
  const tuning=spec.suspension||suspensionFor(spec);const suspension=[];
  const wheel=(wx,wy,r)=>scene.matter.add.circle(wx,wy,r,{...options,density:0.003,friction:spec.grip,frictionStatic:2,label:'wheel'});
  let body,wheels,constraints;
  if(mono){
    const y=groundY-80;
    body=scene.matter.add.rectangle(x,y-68,28,102,{...options,chamfer:{radius:9},density:0.0022,friction:0.7,label:'rider'});
    wheels=[wheel(x,y,spec.radius)];constraints=[Constraint.create({bodyA:body,pointA:{x:0,y:68},bodyB:wheels[0],length:0,stiffness:0.98,damping:0.2})];
  }else{
    const y=groundY-Math.max(135,spec.radius+spec.clearance+60);
    body=scene.matter.add.rectangle(x,y,spec.width,spec.height,{...options,chamfer:{radius:Math.min(12,spec.height/3)},density:spec.mass,friction:0.7,label:'chassis'});
    wheels=Array.from({length:spec.wheelCount},(_,i)=>wheel(x-spec.axle+2*spec.axle*i/(spec.wheelCount-1),y+spec.clearance,i===spec.wheelCount-1?(spec.frontRadius||spec.radius):spec.radius));
    Body.setInertia(body,body.inertia*tuning.inertia);
    constraints=wheels.flatMap(w=>{
      const wx=w.position.x-x,side=wx>=0?1:-1,guideX=wx-side*Math.max(90,spec.axle*2);
      const anchorY=spec.height/2-7,reach=Math.max(9,spec.clearance-anchorY);
      const spring=Constraint.create({bodyA:body,pointA:{x:wx,y:anchorY},bodyB:w,
        length:reach,stiffness:tuning.spring,damping:tuning.damping});
      const guide=Constraint.create({bodyA:body,pointA:{x:guideX,y:spec.clearance},bodyB:w,
        length:Math.abs(wx-guideX),stiffness:0.88,damping:0.015});
      suspension.push({wheel:w,spring,guide,wx,anchorY,rest:reach,travel:tuning.travel,compression:0});
      return [spring,guide];
    });
  }
  scene.matter.world.add(constraints);
  const v={type,spec,body,wheels,constraints,suspension,tuning,graphics:scene.add.graphics().setDepth(10),throttle:0,boost:false};createVehicleSprites(scene,v);drawVehicle(v);return v;
}
export function destroyVehicle(scene,v){if(!v)return;scene.matter.world.remove(v.constraints);scene.matter.world.remove([v.body,...v.wheels]);v.graphics.destroy();v.bodySprite?.destroy();v.wheelSprites?.forEach(s=>s.destroy());}
export function getContacts(scene,v){
  let grounded=false,bodyHit=false;const ids=new Set(v.wheels.map(w=>w.id));
  for(const pair of scene.matter.world.engine.pairs.list){if(!pair.isActive)continue;const a=pair.bodyA.parent,b=pair.bodyB.parent;
    const d=a.label==='terrain'?b:b.label==='terrain'?a:null;
    if(d){grounded ||= ids.has(d.id);bodyHit ||= d.id===v.body.id;}}
  return {grounded,bodyHit};
}
export function driveVehicle(v,input,delta,grounded,world){
  const {body,wheels,spec,type}=v,dt=clamp(delta/(1000/60),0.25,2),mono=type==='monowheel';
  v.throttle=input;
  for(const s of v.suspension){
    const co=Math.cos(body.angle),si=Math.sin(body.angle),dx=s.wheel.position.x-body.position.x,dy=s.wheel.position.y-body.position.y;
    const len=-dx*si+dy*co-s.anchorY;
    s.compression=s.rest-len;
    // Progressive bump stops: smooth resistance at either end of travel.
    const knee = s.compression > 0 ? Math.min(s.travel*.62,s.rest*.5) : s.travel*.72;
    const range = s.compression > 0 ? Math.max(3,Math.min(s.travel*.38,s.rest*.34)) : s.travel*.28;
    const over=Math.max(0,Math.abs(s.compression)-knee)/range;
    s.spring.stiffness=Math.min(.92,v.tuning.spring+over*over*.32);
  }
  const limit=(mono?0.52:spec.speed)*(v.boost?1.4:1);
  for(const wheel of wheels){
    if(input!==0)Body.setAngularVelocity(wheel,clamp(wheel.angularVelocity+input*spec.power*dt*(v.boost?1.6:1),-limit*0.6,limit));
    else if(mono&&grounded)Body.setAngularVelocity(wheel,wheel.angularVelocity*Math.pow(0.92,dt));
  }
  const angle=Phaser.Math.Angle.Wrap(body.angle);
  if(mono){
    if(grounded&&Math.abs(angle)<1.2){const correction=(input*0.13-angle)*0.045-body.angularVelocity*0.35;Body.setAngularVelocity(body,clamp(body.angularVelocity+correction*dt*(spec.balance||1),-0.13,0.13));}
    else if(!grounded)Body.setAngularVelocity(body,clamp(body.angularVelocity+input*0.0018*dt,-0.1,0.1));
  }else if(!grounded&&input!==0){Body.setAngularVelocity(body,clamp(body.angularVelocity+input*v.tuning.air*dt,-0.12,0.12));}
  if(spec.style==='hover'&&world&&Math.abs(angle)<1.5){
    const h=world.height(body.position.x)-body.position.y,hover=clamp((100-h)*0.000025-body.velocity.y*0.00005,0,0.0025);
    Body.applyForce(body,body.position,{x:input*body.mass*0.00032,y:-body.mass*hover});
    Body.setAngularVelocity(body,body.angularVelocity*0.9-angle*0.01);
  }
  if(spec.style==='rocket'&&input>0)Body.applyForce(body,body.position,{x:Math.cos(angle)*body.mass*0.0003,y:Math.sin(angle)*body.mass*0.0003});
}
export function headPosition(v){
  const {x,y}=driverAnchor(v.spec);
  return {x:v.body.position.x+x*Math.cos(v.body.angle)-y*Math.sin(v.body.angle),y:v.body.position.y+x*Math.sin(v.body.angle)+y*Math.cos(v.body.angle)};
}
export function headTouches(scene,v){
  if(['tank','hover','truck','fire','bus','snow'].includes(v.spec.style))return false;
  const p=headPosition(v),bodies=scene.matter.world.localWorld.bodies.filter(b=>b.label==='terrain');
  return Query.point(bodies,p).length>0;
}
export function drawVehicle(v,sample=body=>body){
  const {graphics:g,spec}=v,body=sample(v.body),wheels=v.wheels.map(sample);g.clear();
  const co=Math.cos(body.angle),si=Math.sin(body.angle);
  for(const s of v.suspension){
    const a={x:body.position.x+s.wx*co-s.anchorY*si,y:body.position.y+s.wx*si+s.anchorY*co},b=sample(s.wheel).position;
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),nx=-dy/(len||1),ny=dx/(len||1);
    g.lineStyle(6,0x303d45).lineBetween(a.x,a.y,b.x,b.y);
    g.lineStyle(2,0xd4dde1).lineBetween(a.x+2,a.y,b.x+2,b.y);
    g.lineStyle(3,0xffd14a).beginPath().moveTo(a.x,a.y);
    for(let i=1;i<12;i++){const t=i/12,z=i%2?4:-4;g.lineTo(a.x+dx*t+nx*z,a.y+dy*t+ny*z);}g.lineTo(b.x,b.y).strokePath();
    g.fillStyle(0xb6c2cb).fillCircle(a.x,a.y,3);
  }
  if(spec.style==='tank'||spec.style==='snow'){
    const a=wheels[0].position,b=wheels.at(-1).position;g.lineStyle(spec.radius*2+10,0x1f282c).lineBetween(a.x,a.y,b.x,b.y);
    g.lineStyle(spec.radius*2+3,0x56645e).lineBetween(a.x,a.y,b.x,b.y);
    const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/12),off=(wheels[0].angle*spec.radius)%12;
    for(let i=0;i<=n;i++){const t=Math.min(1,(i*12+off)/(n*12));for(const side of [-1,1]){const x=a.x+(b.x-a.x)*t-si*spec.radius*side,y=a.y+(b.y-a.y)*t+co*spec.radius*side;g.lineStyle(3,0x96a295).lineBetween(x-4*co,y-4*si,x+4*co,y+4*si);}}
  }
  v.bodySprite.setPosition(body.position.x,body.position.y).setRotation(body.angle);
  wheels.forEach((w,i)=>v.wheelSprites[i].setPosition(w.position.x,w.position.y).setRotation(w.angle));
  if(v.boost||spec.style==='rocket'&&v.throttle>0){
    const x=body.position.x-(spec.width/2+7)*co-8*si,y=body.position.y-(spec.width/2+7)*si+8*co;
    const pulse=34+Math.sin((body.position.x+body.position.y)*.25)*8;
    g.fillStyle(v.boost?0x54dafa:0xff933b).fillTriangle(x-si*9,y+co*9,x-co*pulse,y-si*pulse,x+si*9,y-co*9);
    g.fillStyle(0xffefb2).fillTriangle(x-si*5,y+co*5,x-co*pulse*.6,y-si*pulse*.6,x+si*5,y-co*5);
  }
}
