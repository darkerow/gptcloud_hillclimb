import test from 'node:test';
import assert from 'node:assert/strict';
import {VEHICLES,tunedVehicle,STAGES} from '../src/catalog.js';
import {suspensionFor} from '../src/suspension.js';

test('all 32 models have bounded, positive suspension configurations',()=>{
 for(const spec of VEHICLES){const s=suspensionFor(spec);for(const field of ['spring','damping','travel','inertia','air'])assert.ok(Number.isFinite(s[field]),`${spec.id}: ${field}`);assert.ok(s.spring>0&&s.spring<1);assert.ok(s.damping>0&&s.damping<1);if(spec.id!=='monowheel')assert.ok(s.travel>0);}
});
test('vehicle classes and individual models are not using one generic spring',()=>{
 const t=id=>tunedVehicle(id).suspension;
 assert.ok(t('race').spring>t('monster').spring);
 assert.ok(t('monster').travel>t('race').travel);
 assert.ok(t('bus').inertia>t('motocross').inertia);
 assert.notDeepEqual(t('rally'),t('car'));assert.notDeepEqual(t('minibike'),t('superbike'));
});
test('tall bodies have room for compression below their spring mounts',()=>{
 for(const id of ['van','bus','ambulance','firetruck','truck','diesel','armored']){
  const s=tunedVehicle(id);assert.ok(s.clearance-(s.height/2-7)>=30,`${id}: insufficient suspension space`);
 }
});
test('upgrades increase damping and controlled travel without unstable stiffness',()=>{
 for(const model of VEHICLES){const a=tunedVehicle(model.id),b=tunedVehicle(model.id,{suspension:15});assert.ok(b.suspension.damping>a.suspension.damping);assert.ok(b.suspension.spring<=1.2);if(model.id!=='monowheel')assert.ok(b.suspension.travel>a.suspension.travel);}
});
test('stage-specific gravity, surface grip, biome and progression are preserved',()=>{
 assert.equal(STAGES.length,30);for(const id of ['moon','mars','alien'])assert.ok(STAGES.find(s=>s.id===id).gravity<.5);
 assert.ok(STAGES.find(s=>s.id==='glacier').grip<.1);
 assert.equal(STAGES.find(s=>s.id==='storm').hazard,'wind');
});
