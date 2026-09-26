"""Production-browser checks for economy, the complete roster, stages and bridges.
Run after npm run build. Screenshots go to test-results/.
Local offline development may inject the same modules without network access.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json, os, importlib.util
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
SHOTS=ROOT/'test-results';SHOTS.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*_):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT/'dist')))
Thread(target=server.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{server.server_port}/?test'
SCENE="window.__hillClimb.scene.getScene('HillClimb')"
def load(page):
    if os.getenv('HILL_TEST_MEMORY'):
        spec=importlib.util.spec_from_file_location('local_boot',ROOT/'.local/in_memory.py')
        module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);module.boot(page)
    else:
        page.goto(URL);page.wait_for_selector('#start-run')
def check(value,message):
    assert value,message
    print('PASS:',message,flush=True)
try:
  with sync_playwright() as p:
    opts={'args':['--no-sandbox','--disable-dev-shm-usage']}
    if os.getenv('CHROMIUM_BIN'):opts['executable_path']=os.environ['CHROMIUM_BIN']
    browser=p.chromium.launch(**opts)
    page=browser.new_page(viewport={'width':1280,'height':800})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)));load(page)
    check(page.locator('[data-vehicle]').count()==32,'32 vehicle cards')
    page.screenshot(path=str(SHOTS/'garage-desktop.png'))
    page.locator('.menu-tabs [data-action="tab"][data-id="stages"]').click()
    check(page.locator('[data-stage]').count()==30,'30 stage cards')
    page.screenshot(path=str(SHOTS/'stages-desktop.png'))
    page.locator('.menu-tabs [data-action="tab"][data-id="missions"]').click()
    check(page.locator('.mission-card').count()==12,'12 functional achievements')
    page.locator('.menu-tabs [data-action="tab"][data-id="shop"]').click()
    before=page.evaluate(f'{SCENE}.progress.data.coins')
    page.locator('[data-action="gift"]').click()
    check(page.evaluate(f'{SCENE}.progress.data.coins')==before+1000,'Daily gift paid once')
    check(page.locator('[data-action="gift"]').is_disabled(),'Repeated daily gift disabled')
    page.locator('[data-action="buy-boost"][data-id="fuel"]').click()
    check(page.evaluate(f'{SCENE}.progress.data.boosters.fuel')==3,'Booster shop purchase')
    page.evaluate(f'{SCENE}.progress.data.coins=100000')
    page.locator('.menu-tabs [data-action="tab"][data-id="vehicles"]').click()
    page.locator('[data-vehicle="motocross"]').click()
    page.locator('[data-action="buy-vehicle"]').click()
    check(page.evaluate(f'{SCENE}.progress.ownsVehicle("motocross")'),'Vehicle unlocked through UI')
    page.locator('.menu-tabs [data-action="tab"][data-id="upgrades"]').click()
    page.locator('[data-action="upgrade"][data-id="engine"]').click()
    check(page.evaluate(f'{SCENE}.progress.levels("motocross").engine')==1,'Upgrade purchased through UI')
    page.screenshot(path=str(SHOTS/'workshop-desktop.png'))
    page.locator('.menu-tabs [data-action="tab"][data-id="stages"]').click()
    page.locator('[data-stage="desert"]').click();page.locator('[data-action="buy-stage"]').click()
    check(page.evaluate(f'{SCENE}.progress.ownsStage("desert")'),'Stage unlocked through UI')
    page.locator('#start-run').click()
    check(page.locator('#garage').is_hidden(),'Start closes the garage')
    page.locator('#pause').click()
    check(page.evaluate(f'!{SCENE}.matter.world.enabled'),'Pause stops physics')
    page.locator('#resume-run').click()
    check(page.evaluate(f'{SCENE}.matter.world.enabled'),'Resume restores physics')
    result=page.evaluate('''()=>{
      const s=window.__hillClimb.scene.getScene('HillClimb');s.matter.world.autoUpdate=false;
      s.startRun('car','countryside','career');s.track.items=[];s.fuel=0.5;
      for(let i=0;i<360&&!s.finished;i++)s.matter.world.step(1000/60);
      const ended=s.finished,reason=s.ui.result?.reason;
      const money=s.progress.data.coins;s.endRun('duplicate');
      return {ended,reason,stable:money===s.progress.data.coins};
    }''')
    check(result['ended'] and result['reason']=='Закончилось топливо','Fuel exhaustion ends the run')
    check(result['stable'],'Results never double-pay rewards')
    page.screenshot(path=str(SHOTS/'results-desktop.png'))
    result=page.evaluate('''()=>{
      const s=window.__hillClimb.scene.getScene('HillClimb');s.startRun('car','countryside','career');
      const b=s.vehicle.body,p=s.progress.data,before=p.coins;
      s.track.items=[{kind:'coin',x:b.position.x,y:b.position.y,value:100,taken:false},{kind:'fuel',x:b.position.x,y:b.position.y,value:1,taken:false}];s.fuel=1;
      s.matter.world.step(1000/60);const first=p.coins;s.matter.world.step(1000/60);
      const once=first===before+100&&p.coins===first,refilled=s.fuel>60;
      const count=p.boosters.nitro;s.useBooster('nitro');const consumed=p.boosters.nitro===count-1&&s.nitro===5;
      s.pauseRun();const paused=s.useBooster('fuel')===false;s.closeGarage();
      const bank=p.coins,record=s.progress.best('car','countryside');s.startRun('rocket','moon','sandbox');s.award(999);s.award(10,'gem');
      return {once,refilled,consumed,paused,sandbox:p.coins===bank&&s.progress.best('car','countryside')===record};
    }''')
    check(all(result.values()),f'Collectibles, boosters, pause and sandbox isolation: {result}')
    # Every vehicle actually spawns and drives; not just a catalogue entry.
    results=page.evaluate('''()=>{
      const s=window.__hillClimb.scene.getScene('HillClimb'),out=[];s.matter.world.autoUpdate=false;
      for(const v of window.__catalog.vehicles){s.startRun(v.id,'countryside','sandbox');
        for(let i=0;i<90&&!s.finished;i++)s.matter.world.step(1000/60);
        const rest=s.finished,start=s.vehicle.body.position.x;s.keys.right.isDown=true;
        for(let i=0;i<180&&!s.finished;i++){s.matter.world.step(1000/60);s.cameraRig.update(1000/60);}
        out.push({id:v.id,rest,dx:s.vehicle.body.position.x-start,finished:s.finished});s.clearInput();}
      return out;
    }''')
    for r in results:check(not r['rest'] and r['dx']>50 and not r['finished'],f"Vehicle drives: {r['id']}")
    results=page.evaluate('''()=>{
      const s=window.__hillClimb.scene.getScene('HillClimb'),out=[];
      for(const stage of window.__catalog.stages){s.startRun('car',stage.id,'sandbox');
        for(let i=0;i<90&&!s.finished;i++)s.matter.world.step(1000/60);
        const rest=s.finished,start=s.vehicle.body.position.x;s.keys.right.isDown=true;
        for(let i=0;i<160&&!s.finished;i++)s.matter.world.step(1000/60);
        out.push({id:stage.id,rest,dx:s.vehicle.body.position.x-start,finished:s.finished,gravity:s.matter.world.engine.gravity.y,expected:stage.gravity});s.clearInput();}
      return out;
    }''')
    for r in results:check(not r['rest'] and r['dx']>20 and r['gravity']==r['expected'],f"Stage runs: {r['id']}")
    # A contact/deflection/camera test for all five spans, not a claim that every
    # possible vehicle-stage combination or an entire endless run was tested.
    results=page.evaluate('''()=>{
      const s=window.__hillClimb.scene.getScene('HillClimb'),out=[];
      for(const kind of ['car','monowheel'])for(const start of [1660,4840,8680,12880,17860]){
        s.startRun(kind,'countryside','sandbox');const x=start-260;s.track.ensure(x);const bridge=s.track.bridges.find(b=>b.start===start);
        const targetY=s.track.height(x)-(kind==='monowheel'?148:135),offset={x:x-s.vehicle.body.position.x,y:targetY-s.vehicle.body.position.y};
        for(const b of [s.vehicle.body,...s.vehicle.wheels])s.matter.body.translate(b,offset);
        s.followVehicle();const c=s.cameras.main;c.preRender();
        for(let i=0;i<90&&!s.finished;i++){s.matter.world.step(1000/60);s.cameraRig.update(1000/60);c.preRender();}
        s.keys.right.isDown=true;let touched=false,sag=0,jumpX=0,jumpY=0,px=c.scrollX,py=c.scrollY;
        for(let i=0;i<650&&!s.finished&&s.vehicle.body.position.x<bridge.end+160;i++){
          s.matter.world.step(1000/60);s.cameraRig.update(1000/60);c.preRender();
          touched||=s.contacts.grounded&&s.vehicle.body.position.x>bridge.start&&s.vehicle.body.position.x<bridge.end;
          sag=Math.max(sag,...bridge.planks.map(p=>p.position.y-bridge.y-7));
          jumpX=Math.max(jumpX,Math.abs(c.scrollX-px));jumpY=Math.max(jumpY,Math.abs(c.scrollY-py));px=c.scrollX;py=c.scrollY;
        }
        out.push({kind,start,touched,sag,crossed:s.vehicle.body.position.x>bridge.end,finished:s.finished,jumpX,jumpY});s.clearInput();
      }return out;
    }''')
    for r in results:
      print('BRIDGE',json.dumps(r),flush=True)
      check(r['touched'] and r['sag']>1 and r['crossed'] and not r['finished'],f"Bridge crossing {r['kind']} at {r['start']}")
      check(r['jumpX']<35 and r['jumpY']<16,'Camera stays damped on moving bridge')
    page.evaluate('''()=>{const s=window.__hillClimb.scene.getScene('HillClimb');s.startRun('monowheel','countryside','sandbox');for(let i=0;i<90;i++)s.matter.world.step(1000/60);s.keys.right.isDown=true;for(let i=0;i<210;i++){s.matter.world.step(1000/60);s.cameraRig.update(1000/60);s.cameras.main.preRender();}s.clearInput();s.track.draw();}''')
    page.wait_for_timeout(150);page.screenshot(path=str(SHOTS/'bridge-monowheel.png'))
    counts=page.evaluate('''()=>{const s=window.__hillClimb.scene.getScene('HillClimb');s.startRun('car','countryside','sandbox');const count=()=>[s.matter.world.localWorld.bodies.length,s.matter.world.localWorld.constraints.length,s.children.list.length];const a=count();for(let i=0;i<12;i++){s.startRun('monowheel','moon','sandbox');s.startRun('car','countryside','sandbox');}const b=count();for(let x=2500;x<60000;x+=2500)s.track.ensure(x);return {a,b,bodies:s.matter.world.localWorld.bodies.length,chunks:s.track.chunks.length,items:s.track.items.length};}''')
    check(counts['a']==counts['b'],'Repeated vehicle/stage switches do not leak bodies or graphics')
    check(counts['bodies']<1300 and counts['chunks']<7 and counts['items']<300,f'Endless world stays bounded: {counts}')
    check(not errors,f'No desktop JavaScript exceptions: {errors}')
    page.close()
    mobile=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1)
    page=mobile.new_page();mobile_errors=[];page.on('pageerror',lambda e:mobile_errors.append(str(e)));load(page)
    page.screenshot(path=str(SHOTS/'garage-mobile.png'))
    for tab in ['stages','upgrades','missions','shop','vehicles']:
      page.locator(f'.menu-tabs [data-action="tab"][data-id="{tab}"]').tap()
      check(page.locator('#start-run').is_visible(),f'Mobile start remains accessible in {tab}')
      check(not page.evaluate('document.documentElement.scrollWidth>innerWidth'),'No horizontal overflow')
    page.locator('[data-vehicle="monowheel"]').tap();page.locator('#start-run').tap()
    page.evaluate(f'{SCENE}.matter.world.autoUpdate=false')
    cdp=mobile.new_cdp_session(page)
    gas=page.locator('#throttle').bounding_box();brake=page.locator('#brake').bounding_box()
    a={'x':gas['x']+gas['width']/2,'y':gas['y']+gas['height']/2,'id':1}
    b={'x':brake['x']+brake['width']/2,'y':brake['y']+brake['height']/2,'id':2}
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[a]})
    check(page.evaluate(f'{SCENE}.ui.throttle')==1,'Mobile throttle pressed')
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[a,b]})
    check(page.evaluate(f'{SCENE}.ui.throttle')==0,'Both pedals cancel')
    cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[b]})
    check(page.evaluate(f'{SCENE}.ui.throttle')==1,'Releasing brake preserves held throttle')
    cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    check(page.evaluate(f'{SCENE}.ui.throttle')==0,'All touches released')
    page.evaluate('''()=>{const s=window.__hillClimb.scene.getScene('HillClimb');for(let i=0;i<90;i++){s.matter.world.step(1000/60);s.cameraRig.update(1000/60);s.cameras.main.preRender();}s.track.draw();}''')
    page.screenshot(path=str(SHOTS/'game-mobile.png'))
    page.set_viewport_size({'width':844,'height':390});page.locator('#open-garage').tap()
    check(page.locator('#start-run').is_visible(),'Landscape garage is usable')
    page.screenshot(path=str(SHOTS/'garage-landscape.png'))
    check(not mobile_errors,f'No mobile JavaScript exceptions: {mobile_errors}')
    mobile.close();browser.close()
finally:
  server.shutdown()
print('All expanded browser checks passed.',flush=True)
