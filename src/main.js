import Phaser from 'phaser';
import './style.css';
import {VEHICLES,STAGES,vehicleById,stageById,tunedVehicle} from './catalog.js';
import {Progress} from './progression.js';
import {createVehicle,destroyVehicle,drawVehicle,driveVehicle,getContacts,headTouches} from './vehicles.js';
import {VehicleCameraRig} from './camera.js';
import {TrackWorld} from './world.js';
import {GameInterface} from './interface.js';
import {GameAudio} from './audio.js';
const START_X=260;
export class HillClimbScene extends Phaser.Scene {
  constructor(){super('HillClimb');}
  create(){
    this.progress=new Progress();this.audio=new GameAudio(this.progress.data.settings);
    this.vehicleType=this.progress.data.selectedVehicle;this.stageId=this.progress.data.selectedStage;this.runMode='career';
    this.hasStarted=false;this.finished=false;this.menuOpen=true;this.distance=0;this.bestDistance=this.progress.best(this.vehicleType,this.stageId);
    this.contacts={grounded:false,bodyHit:false};this.groundGrace=0;this.deadTimer=0;this.nitro=0;this.magnet=0;this.saveTimer=0;
    this.cursors=this.input.keyboard.createCursorKeys();this.keys=this.input.keyboard.addKeys({left:'A',right:'D'});
    this.cameras.main.setBounds(-400,-1200,1e9,3200);this.cameraRig=new VehicleCameraRig(this.cameras.main);
    this.createRunWorld();this.ui=new GameInterface(this);this.matter.world.pause();
    this.onKey=e=>{
      if(e.repeat)return;
      if(['Escape','KeyP'].includes(e.code)){this.menuOpen?this.closeGarage():this.pauseRun();return;}
      if(e.code==='KeyV'){this.menuOpen?this.closeGarage():this.openGarage('vehicles');return;}
      if(e.code==='KeyR'&&!this.menuOpen)this.startRun(this.vehicleType,this.stageId,this.runMode);
      if(!this.menuOpen&&['Digit1','Digit2','Digit3'].includes(e.code))this.useBooster(['nitro','fuel','magnet'][Number(e.code.at(-1))-1]);
    };
    this.onBlur=()=>{this.clearInput();this.progress.save();this.audio.stop();if(this.hasStarted&&!this.finished&&!this.menuOpen)this.pauseRun();};
    this.onPageHide=()=>{this.progress.save();this.audio.stop();};
    this.input.keyboard.on('keydown',this.onKey);
    this.matter.world.on('beforeupdate',this.physicsInput,this);this.matter.world.on('afterupdate',this.afterPhysics,this);
    this.scale.on('resize',this.resizeCamera,this);window.addEventListener('blur',this.onBlur);window.addEventListener('pagehide',this.onPageHide);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,this.cleanup,this);this.ui.show();this.ui.update();
  }
  createRunWorld(){
    destroyVehicle(this,this.vehicle);this.track?.destroy();
    this.stage=stageById(this.stageId);this.matter.world.engine.gravity.y=this.stage.gravity;
    this.track=new TrackWorld(this,this.stage);this.terrainBodies=this.track.terrainBodies;
    const d=this.progress.data,spec=tunedVehicle(this.vehicleType,this.progress.levels(this.vehicleType),d.custom,d.paints[this.vehicleType]);
    this.vehicle=createVehicle(this,this.vehicleType,START_X,this.track.height(START_X),spec);
    this.fuelCapacity=spec.fuel;this.fuel=this.fuelCapacity;this.emptyTime=0;this.nitro=0;this.magnet=0;
    this.run={coins:0,gems:0,air:0,flips:0,maxDistance:0,lastLevel:0,airCurrent:0,airAngle:0,airPaid:0,lastAngle:this.vehicle.body.angle,initialBest:this.progress.best(this.vehicleType,this.stageId),dailyComplete:false};
    this.cameraRig.track(this.vehicle,this.scale.width);this.track.draw();
  }
  terrainY(x){return this.track.height(x);}
  followVehicle(){this.cameraRig.track(this.vehicle,this.scale.width);}
  resizeCamera(){this.cameraRig.resize(this.scale.width);this.track?.draw();}
  clearInput(){this.ui?.clear();this.input.keyboard.resetKeys();}
  saveBest(){this.progress.save();}
  openGarage(tab='vehicles'){this.clearInput();this.menuOpen=true;this.matter.world.pause();this.progress.save();this.audio.stop();this.ui.show(tab);}
  pauseRun(){if(!this.hasStarted||this.finished)return;this.clearInput();this.menuOpen=true;this.matter.world.pause();this.audio.stop();this.ui.showPause();}
  closeGarage(){if(!this.hasStarted||this.finished)return;this.clearInput();this.menuOpen=false;this.ui.hide();this.matter.world.resume();this.audio.unlock();}
  startRun(type=this.vehicleType,stage=this.stageId,mode=this.ui?.mode||'career'){
    if(!VEHICLES.some(v=>v.id===type)||!STAGES.some(s=>s.id===stage)||!['career','sandbox','daily'].includes(mode))return false;
    if(mode==='career'&&(!this.progress.ownsVehicle(type)||!this.progress.ownsStage(stage)))return false;
    if(mode==='daily'){const daily=this.progress.daily();if(type!==daily.vehicle||stage!==daily.stage)return false;}
    this.progress.save();this.clearInput();this.cameras.main.stopFollow();
    this.vehicleType=type;this.stageId=stage;this.runMode=mode;this.bestDistance=this.progress.best(type,stage);
    if(mode==='career'){this.progress.data.selectedVehicle=type;this.progress.data.selectedStage=stage;this.progress.data.stats.runs++;this.progress.save();}
    this.createRunWorld();this.distance=0;this.deadTimer=0;this.groundGrace=0;this.contacts={grounded:false,bodyHit:false};this.finished=false;this.hasStarted=true;
    this.menuOpen=false;this.ui.hide();this.matter.world.resume();this.audio.unlock();this.ui.update();return true;
  }
  physicsInput(event){
    if(this.menuOpen||this.finished||!this.vehicle)return;const dt=Math.min(event.delta||1000/60,1000/30);
    this.groundGrace=this.contacts.grounded?100:Math.max(0,this.groundGrace-dt);
    const left=this.cursors.left.isDown||this.keys.left.isDown,right=this.cursors.right.isDown||this.keys.right.isDown;
    const input=this.fuel>0?Phaser.Math.Clamp(Number(right)-Number(left)+this.ui.throttle,-1,1):0;
    this.vehicle.boost=this.nitro>0;driveVehicle(this.vehicle,this.deadTimer>0?0:input,dt,this.groundGrace>0,this.track);
    this.track.environment(this.vehicle,this.contacts.grounded,dt);
  }
  award(amount,kind='coin'){
    if(kind==='gem'){this.run.gems+=amount;if(this.runMode==='career')this.progress.data.gems+=amount;}
    else {this.run.coins+=amount;if(this.runMode==='career')this.progress.data.coins+=amount;}
  }
  afterPhysics(event){
    if(!this.vehicle)return;this.contacts=getContacts(this,this.vehicle);drawVehicle(this.vehicle);
    if(this.menuOpen||this.finished||!this.hasStarted)return;
    const dt=Math.min(event?.delta||1000/60,1000/30),seconds=dt/1000,body=this.vehicle.body,r=this.run;
    this.nitro=Math.max(0,this.nitro-seconds);this.magnet=Math.max(0,this.magnet-seconds);
    if(this.runMode!=='sandbox')this.fuel=Math.max(0,this.fuel-seconds*(this.nitro>0?1.45:1));
    this.distance=Math.max(0,Math.floor((body.position.x-START_X)/10));
    if(this.distance>r.maxDistance){if(this.runMode==='career')this.progress.data.stats.distance+=this.distance-r.maxDistance;r.maxDistance=this.distance;}
    if(this.runMode==='career'){
      this.bestDistance=Math.max(this.bestDistance,this.distance);this.progress.data.records[`${this.vehicleType}:${this.stageId}`]=this.bestDistance;
      this.progress.data.stats.best=Math.max(this.progress.data.stats.best,this.distance);
    }
    for(const item of this.track.collect(this.vehicle,this.magnet>0)){
      if(item.kind==='fuel'){this.fuel=this.fuelCapacity;this.emptyTime=0;if(this.runMode==='career')this.progress.data.stats.refills++;this.ui.message('ЗАПРАВКА!');this.audio.tone(420,0.16);}
      else{this.award(item.value,item.kind);if(this.runMode==='career'&&item.kind==='coin')this.progress.data.stats.pickups++;this.audio.tone(item.kind==='gem'?1050:780,0.07,0.025);}
    }
    const level=Math.floor(r.maxDistance/300);if(level>r.lastLevel){this.award((level-r.lastLevel)*300+level*50);r.lastLevel=level;this.ui.message(`ЭТАП ${level+1} · +${300+level*50} МОНЕТ`);this.audio.tone(660,0.2);}
    const angleDelta=Phaser.Math.Angle.Wrap(body.angle-r.lastAngle);r.lastAngle=body.angle;
    if(!this.contacts.grounded){r.airCurrent+=seconds;r.airAngle+=angleDelta;r.air+=seconds;if(this.runMode==='career')this.progress.data.stats.airtime+=seconds;
      const bonus=Math.max(0,Math.floor(r.airCurrent-0.5));if(bonus>r.airPaid){this.award((bonus-r.airPaid)*50);r.airPaid=bonus;this.ui.message(`В ПОЛЁТЕ · +${bonus*50}`);}}
    else{
      if(r.airCurrent>0.35){const flips=Math.floor((Math.abs(r.airAngle)+0.05)/(Math.PI*2));if(flips>0){r.flips+=flips;this.award(flips*500);if(this.runMode==='career')this.progress.data.stats.flips+=flips;this.ui.message(`САЛЬТО ×${flips} · +${flips*500}`);}}
      r.airCurrent=0;r.airAngle=0;r.airPaid=0;
    }
    if(this.runMode==='daily'&&!r.dailyComplete&&this.distance>=this.progress.daily().target){r.dailyComplete=true;const paid=this.progress.completeDaily(this.distance);this.ui.message(paid?'ИСПЫТАНИЕ ВЫПОЛНЕНО! +3500 МОНЕТ, +10 КРИСТАЛЛОВ':'ЦЕЛЬ ИСПЫТАНИЯ ВЫПОЛНЕНА');}
    const angle=Phaser.Math.Angle.Wrap(body.angle),mono=this.vehicleType==='monowheel';
    const fell=mono?(this.contacts.bodyHit||(this.contacts.grounded&&Math.abs(angle)>1.2)):((this.contacts.bodyHit||this.contacts.grounded)&&Math.cos(angle)<-0.45);
    const outside=body.position.y>this.terrainY(body.position.x)+350||body.position.x<-300;
    const headHit=headTouches(this,this.vehicle);
    this.deadTimer=fell||outside||headHit?this.deadTimer+dt:0;
    if(this.deadTimer>350){this.endRun(outside?'Заезд окончен':'Неудачное приземление');return;}
    if(this.fuel<=0){this.emptyTime+=seconds;if(this.emptyTime>4||(this.emptyTime>1&&Math.abs(body.velocity.x)<0.5))this.endRun('Закончилось топливо');}
  }
  useBooster(id){
    if(this.menuOpen||this.finished||!['nitro','fuel','magnet'].includes(id))return false;
    if(this.runMode!=='sandbox'){if(this.progress.data.boosters[id]<=0){this.ui.notify('Запас пуст. Пополни его в магазине.');return false;}this.progress.data.boosters[id]--;this.progress.save();}
    if(id==='fuel'){this.fuel=this.fuelCapacity;this.emptyTime=0;this.ui.message('БАК ПОЛОН');}
    if(id==='nitro'){this.nitro=5;this.ui.message('НИТРО!');}if(id==='magnet'){this.magnet=15;this.ui.message('МАГНИТ · 15 СЕКУНД');}
    this.audio.tone(520,0.18);this.ui.update();return true;
  }
  endRun(reason){
    if(this.finished)return;this.finished=true;this.menuOpen=true;this.clearInput();this.matter.world.pause();this.progress.save();this.audio.stop();this.audio.tone(150,0.28);
    this.ui.showResult({reason,distance:this.run.maxDistance,coins:this.run.coins,air:this.run.air,newBest:this.runMode==='career'&&this.run.maxDistance>this.run.initialBest});
  }
  update(_,delta){
    if(!this.track)return;
    if(!this.menuOpen&&!this.finished){this.cameraRig.update(delta);this.track.ensure(this.vehicle.body.position.x);this.terrainBodies=this.track.terrainBodies;this.saveTimer+=delta;if(this.saveTimer>1500){this.progress.save();this.saveTimer=0;}}
    this.track.draw();this.ui?.update();this.audio.update(this.vehicle.body.velocity.x,this.vehicle.throttle,!this.menuOpen&&!this.finished,delta);
  }
  cleanup(){
    this.progress.save();this.ui.destroy();this.audio.destroy();this.track.destroy();destroyVehicle(this,this.vehicle);this.cameraRig.destroy();
    this.scale.off('resize',this.resizeCamera,this);this.matter.world.off('beforeupdate',this.physicsInput,this);this.matter.world.off('afterupdate',this.afterPhysics,this);
    this.input.keyboard.off('keydown',this.onKey);window.removeEventListener('blur',this.onBlur);window.removeEventListener('pagehide',this.onPageHide);
  }
}
const game=new Phaser.Game({type:Phaser.AUTO,parent:'game',backgroundColor:'#9ed8ff',width:1280,height:720,
  scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},
  physics:{default:'matter',matter:{gravity:{y:1.05},positionIterations:8,velocityIterations:8,constraintIterations:4,debug:false}},scene:HillClimbScene});
if(new URLSearchParams(location.search).has('test')){window.__hillClimb=game;window.__catalog={vehicles:VEHICLES,stages:STAGES};}
