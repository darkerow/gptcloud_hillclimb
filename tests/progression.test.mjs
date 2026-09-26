import test from 'node:test';
import assert from 'node:assert/strict';
import {Progress,cleanSave,MISSIONS,SAVE_KEY} from '../src/progression.js';
import {VEHICLES,STAGES,UPGRADES,MAX_LEVEL,upgradeCost,tunedVehicle} from '../src/catalog.js';
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};};
test('Catalog IDs are unique and all specifications are finite',()=>{
  assert.equal(VEHICLES.length,32);assert.equal(STAGES.length,30);
  for(const list of [VEHICLES,STAGES])assert.equal(new Set(list.map(v=>v.id)).size,list.length);
  for(const v of VEHICLES){assert(v.radius>0);assert(v.speed>0);assert(v.fuel>0);assert.equal(v.price,Math.max(0,v.price));}
  for(const s of STAGES){assert(s.gravity>0);assert(s.grip>0);assert.equal(s.palette.length,6);}
});
test('Purchases are atomic, affordable and cannot be double-charged',()=>{
  const p=new Progress(memory());const money=p.data.coins;assert(!p.buyVehicle('rocket'));assert.equal(p.data.coins,money);
  p.data.coins=100000;assert(p.buyVehicle('motocross'));assert.equal(p.data.coins,96500);assert(p.buyVehicle('motocross'));assert.equal(p.data.coins,96500);
  assert(p.buyStage('desert'));assert.equal(p.data.coins,93000);assert(!p.buyVehicle('__proto__'));assert(!p.spend(-1,()=>assert.fail()));assert(!p.spend(NaN,()=>assert.fail()));
  assert(!p.spend(1,()=>assert.fail(),'unknown'));
});
test('Every upgrade has a real mechanical effect and a level cap',()=>{
  const p=new Progress(memory());p.data.coins=1e9;const initial=tunedVehicle('car');
  for(const u of UPGRADES){for(let i=0;i<MAX_LEVEL;i++)assert(p.upgrade('car',u.id));assert(!p.upgrade('car',u.id));}
  const v=tunedVehicle('car',p.levels('car'));assert(v.power>initial.power);assert(v.speed>initial.speed);assert(v.fuel>initial.fuel);assert(v.grip>initial.grip);assert(v.damping>initial.damping);
  assert.equal(upgradeCost(MAX_LEVEL),0);assert(!p.upgrade('rocket','engine'));
});
test('Garage custom parts alter chassis, wheels and engine',()=>{
  const normal=tunedVehicle('custom'),large=tunedVehicle('custom',{}, {frame:'heavy',wheels:'large',engine:'diesel'});
  assert(large.width>normal.width);assert(large.radius>normal.radius);assert(large.mass>normal.mass);assert(large.power>normal.power);
});
test('Legacy car and monowheel records migrate without losing them',()=>{
  const m=memory();m.setItem('hillclimb-best','456');m.setItem('hillclimb-best-monowheel','123');m.setItem('hillclimb-vehicle','monowheel');const p=new Progress(m);
  assert.equal(p.best('car','countryside'),456);assert.equal(p.best('monowheel','countryside'),123);assert.equal(p.data.selectedVehicle,'monowheel');
  assert.equal(new Progress(m).best('car','countryside'),456);
});
test('Save survives reload and rejects malformed values',()=>{
  const m=memory(),p=new Progress(m);p.data.coins=17000;p.buyVehicle('motocross');p.save();assert(new Progress(m).ownsVehicle('motocross'));
  const clean=cleanSave({version:3,coins:-99,gems:'NaN',ownedVehicles:['<script>'],selectedVehicle:'invalid',upgrades:{car:{engine:99999}}});
  assert.equal(clean.coins,0);assert.equal(clean.gems,0);assert.equal(clean.selectedVehicle,'car');assert.deepEqual(clean.ownedVehicles,['car','monowheel']);assert.equal(clean.upgrades.car.engine,MAX_LEVEL);
  assert.throws(()=>p.import('{'));assert.throws(()=>p.import('{"version":999}'));const before=p.data.coins;assert.throws(()=>p.import('x'.repeat(150001)));assert.equal(p.data.coins,before);
  assert.doesNotThrow(()=>new Progress({getItem(){throw Error();},setItem(){throw Error();}}));
});
test('Missions, daily challenge and daily gift only pay once',()=>{
  const p=new Progress(memory()),m=MISSIONS[0];assert(!p.claimMission(m.id));p.data.stats.distance=m.target;const before=p.data.coins;
  assert(p.claimMission(m.id));assert.equal(p.data.coins,before+m.reward);assert(!p.claimMission(m.id));
  assert(!p.completeDaily(499));assert(p.completeDaily(500));assert(!p.completeDaily(1000));assert(p.claimGift());assert(!p.claimGift());
});
test('Records are isolated by vehicle and stage; imports are whitelisted',()=>{
  const p=new Progress(memory());p.data.records['car:moon']=765;p.data.records['monowheel:countryside']=432;const copy=new Progress(memory());copy.import(p.export());
  assert.equal(copy.best('car','moon'),765);assert.equal(copy.best('car','countryside'),0);assert.equal(copy.best('monowheel','countryside'),432);
  assert.equal(copy.data.version,3);assert.equal(typeof copy.data.coins,'number');
});
