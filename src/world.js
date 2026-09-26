import {drawPickups} from './pickup-art.js';
import {drawSkyArt,surfaceArt,propArt} from './world-art.js';
import {StageEvents} from './stage-events.js';
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
    this.end=-500;this.clock=0;this.events=new StageEvents(this);this.ensure(0);this.drawSky();
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
    this.events.ensure(x);
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
      surfaceArt(g,s,a,b,ya,yb);
      bodies.push(this.scene.matter.add.rectangle((a+b)/2-Math.sin(angle)*35,(ya+yb)/2+Math.cos(angle)*35,Math.hypot(b-a,yb-ya)+2,70,{isStatic:true,angle,friction:s.grip,label:'terrain'}));
      if(s.hazard==='ceiling'&&a>650){const roof=(ya+yb)/2-235-20*Math.sin(a*0.004);g.fillStyle(soil).fillRect(a,-1400,b-a+1,roof+1400);g.lineStyle(6,line).lineBetween(a,roof,b,roof);bodies.push(this.scene.matter.add.rectangle((a+b)/2,roof-50,b-a+3,100,{isStatic:true,friction:s.grip,label:'terrain',plugin:{ceiling:true}}));}
    }
    for(let x=Math.ceil(from/290)*290;x<to;x+=290){if(this.bridgeAt(x))continue;propArt(g,s,x,this.height(x),Math.floor(x/290)+s.seed);}
    for(const span of spans){const a=Math.max(from,span.start),b=Math.min(to,span.end);if(a<b){g.fillStyle(s.hazard==='lava'?0xe97b41:0x417682).fillRect(a,span.y+280,b-a,1520);g.fillStyle(s.hazard==='lava'?0xffc257:0x88cdd5).fillRect(a,span.y+280,b-a,9);}}
    this.terrainBodies.push(...bodies);this.chunks.push({from,to,g,bodies});
  }
  makeBridge(span){
    const count=Math.round((span.end-span.start)/32),step=(span.end-span.start)/count,group=Body.nextGroup(true);
    const planks=Array.from({length:count},(_,i)=>this.scene.matter.add.rectangle(span.start+(i+0.5)*step,span.y+7,step+1,14,{isStatic:i===0||i===count-1,label:'terrain',plugin:{bridge:true},collisionFilter:{group},chamfer:{radius:2},density:0.008,friction:1,frictionStatic:2,frictionAir:0.06,restitution:0}));
    const constraints=[];for(let i=1;i<count;i++)constraints.push(Constraint.create({bodyA:planks[i-1],pointA:{x:step/2,y:0},bodyB:planks[i],pointB:{x:-step/2,y:0},length:0,stiffness:0.98,damping:0.12}));
    this.scene.matter.world.add(constraints);this.bridges.push({...span,step,planks,constraints});
  }
  environment(vehicle,grounded,delta){this.clock+=delta;this.events.step(vehicle,grounded,delta);}
  collect(vehicle,magnet=false){
    const got=[],points=[vehicle.body.position,...vehicle.wheels.map(w=>w.position)];
    for(const item of this.items){if(item.taken||Math.abs(item.x-vehicle.body.position.x)>350)continue;
      const radius=item.kind==='fuel'?75:magnet?220:58;
      if(points.some(p=>(p.x-item.x)**2+(p.y-item.y)**2<radius**2)){item.taken=true;got.push(item);}}
    return got;
  }
  drawSky(){drawSkyArt(this);}
  draw(sample=body=>body){
    this.drawSky();this.events.draw(sample);const g=this.deck;g.clear();const c=this.scene.cameras.main,min=c.scrollX-300,max=c.scrollX+c.width+300;
    for(const b of this.bridges){if(b.end<min||b.start>max)continue;
      for(const x of [b.start-10,b.end+10])g.fillStyle(0x594532).fillRoundedRect(x-6,b.y-88,12,110,3);
      g.lineStyle(4,0x685140).beginPath().moveTo(b.start-10,b.y-76);for(const plank of b.planks){const p=sample(plank);g.lineTo(p.position.x,p.position.y-62);}g.lineTo(b.end+10,b.y-76).strokePath();
      b.planks.forEach((plank,i)=>{
        const p=sample(plank);
        if(i%2===0)g.lineStyle(2,0x97744c).lineBetween(p.position.x,p.position.y-62,p.position.x,p.position.y-7);
        const co=Math.cos(p.angle),si=Math.sin(p.angle);g.fillStyle(i%2?0xbd844c:0xd49a5a).lineStyle(1.5,0x694526).beginPath();
        [[-b.step/2,-7],[b.step/2,-7],[b.step/2,7],[-b.step/2,7]].forEach(([x,y],n)=>{const xx=p.position.x+x*co-y*si,yy=p.position.y+x*si+y*co;n?g.lineTo(xx,yy):g.moveTo(xx,yy);});g.closePath().fillPath().strokePath();
      });
    }
    drawPickups(this,min,max);
  }
  destroy(){
    for(const c of this.chunks){this.scene.matter.world.remove(c.bodies);c.g.destroy();}
    for(const b of this.bridges){this.scene.matter.world.remove(b.constraints);this.scene.matter.world.remove(b.planks);}
    this.pickupPool?.forEach(s=>s.destroy());
    this.events.destroy();this.sky.destroy();this.deck.destroy();this.pickups.destroy();this.items=[];
  }
}
