"""Drive BOTH vehicles over EVERY bridge in the production build.
Also check deck deflection, open ravines, restart, pause and camera stability.
Run after npm run build; requires Playwright Chromium (see README).
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SHOTS = ROOT / 'test-results'
SHOTS.mkdir(exist_ok=True)

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_): pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT / 'dist')))
Thread(target=server.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{server.server_port}/?test'

DRIVE = '''kind => {
  const s = window.__hillClimb.scene.getScene('HillClimb');
  s.matter.world.autoUpdate = false;
  const Body = s.matter.body;
  const step = (frames, throttle) => {
    s.keys.right.isDown = throttle > 0;
    for (let i=0; i<frames; i++) {
      s.matter.world.step(1000/60); s.update(0,1000/60); s.cameras.main.preRender();
    }
  };
  const results=[];
  for (let j=0;j<s.track.bridges.length;j++) {
    s.startRun(kind);
    const br=s.track.bridges[j], x=br.start-240;
    for(const b of [s.vehicle.body,...s.vehicle.wheels])
      Body.translate(b,{x:x-260,y:s.terrainY(x)-s.terrainY(260)});
    s.followVehicle(); step(120,0);
    const id=s.vehicle.body.id;
    const sag=()=>Math.max(...br.planks.map(p=>p.position.y-br.y-7));
    const unloaded=sag(); let maxSag=unloaded, touched=false, grounded=false;
    let lastX=s.cameras.main.scrollX,lastY=s.cameras.main.scrollY,maxStepX=0,maxStepY=0;
    for(let i=0;i<550;i++) {
      step(1,1); maxSag=Math.max(maxSag,sag());
      const c=s.cameras.main;
      maxStepX=Math.max(maxStepX,Math.abs(c.scrollX-lastX));
      maxStepY=Math.max(maxStepY,Math.abs(c.scrollY-lastY));lastX=c.scrollX;lastY=c.scrollY;
      for(const pair of s.matter.world.engine.pairs.list) {
        if(pair.isActive && ((pair.bodyA.plugin.bridge && pair.bodyB.label==='wheel') ||
          (pair.bodyB.plugin.bridge && pair.bodyA.label==='wheel'))) {
          touched=true; grounded ||= s.contacts.grounded;
        }
      }
      if(s.vehicle.body.id!==id || Math.min(...s.vehicle.wheels.map(w=>w.position.x))>br.end+40)break;
    }
    const midpoint=(br.start+br.end)/2;
    const invisibleSoil=s.terrainBodies.some(b=>b.bounds.min.x<midpoint && b.bounds.max.x>midpoint);
    results.push({bridge:j,unloaded,maxSag,touched,grounded,invisibleSoil,maxStepX,maxStepY,
      alive:s.vehicle.body.id===id,crossed:Math.min(...s.vehicle.wheels.map(w=>w.position.x))>br.end+40,
      anchored:br.planks[0].isStatic && br.planks.at(-1).isStatic,
      dynamic:br.planks.slice(1,-1).every(b=>!b.isStatic)});
  }
  s.clearInput();return results;
}'''

try:
    with sync_playwright() as p:
        browser=p.chromium.launch(args=['--no-sandbox','--disable-dev-shm-usage'])
        for width,height in [(1280,720),(390,844)]:
            page=browser.new_page(viewport={'width':width,'height':height})
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(URL);page.wait_for_selector('#start-run')
            for kind in ['car','monowheel']:
                results=page.evaluate(DRIVE,kind)
                assert len(results)==5, 'Expected five bridges'
                for r in results:
                    print(width,kind,json.dumps(r),flush=True)
                    assert r['alive'] and r['crossed'], 'Bridge is not passable'
                    assert r['touched'] and r['grounded'], 'Vehicle must contact actual moving boards'
                    assert r['dynamic'] and r['anchored'] and not r['invisibleSoil'], 'Invalid bridge physics'
                    assert r['maxSag']>r['unloaded']+3 and r['maxSag']<150, 'Deck must flex without collapsing'
                    assert r['maxStepX']<30 and r['maxStepY']<12, 'Camera jerk on bridge'
                # Capture the first bridge during actual driving, not a posed vehicle.
                page.evaluate('''kind=>{
                  const s=window.__hillClimb.scene.getScene('HillClimb');s.startRun(kind);
                  const step=()=>{s.matter.world.step(1000/60);s.update(0,1000/60);s.cameras.main.preRender()};
                  for(let i=0;i<90;i++)step();s.keys.right.isDown=true;
                  const id=s.vehicle.body.id;
                  for(let i=0;i<450 && s.vehicle.body.position.x<1880 && s.vehicle.body.id===id;i++)step();
                  s.clearInput();
                  if(s.vehicle.body.id!==id || s.vehicle.body.position.x<1800)throw Error('First bridge unreachable from start');
                }''',kind)
                page.screenshot(path=str(SHOTS/f'bridge-{kind}-{width}.png'))
            result=page.evaluate('''()=>{
              const s=window.__hillClimb.scene.getScene('HillClimb');
              const count=()=>[s.matter.world.localWorld.bodies.length,s.matter.world.localWorld.constraints.length];
              s.startRun('car');const before=count();
              for(let n=0;n<12;n++){s.startRun('monowheel');s.startRun('car')}
              const reset=s.track.bridges.every(br=>br.planks.every(b=>Math.abs(b.position.y-br.y-7)<1e-8 && b.angle===0 && b.speed===0));
              s.openGarage();const paused=!s.matter.world.enabled;s.closeGarage();
              const resumed=s.matter.world.enabled;
              const br=s.track.bridges[0], b=s.vehicle.body, id=b.id;
              const dx=(br.start+br.end)/2-b.position.x,dy=br.y+190-b.position.y;
              for(const part of [b,...s.vehicle.wheels])s.matter.body.translate(part,{x:dx,y:dy});
              for(let n=0;n<300 && s.vehicle.body.id===id;n++){s.matter.world.step(1000/60);s.update(0,1000/60)}
              return {before,after:count(),reset,paused,resumed,respawn:s.vehicle.body.id!==id};
            }''')
            assert result['before']==result['after'], 'Restart leaks bridge objects'
            assert all(result[k] for k in ['reset','paused','resumed','respawn']), result
            assert not errors,errors
            page.close()
        browser.close()
finally:
    server.shutdown()
print('All bridge regressions passed.',flush=True)
