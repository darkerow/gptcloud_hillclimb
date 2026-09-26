"""Handling and presentation regression suite. Not a claim of unlimited-track balance.
960 stock vehicle/stage spawn+short-drive checks; all-vehicle drop/settling tests;
physical stage effects, carousel controls and reachable mobile UI.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json, os, importlib.util
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'test-results';OUT.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*_):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT/'dist')))
Thread(target=server.serve_forever,daemon=True).start()
def boot(page):
 if os.getenv('HILL_TEST_MEMORY'):
  spec=importlib.util.spec_from_file_location('boot',ROOT/'.local/in_memory.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);m.boot(page)
 else:page.goto(f'http://127.0.0.1:{server.server_port}/?test');page.wait_for_selector('#start-run')
def check(ok,text):
 assert ok,text
 print('PASS:',text,flush=True)
try:
 with sync_playwright() as p:
  options={'args':['--no-sandbox','--disable-dev-shm-usage']}
  if os.getenv('CHROMIUM_BIN'):options['executable_path']=os.environ['CHROMIUM_BIN']
  browser=p.chromium.launch(**options);page=browser.new_page(viewport={'width':1280,'height':720});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));boot(page)
  matrix=[]
  for index in range(30):
   rows=page.evaluate('''index=>{
    const s=__hillClimb.scene.getScene('HillClimb'),stage=__catalog.stages[index],out=[];
    s.matter.world.autoUpdate=false;
    for(const model of __catalog.vehicles){
     s.startRun(model.id,stage.id,'sandbox');
     for(let i=0;i<90&&!s.finished;i++)s.matter.world.step(1000/60);
     const spawn=s.finished,start=s.vehicle.body.position.x;s.keys.right.isDown=true;
     for(let i=0;i<80&&!s.finished;i++)s.matter.world.step(1000/60);
     const b=s.vehicle.body;out.push({vehicle:model.id,stage:stage.id,spawn,finished:s.finished,dx:b.position.x-start,
      finite:[b.position.x,b.position.y,b.angle,...s.vehicle.wheels.flatMap(w=>[w.position.x,w.position.y])].every(Number.isFinite),
      gravity:s.matter.world.engine.gravity.y,expected:stage.gravity});s.clearInput();
    }return out;
   }''',index)
   matrix.extend(rows);fail=[r for r in rows if r['spawn'] or not r['finite'] or r['dx']<=5]
   print('MATRIX',rows[0]['stage'],len(rows),'bad',json.dumps(fail),flush=True)
  (OUT/'handling-matrix.json').write_text(json.dumps(matrix,indent=2))
  check(len(matrix)==960 and all(r['finite'] and not r['spawn'] and r['dx']>5 and r['gravity']==r['expected'] for r in matrix),'960 combinations spawn, advance and use the selected gravity')
  drops=page.evaluate('''()=>{
   const s=__hillClimb.scene.getScene('HillClimb'),result=[];s.matter.world.autoUpdate=false;
   for(const model of __catalog.vehicles){
    s.startRun(model.id,'countryside','sandbox');s.hasStarted=false;
    for(const b of [...s.matter.world.localWorld.bodies])if(b.label==='terrain')s.matter.world.remove(b);
    for(const bridge of s.track.bridges)s.matter.world.remove(bridge.constraints);
    const floor=s.matter.add.rectangle(260,610,6000,100,{isStatic:true,label:'terrain',friction:1});
    for(let i=0;i<240;i++)s.matter.world.step(1000/60);
    for(const b of [s.vehicle.body,...s.vehicle.wheels])s.matter.body.translate(b,{x:0,y:-100});
    let maxCompression=0,relative=0;const tail=[];
    for(let i=0;i<300;i++){
     s.matter.world.step(1000/60);
     for(const z of s.vehicle.suspension){maxCompression=Math.max(maxCompression,z.compression);relative=Math.max(relative,z.compression/z.rest);}
     if(i>=240)tail.push(s.vehicle.body.position.y);
    }
    const settled=Math.max(...tail)-Math.min(...tail),angle=Math.atan2(Math.sin(s.vehicle.body.angle),Math.cos(s.vehicle.body.angle));
    result.push({id:model.id,compression:maxCompression,relative,settled,angle,finite:Number.isFinite(settled)});s.matter.world.remove(floor);
   }s.hasStarted=true;return result;
  }''')
  (OUT/'suspension-drop-tests.json').write_text(json.dumps(drops,indent=2))
  for r in drops:
   print('DROP',json.dumps(r),flush=True)
   check(r['finite'] and r['settled']<4 and abs(r['angle'])<.65,f"100px landing settles: {r['id']}")
   if r['id'] not in ['monowheel','hovercraft']:check(r['compression']>.4 and r['relative']<.95,f"Spring has travel and doesn't invert: {r['id']}")
  effects=page.evaluate('''()=>{
   const s=__hillClimb.scene.getScene('HillClimb'),out={};s.startRun('car','arctic','sandbox');
   s.vehicle.body.position.x=2310;s.track.environment(s.vehicle,true,16);out.ice=s.vehicle.wheels[0].friction<s.vehicle.spec.grip;
   s.startRun('car','mud','sandbox');s.vehicle.body.position.x=2350;s.matter.body.setVelocity(s.vehicle.body,{x:5,y:0});s.track.environment(s.vehicle,true,16);out.mud=s.vehicle.body.force.x<0;
   s.startRun('car','highway','sandbox');s.vehicle.body.position.x=2310;s.vehicle.throttle=1;s.track.environment(s.vehicle,true,16);out.pad=s.vehicle.body.force.x>0;
   s.startRun('car','storm','sandbox');s.track.clock=5000;s.track.environment(s.vehicle,false,16);out.wind=Math.abs(s.vehicle.body.force.x)>0;
   for(const stage of ['construction','mountain']){s.startRun('car',stage,'sandbox');out[stage]=s.track.events.objects.length>0&&s.track.events.objects.every(o=>!o.body.isStatic);}
   s.startRun('car','city','sandbox');for(let x=2000;x<120000;x+=3000)s.track.ensure(x);out.bounded=s.track.events.objects.length<8;s.startRun('car','countryside','sandbox');return out;
  }''')
  check(all(effects.values()),'Surface grip, drag, acceleration pads, wind and bounded physical props: '+json.dumps(effects))
  page.close()
  for w,h in [(1280,720),(390,844),(844,390),(320,568)]:
   page=browser.new_page(viewport={'width':w,'height':h});boot(page)
   for tab in ['vehicles','stages','upgrades','missions','shop']:
    page.locator(f'.menu-tabs [data-id="{tab}"]').click()
    reach=page.locator('#start-run').evaluate('''el=>{const b=el.getBoundingClientRect();const top=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return b.bottom<=innerHeight&&b.top>=0&&(el===top||el.contains(top));}''')
    check(reach,f'{w}×{h}: {tab} start button is not clipped or covered')
   page.locator('.menu-tabs [data-id="vehicles"]').click();page.locator('[data-action="next"]').click()
   check(page.locator('[data-vehicle="monowheel"]').get_attribute('aria-pressed')=='true','Arrow selects the next vehicle')
   page.keyboard.press('ArrowLeft');check(page.locator('[data-vehicle="car"]').get_attribute('aria-pressed')=='true','Keyboard carousel navigation')
   page.screenshot(path=str(OUT/f'arcade-garage-{w}.png'))
   for stage,vehicle in [('countryside','car'),('moon','lunar'),('desert','trophy'),('arctic','monster'),('cave','buggy'),('city','bus')]:
    if w not in [1280,390]:break
    page.evaluate('''({stage,vehicle})=>{const s=__hillClimb.scene.getScene('HillClimb');s.matter.world.autoUpdate=false;s.startRun(vehicle,stage,'sandbox');for(let i=0;i<90;i++){s.matter.world.step(1000/60);s.cameraRig.update(1000/60);s.cameras.main.preRender();}s.track.draw();}''',{'stage':stage,'vehicle':vehicle})
    page.screenshot(path=str(OUT/f'arcade-{stage}-{w}.png'))
   page.close()
  check(not errors,'No browser exceptions during handling tests: '+str(errors));browser.close()
finally:server.shutdown()
print('All handling and presentation checks passed.',flush=True)
