import Phaser from 'phaser';
import {vehicleById} from './catalog.js';
const {Body,Constraint,Query}=Phaser.Physics.Matter.Matter;
const clamp=Phaser.Math.Clamp;
export function createVehicle(scene,type,x,groundY,spec=vehicleById(type)){
  const group=Body.nextGroup(true),mono=type==='monowheel';
  const options={collisionFilter:{group},restitution:0,frictionAir:0.012};
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
    constraints=wheels.flatMap(w=>{const wx=w.position.x-x,reach=spec.clearance-spec.height/2;
      return [Constraint.create({bodyA:body,pointA:{x:wx,y:spec.height/2},bodyB:w,length:Math.max(8,reach),stiffness:0.65,damping:spec.damping||0.16}),
        Constraint.create({bodyA:body,pointA:{x:wx>0?-spec.axle:spec.axle,y:spec.height/2},bodyB:w,length:Math.hypot(Math.abs(wx)+spec.axle,reach),stiffness:0.8,damping:0.1})];});
  }
  scene.matter.world.add(constraints);
  const v={type,spec,body,wheels,constraints,graphics:scene.add.graphics().setDepth(10),throttle:0,boost:false};drawVehicle(v);return v;
}
export function destroyVehicle(scene,v){if(!v)return;scene.matter.world.remove(v.constraints);scene.matter.world.remove([v.body,...v.wheels]);v.graphics.destroy();}
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
  const limit=(mono?0.52:spec.speed)*(v.boost?1.4:1);
  for(const wheel of wheels){
    if(input!==0)Body.setAngularVelocity(wheel,clamp(wheel.angularVelocity+input*spec.power*dt*(v.boost?1.6:1),-limit*0.6,limit));
    else if(mono&&grounded)Body.setAngularVelocity(wheel,wheel.angularVelocity*Math.pow(0.92,dt));
  }
  const angle=Phaser.Math.Angle.Wrap(body.angle);
  if(mono){
    if(grounded&&Math.abs(angle)<1.2){const correction=(input*0.13-angle)*0.045-body.angularVelocity*0.35;Body.setAngularVelocity(body,clamp(body.angularVelocity+correction*dt*(spec.balance||1),-0.13,0.13));}
    else if(!grounded)Body.setAngularVelocity(body,clamp(body.angularVelocity+input*0.0018*dt,-0.1,0.1));
  }else if(!grounded&&input!==0){Body.setAngularVelocity(body,clamp(body.angularVelocity+input*(spec.style==='bike'?0.0022:0.0014)*dt,-0.12,0.12));}
  if(spec.style==='hover'&&world&&Math.abs(angle)<1.5){
    const h=world.height(body.position.x)-body.position.y,hover=clamp((100-h)*0.000025-body.velocity.y*0.00005,0,0.0025);
    Body.applyForce(body,body.position,{x:input*body.mass*0.00032,y:-body.mass*hover});
    Body.setAngularVelocity(body,body.angularVelocity*0.9-angle*0.01);
  }
  if(spec.style==='rocket'&&input>0)Body.applyForce(body,body.position,{x:Math.cos(angle)*body.mass*0.0003,y:Math.sin(angle)*body.mass*0.0003});
}
export function headPosition(v){
  const mono=v.type==='monowheel',x=mono?0:(v.spec.style==='bike'?7:10),y=mono?-58:-v.spec.height/2-22;
  return {x:v.body.position.x+x*Math.cos(v.body.angle)-y*Math.sin(v.body.angle),y:v.body.position.y+x*Math.sin(v.body.angle)+y*Math.cos(v.body.angle)};
}
export function headTouches(scene,v){
  if(['tank','hover','truck','fire','bus','snow'].includes(v.spec.style))return false;
  const p=headPosition(v),bodies=scene.matter.world.localWorld.bodies.filter(b=>b.label==='terrain');
  return Query.point(bodies,p).length>0;
}
export function drawVehicle(v){
  const {graphics:g,body,wheels,type,spec}=v;g.clear();
  const cos=Math.cos(body.angle),sin=Math.sin(body.angle);
  const p=(x,y)=>({x:body.position.x+x*cos-y*sin,y:body.position.y+x*sin+y*cos});
  const poly=(points,color,stroke=0x273d4b,width=3)=>{g.fillStyle(color).lineStyle(width,stroke).beginPath();points.forEach(([x,y],i)=>{const q=p(x,y);i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y);});g.closePath().fillPath().strokePath();};
  const line=(points,width,color)=>{g.lineStyle(width,color).beginPath();points.forEach(([x,y],i)=>{const q=p(x,y);i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y);});g.strokePath();};
  const circle=(x,y,r,color)=>{const q=p(x,y);g.fillStyle(color).fillCircle(q.x,q.y,r);};
  const rect=(x,y,w,h,color)=>poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],color);
  if(spec.style==='tank'||spec.style==='snow'){
    const a=wheels[0],b=wheels.at(-1);g.lineStyle(spec.radius*2+9,0x273343).lineBetween(a.position.x,a.position.y,b.position.x,b.position.y);
    g.lineStyle(spec.radius*2-3,0x51616a).lineBetween(a.position.x,a.position.y,b.position.x,b.position.y);
  }
  for(const w of wheels){const r=w.circleRadius;g.fillStyle(0x1a2935).fillCircle(w.position.x,w.position.y,r);
    g.lineStyle(4,0x394c59).strokeCircle(w.position.x,w.position.y,r-4);
    g.fillStyle(type==='monowheel'?0xfab24e:0xbbcfd5).fillCircle(w.position.x,w.position.y,r*0.49);
    for(let i=0;i<4;i++){const a=w.angle+i*Math.PI/2;g.lineStyle(3,0x637e8b).lineBetween(w.position.x,w.position.y,w.position.x+Math.cos(a)*r*0.68,w.position.y+Math.sin(a)*r*0.68);}
    g.fillStyle(0x293b4a).fillCircle(w.position.x,w.position.y,5);
  }
  const rider=(x,y)=>{
    line([[x-3,y+36],[x-17,y+59],[x+5,y+73]],10,0x304758);
    poly([[x-14,y],[x+10,y-4],[x+16,y+33],[x+1,y+42],[x-15,y+31]],spec.color);
    line([[x+5,y+6],[x+29,y+25],[x+42,y+10]],9,spec.color);circle(x+42,y+10,5,0xf7cba0);
    circle(x,y-18,16,0x243b51);poly([[x,y-28],[x+18,y-25],[x+21,y-16],[x+2,y-15]],0x9de9ee);
    poly([[x+4,y-13],[x+21,y-12],[x+16,y-4],[x-2,y-6]],spec.color,0x223449,2);
    line([[x-10,y-29],[x+4,y-32]],4,0xffb64a);
  };
  if(type==='monowheel'){
    poly([[-17,45],[-18,31],[14,29],[20,48],[13,66],[-10,66]],0x31495b);
    line([[-12,40],[12,38]],4,0x80e5de);rider(0,-40);
    line([[-3,0],[-13,27],[-5,61]],11,0x26394a);line([[5,0],[21,24],[8,61]],11,0x426581);line([[-15,65],[26,65]],7,0x152839);
  }else{
    for(const w of wheels){const q=p(w.position.x<body.position.x?-spec.axle:spec.axle,10);g.lineStyle(6,0x71828b).lineBetween(q.x,q.y,w.position.x,w.position.y);}
    const a=spec.width/2,h=spec.height/2;
    if(spec.style==='bike'){
      line([[-spec.axle,spec.clearance],[0,4],[spec.axle,spec.clearance],[-spec.axle,spec.clearance]],6,spec.color);
      line([[spec.axle,spec.clearance],[spec.axle-12,-24],[spec.axle-27,-27]],5,0x2c485c);
      rect(-28,-8,40,13,spec.color);rider(-6,-42);
    }else if(spec.style==='tank'){
      poly([[-a,-h],[a-12,-h],[a,10],[a-12,h],[-a,h]],spec.color);
      poly([[-28,-h],[-22,-h-25],[23,-h-25],[39,-h]],0x829466);rect(15,-h-21,70,9,0x64794f);
      line([[-a+14,0],[a-12,0]],4,0xc6cb8a);
    }else if(spec.style==='hover'){
      poly([[-a-8,4],[-a+8,-h],[a-8,-h],[a+10,4],[a-5,h+12],[-a+4,h+12]],spec.color);
      poly([[-30,-h],[0,-h-35],[32,-h-32],[a-18,-h]],0xc7f2f5);
      line([[-a,h+3],[a,h+3]],8,0x22394c);circle(-a+15,-25,22,0x334e60);circle(-a+15,-25,14,0x9dc5cd);
    }else if(spec.style==='rocket'){
      poly([[-a,-h],[a-15,-h],[a+15,0],[a-15,h],[-a,h]],spec.color);
      poly([[-32,-h],[-10,-h-27],[18,-h-25],[39,-h]],0xc5eaf1);
      if(v.throttle>0)poly([[-a,8],[-a-30-(Date.now()%20),0],[-a,-8]],0xffbc48,0xe78d45,2);
    }else if(['bus','van','ambulance','fire','truck','police'].includes(spec.style)){
      poly([[-a,-h],[a-18,-h],[a,-h+20],[a,h],[-a,h]],spec.color);
      if(['bus','van'].includes(spec.style))for(let x=-a+10;x<a-30;x+=31)rect(x,-h+7,23,Math.min(27,spec.height-20),0xc1e7ec);
      else {rect(a-46,-h+5,27,25,0xbfe8ee);line([[a-55,-h+3],[a-55,h-1]],3,0x3b5360);}
      line([[-a+10,h-9],[a-10,h-9]],4,0xffc35e);
      if(spec.style==='ambulance'){rect(-28,-17,12,34,0xd95246);rect(-39,-6,34,12,0xd95246);}
      if(spec.style==='police'){rect(-a+5,-6,spec.width-10,15,0x355778);rect(-16,-h-7,17,7,0x56bce7);rect(2,-h-7,17,7,0xec6254);}
      if(spec.style==='fire'){line([[-a+8,-h-11],[a-25,-h-11]],6,0xbed0d4);line([[-a+8,-h-24],[a-25,-h-24]],5,0x829eab);for(let x=-a+12;x<a-25;x+=18)line([[x,-h-11],[x,-h-24]],3,0xa9c5cf);}
      if(spec.style==='truck'){rect(-a+5,-h-13,spec.width*0.56,16,0x637d84);}
    }else if(spec.style==='tractor'){
      rect(-a,-h,60,spec.height,spec.color);rect(-5,-8,a+5,h+8,spec.color);
      rect(-a+2,-h-40,51,42,0xbfdfd2);line([[-a-4,-h-42],[-a+59,-h-42]],8,spec.color);rect(25,-42,7,35,0x3d4c50);
    }else if(spec.style==='race'){
      poly([[-a,0],[-a+35,-h],[20,-h],[a,0],[a,h],[-a,h]],spec.color);
      poly([[-27,-h],[0,-h-22],[27,-h]],0x384a5b);rect(-a-3,-h-18,35,7,spec.color);rect(a-15,12,30,7,spec.color);
    }else{
      poly([[-a,-h],[a-20,-h],[a+3,4],[a-8,h],[-a+3,h],[-a-8,4]],spec.color);
      poly([[-a*0.32,-h],[-a*0.02,-h-32],[a*0.52,-h-29],[a*0.7,-h]],0xc5edf1);
      line([[a*0.25,-h-29],[a*0.25,-h]],3,0x354b57);
      circle(8,-h-14,9,0xffd2aa);line([[-a+8,2],[a-20,2]],4,0xffc165);
      if(spec.style==='buggy')line([[-a*0.6,-h],[-a*0.32,-h-38],[a*0.37,-h-38],[a*0.7,-h]],5,0x334e5c);
      if(spec.style==='hotrod')for(let x=25;x<60;x+=12)rect(x,-h-12,7,14,0x829da6);
    }
    circle(a-7,0,5,0xffe7a0);circle(-a+5,0,4,0xcc4943);
  }
  if(v.boost){const a=p(-spec.width/2-15,10),b=p(-spec.width/2-55,10);g.lineStyle(10,0x91e5f0,0.8).lineBetween(a.x,a.y,b.x,b.y);}
}
