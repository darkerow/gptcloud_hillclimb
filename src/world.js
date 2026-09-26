import Phaser from 'phaser';
const {Body,Constraint}=Phaser.Physics.Matter.Matter;
const BASE_SPANS=[[1660,2140],[4840,5440],[8680,9400],[12880,13480],[17860,18640]];
const clamp=Phaser.Math.Clamp;
const smooth=t=>t*t*(3-2*t);
const noise=n=>{const x=Math.sin(n*12.9898+78.233)*43758.5453;return x-Math.floor(x);};
export class TrackWorld {
  constructor(scene,stage){
    this.scene=scene;this.stage=stage;this.chunks=[];this.bridges=[];this.terrainBodies=[];this.items=[];this.nextCoin=620;this.nextFuel=1500;this.fuelIndex=0;
    this.sky=scene.add.graphics().setScrollFactor(0).setDepth(-20);
    this.deck=scene.add.graphics().setDepth(3);this.pickups=scene.add.graphics().setDepth(6);
    this.end=-500;this.clock=0;this.ensure(0);this.drawSky();
  }
  natural(x){
    const s=this.stage,d=clamp((x-5000)/13000,0,1),phase=s.seed*0.63;
    if(s.id==='countryside')return 560+Math.sin(x*0.0024)*82+Math.sin(x*0.0062+1.2)*42+Math.sin(x*0.014+0.6)*13+Math.sin(x*0.0105+2.1)*60*d;
    const intro=clamp((x-400)/1000,0,1);
    let y=560+(Math.sin(x*0.0024+phase)*83+Math.sin(x*0.0062+1.2+phase)*40)*s.amplitude*(0.55+intro*0.45);
    y+=Math.sin(x*(s.hazard==='ramps'?0.017:0.013)+phase)*((s.hazard==='ramps'?38:11)+25*d)*intro;
    if(s.hazard==='dunes')y=560+Math.sin(x*0.003+phase)*130*s.amplitude*(0.5+intro*0.5);
    if(s.hazard==='road')y=560+Math.sin(x*0.0018+phase)*70+Math.sin(x*0.007)*12*intro;
    if(s.hazard==='craters')y+=Math.pow(Math.sin(x*0.004+phase),4)*60;
    return y;
  }
  spansBetween(from,to){
    if(!['bridges','lava'].includes(this.stage.hazard))return [];
    const out=[];
    for(let cycle=Math.max(0,Math.floor(from/22000));cycle<=Math.floor(to/22000);cycle++)for(const [a,b] of BASE_SPANS){const start=a+cycle*22000,end=b+cycle*22000;if(end>=from&&start<=to)out.push({start,end,y:(this.natural(start)+this.natural(end))/2});}
    return out;
  }
  bridgeAt(x){return this.spansBetween(x-1,x+1).find(b=>x>b.start&&x<b.end);}
  height(x){let y=this.natural(x);for(const b of this.spansBetween(x-220,x+220)){
    if(x<b.start-220||x>b.end+220)continue;const blend=x<b.start?smooth((x-b.start+220)/220):x>b.end?smooth((b.end+220-x)/220):1;y+=(b.y-y)*blend;
  }return y;}
  ensure(x){
    // A bounded moving window rather than a fixed finish line or an ever-growing world.
    while(this.end<x+6500){const from=this.end,to=from+3000;this.makeChunk(from,to);this.end=to;}
    for(const c of [...this.chunks])if(c.to<x-4000){this.scene.matter.world.remove(c.bodies);c.g.destroy();this.terrainBodies=this.terrainBodies.filter(b=>!c.bodies.includes(b));this.chunks.splice(this.chunks.indexOf(c),1);}
    for(const b of [...this.bridges])if(b.end<x-4000){this.scene.matter.world.remove(b.constraints);this.scene.matter.world.remove(b.planks);this.bridges.splice(this.bridges.indexOf(b),1);}
    this.items=this.items.filter(i=>i.x>x-800&&!i.taken);
    while(this.nextCoin<this.end-200){const x=this.nextCoin;for(let i=0;i<6;i++){const xx=x+i*46;this.items.push({kind:'coin',x:xx,y:this.height(xx)-58-Math.sin(i/5*Math.PI)*40,value:i===5?100:i%2?50:25,taken:false});}
      if(Math.floor(x/420)%8===4)this.items.push({kind:'gem',x:x+130,y:this.height(x+130)-118,value:1,taken:false});this.nextCoin+=470;}
    while(this.nextFuel<this.end-200){this.items.push({kind:'fuel',x:this.nextFuel,y:this.height(this.nextFuel)-65,value:1,taken:false});this.nextFuel+=1800+Math.min(this.fuelIndex++*100,5600);}
  }
  makeChunk(from,to){
    const g=this.scene.add.graphics().setDepth(1),bodies=[],s=this.stage,[sky,soil,cap,line,mount]=s.palette;
    const spans=this.spansBetween(from-1000,to+1000),points=[from,to];
    for(let x=from+60;x<to;x+=60)points.push(x);
    for(const b of spans){if(b.start>=from&&b.start<to&&!this.bridges.some(v=>v.start===b.start))this.makeBridge(b);
      for(let x=b.start-220;x<=b.start;x+=22)if(x>from&&x<to)points.push(x);
      for(let x=b.end;x<=b.end+220;x+=22)if(x>from&&x<to)points.push(x);
      for(const x of [b.start,b.end])if(x>from&&x<to)points.push(x);
    }
    const xs=[...new Set(points)].sort((a,b)=>a-b);
    for(let i=0;i<xs.length-1;i++){
      const a=xs[i],b=xs[i+1];if(spans.some(v=>(a+b)/2>v.start&&(a+b)/2<v.end))continue;
      const ya=this.height(a),yb=this.height(b),angle=Math.atan2(yb-ya,b-a);
      g.fillStyle(soil).beginPath().moveTo(a-0.6,ya).lineTo(b+0.6,yb).lineTo(b+0.6,1800).lineTo(a-0.6,1800).closePath().fillPath();
      g.fillStyle(cap).beginPath().moveTo(a-0.6,ya).lineTo(b+0.6,yb).lineTo(b+0.6,yb+40).lineTo(a-0.6,ya+40).closePath().fillPath();
      g.lineStyle(6,line).lineBetween(a,ya,b,yb);
      bodies.push(this.scene.matter.add.rectangle((a+b)/2-Math.sin(angle)*35,(ya+yb)/2+Math.cos(angle)*35,Math.hypot(b-a,yb-ya)+2,70,{isStatic:true,angle,friction:s.grip,label:'terrain'}));
      if(s.hazard==='ceiling'&&a>650){const roof=(ya+yb)/2-235-20*Math.sin(a*0.004);g.fillStyle(soil).fillRect(a,-1400,b-a+1,roof+1400);g.lineStyle(6,line).lineBetween(a,roof,b,roof);bodies.push(this.scene.matter.add.rectangle((a+b)/2,roof-50,b-a+3,100,{isStatic:true,friction:s.grip,label:'terrain',plugin:{ceiling:true}}));}
    }
    for(let x=Math.ceil(from/250)*250;x<to;x+=250){if(this.bridgeAt(x))continue;const y=this.height(x),r=noise(x+s.seed)*15;
      if(['green','forest','autumn','night'].includes(s.theme)&&s.hazard!=='ceiling'){
        g.fillStyle(0x645344).fillRect(x-4,y-65-r,8,65+r);g.fillStyle(s.theme==='autumn'?0xd29547:0x426c52).fillTriangle(x-35,y-24,x,y-114-r,x+35,y-24);g.fillStyle(s.theme==='autumn'?0xe4b75a:0x598c65).fillTriangle(x-28,y-48,x,y-116-r,x+28,y-48);
      }else if(s.theme==='city'){
        g.fillStyle(mount,0.9).fillRect(x-25,y-90-r,50,90+r);g.fillStyle(0xe4d9a3);for(let yy=y-80-r;yy<y-8;yy+=19)for(let xx=x-18;xx<x+22;xx+=16)g.fillRect(xx,yy,8,10);
      }else if(s.theme==='desert'){g.lineStyle(7,0x78925a).lineBetween(x,y,x,y-53-r).lineBetween(x,y-21,x+20,y-21).lineBetween(x+20,y-21,x+20,y-40);}
      else if(s.theme==='beach'){g.lineStyle(8,0x967046).lineBetween(x,y,x+14,y-85);g.lineStyle(9,0x5b995a).lineBetween(x-27,y-60,x+14,y-85).lineBetween(x+14,y-85,x+49,y-62).lineBetween(x+14,y-85,x-22,y-85);}
      else {g.fillStyle(mount).fillEllipse(x,y+12,23+r,12);}
      if((x-250)%1000===0){g.fillStyle(0x546755).fillRect(x-3,y-52,6,47);g.fillStyle(0xf7efd7).fillRoundedRect(x-30,y-66,60,23,4);}
    }
    for(const span of spans){const a=Math.max(from,span.start),b=Math.min(to,span.end);if(a<b){g.fillStyle(s.hazard==='lava'?0xe97b41:0x417682).fillRect(a,span.y+280,b-a,1520);g.fillStyle(s.hazard==='lava'?0xffc257:0x88cdd5).fillRect(a,span.y+280,b-a,9);}}
    if(['water','mud'].includes(s.hazard)){for(let x=Math.ceil(from/2200)*2200+1100;x<to;x+=2200){const y=this.height(x);g.fillStyle(s.hazard==='water'?0x59afb3:0x776242,0.75).fillEllipse(x,y+1,260,22);}}
    this.terrainBodies.push(...bodies);this.chunks.push({from,to,g,bodies});
  }
  makeBridge(span){
    const count=Math.round((span.end-span.start)/32),step=(span.end-span.start)/count,group=Body.nextGroup(true);
    const planks=Array.from({length:count},(_,i)=>this.scene.matter.add.rectangle(span.start+(i+0.5)*step,span.y+7,step+1,14,{isStatic:i===0||i===count-1,label:'terrain',plugin:{bridge:true},collisionFilter:{group},chamfer:{radius:2},density:0.008,friction:1,frictionStatic:2,frictionAir:0.06,restitution:0}));
    const constraints=[];for(let i=1;i<count;i++)constraints.push(Constraint.create({bodyA:planks[i-1],pointA:{x:step/2,y:0},bodyB:planks[i],pointB:{x:-step/2,y:0},length:0,stiffness:0.98,damping:0.12}));
    this.scene.matter.world.add(constraints);this.bridges.push({...span,step,planks,constraints});
  }
  environment(vehicle,grounded,delta){
    this.clock+=delta;const x=vehicle.body.position.x,s=this.stage;
    if(s.hazard==='wind')Body.applyForce(vehicle.body,vehicle.body.position,{x:Math.sin(this.clock*0.0009)*vehicle.body.mass*0.00016,y:0});
    if(grounded&&['mud','water','dunes'].includes(s.hazard)&&(s.hazard==='dunes'||Math.abs(x%2200-1100)<140)){
      for(const b of [vehicle.body,...vehicle.wheels])Body.applyForce(b,b.position,{x:-b.velocity.x*b.mass*(s.hazard==='mud'?0.00007:0.000035),y:0});
    }
  }
  collect(vehicle,magnet=false){
    const got=[],points=[vehicle.body.position,...vehicle.wheels.map(w=>w.position)];
    for(const item of this.items){if(item.taken||Math.abs(item.x-vehicle.body.position.x)>350)continue;
      const radius=item.kind==='fuel'?75:magnet?220:58;
      if(points.some(p=>(p.x-item.x)**2+(p.y-item.y)**2<radius**2)){item.taken=true;got.push(item);}}
    return got;
  }
  drawSky(){
    const c=this.scene.cameras.main,g=this.sky,s=this.stage,[sky,soil,cap,line,mountain,accent]=s.palette,w=this.scene.scale.width,h=this.scene.scale.height;
    g.clear().fillStyle(sky).fillRect(0,0,w,h);
    const dark=['night','moon','mars','purple','lava'].includes(s.theme);
    if(dark){g.fillStyle(0xedebcb,0.8);for(let i=0;i<45;i++){const x=(noise(i+7)*w-c.scrollX*0.025+w*100)%w,y=noise(i+87)*h*0.57;g.fillCircle(x,y,1+noise(i)*1.5);}}
    g.fillStyle(dark?0xd3debc:0xffe5a0,0.85).fillCircle(w*0.78,h*0.2,35);
    for(let layer=0;layer<2;layer++){
      const step=290,offset=((c.scrollX*(0.08+layer*0.09))%step+step)%step;
      g.fillStyle(mountain,layer?0.75:0.38);
      for(let i=-1;i<w/step+1;i++){const x=i*step-offset,y=h*0.75-c.scrollY*0.035;g.fillTriangle(x,y,x+step/2,y-100-50*Math.sin((i+Math.floor(c.scrollX*(0.08+layer*0.09)/step))*1.7+s.seed),x+step,y);g.fillRect(x,y,step,h-y);}
    }
    if(!dark&&s.hazard!=='ceiling'){g.fillStyle(0xffffff,0.62);for(let i=0;i<5;i++){const x=((i*330-c.scrollX*0.12)%(w+200)+(w+200))%(w+200)-100,y=90+(i%3)*35;g.fillEllipse(x,y,110,27).fillCircle(x,y-13,25);}}
    if(['snow','wind'].includes(s.hazard)&&this.scene.progress?.data.settings.quality!=='low'){g.lineStyle(2,s.hazard==='wind'?0x8cbbca:0xffffff,0.65);for(let i=0;i<55;i++){const x=noise(i+42)*w,y=(noise(i+99)*h+this.clock*(s.hazard==='wind'?0.35:0.035))%h;g.lineBetween(x,y,x+(s.hazard==='wind'?-10:1),y+8);}}
  }
  draw(){
    this.drawSky();const g=this.deck;g.clear();const c=this.scene.cameras.main,min=c.scrollX-300,max=c.scrollX+c.width+300;
    for(const b of this.bridges){if(b.end<min||b.start>max)continue;
      for(const x of [b.start-10,b.end+10])g.fillStyle(0x594532).fillRoundedRect(x-6,b.y-88,12,110,3);
      g.lineStyle(4,0x685140).beginPath().moveTo(b.start-10,b.y-76);for(const p of b.planks)g.lineTo(p.position.x,p.position.y-62);g.lineTo(b.end+10,b.y-76).strokePath();
      b.planks.forEach((p,i)=>{
        if(i%2===0)g.lineStyle(2,0x97744c).lineBetween(p.position.x,p.position.y-62,p.position.x,p.position.y-7);
        const co=Math.cos(p.angle),si=Math.sin(p.angle);g.fillStyle(i%2?0xbd844c:0xd49a5a).lineStyle(1.5,0x694526).beginPath();
        [[-b.step/2,-7],[b.step/2,-7],[b.step/2,7],[-b.step/2,7]].forEach(([x,y],n)=>{const xx=p.position.x+x*co-y*si,yy=p.position.y+x*si+y*co;n?g.lineTo(xx,yy):g.moveTo(xx,yy);});g.closePath().fillPath().strokePath();
      });
    }
    const p=this.pickups;p.clear();
    for(const i of this.items){if(i.taken||i.x<min||i.x>max)continue;const y=i.y+Math.sin(this.clock*0.002+i.x)*3;
      if(i.kind==='coin'){p.fillStyle(0x9d661b).fillCircle(i.x,y+2,12);p.fillStyle(i.value===100?0xffe879:0xf6c34b).fillCircle(i.x,y,12);p.lineStyle(2,0xd78d26).strokeCircle(i.x,y,8);p.lineStyle(2,0xfff0ab).lineBetween(i.x,y-5,i.x,y+5);}
      if(i.kind==='gem'){p.fillStyle(0x4fc8e2).lineStyle(2,0xd0fcff).beginPath().moveTo(i.x,y-15).lineTo(i.x+12,y).lineTo(i.x,y+15).lineTo(i.x-12,y).closePath().fillPath().strokePath();}
      if(i.kind==='fuel'){p.fillStyle(0x345265).fillRoundedRect(i.x-16,y-20,32,40,5);p.fillStyle(0xf28e43).fillRoundedRect(i.x-13,y-17,26,33,3);p.lineStyle(3,0xffdc95).lineBetween(i.x-7,y-10,i.x+7,y+9).lineBetween(i.x+7,y-10,i.x-7,y+9);p.fillStyle(0x31485a).fillRect(i.x+5,y-26,9,7);}
    }
  }
  destroy(){
    for(const c of this.chunks){this.scene.matter.world.remove(c.bodies);c.g.destroy();}
    for(const b of this.bridges){this.scene.matter.world.remove(b.constraints);this.scene.matter.world.remove(b.planks);}
    this.sky.destroy();this.deck.destroy();this.pickups.destroy();this.items=[];
  }
}
