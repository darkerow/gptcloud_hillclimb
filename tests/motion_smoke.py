"""Frame-level motion regression using the production build and Phaser's real loop.
Unlike fixed-physics-only tests, this executes frames with zero/one/multiple ticks.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import importlib.util
import json
import os
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'test-results'
OUT.mkdir(exist_ok=True)

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *_): pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(ROOT / 'dist')))
Thread(target=server.serve_forever, daemon=True).start()

try:
    with sync_playwright() as p:
        options = {'args': ['--no-sandbox', '--disable-dev-shm-usage']}
        if os.getenv('CHROMIUM_BIN'):
            options['executable_path'] = os.environ['CHROMIUM_BIN']
        browser = p.chromium.launch(**options)
        report = []
        for width, height in [(1280, 720), (390, 844)]:
            page = browser.new_page(viewport={'width': width, 'height': height})
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            if os.getenv('HILL_TEST_MEMORY'):
                spec = importlib.util.spec_from_file_location('boot', ROOT / '.local/in_memory.py')
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                module.boot(page)
            else:
                page.goto(f'http://127.0.0.1:{server.server_port}/?test')
                page.wait_for_selector('#start-run')
            page.evaluate('__hillClimb.loop.stop()')
            for vehicle in ['car', 'monowheel']:
                for fps in [30, 60, 90, 120, 144, 165, 240, 'variable']:
                    result = page.evaluate('''({vehicle, fps}) => {
                        const s = __hillClimb.scene.getScene('HillClimb');
                        s.matter.world.autoUpdate = false;
                        s.startRun(vehicle, 'countryside', 'sandbox');
                        // Use a flat lane to isolate frame judder from actual bumps.
                        s.hasStarted = false;
                        const world = s.matter.world, camera = s.cameras.main;
                        for (const body of [...world.localWorld.bodies])
                            if (body.label === 'terrain') world.remove(body);
                        for (const bridge of s.track.bridges) world.remove(bridge.constraints);
                        s.matter.add.rectangle(10000, 660, 30000, 100,
                            {isStatic:true, label:'terrain', friction:1});
                        for(let i=0;i<90;i++) world.step(1000/60);
                        s.keys.right.isDown = true;
                        for(let i=0;i<240;i++) {
                            world.step(1000/60); s.update(0,1000/60); camera.preRender();
                        }
                        world.autoUpdate = true;
                        const frames = fps === 'variable' ? [8,9,7,11,6,18,5,24,8,16] : [1000/fps];
                        world.runner.timeLastTick = 10000; world.runner.timeBuffer = 0;
                        world.runner.frameDeltaHistory = []; world.runner.frameDelta = frames[0];
                        let time=10000, elapsed=0, i=0, last=null, noTickFrames=0, movingFrames=0;
                        let maxBack=0, baselineBack=0, maxNoTickBack=0, finite=true;
                        while(elapsed<3000) {
                            const dt=frames[i++%frames.length]; time+=dt; elapsed+=dt;
                            s.sys.step(time,dt); camera.preRender();
                            const v=s.vehicle, raw=v.body.position;
                            const pose=s.motion.sample(v.body);
                            finite &&= [pose.position.x,pose.position.y,pose.angle,camera.scrollX].every(Number.isFinite);
                            const now={sprite:v.bodySprite.x, screen:v.bodySprite.x-camera.scrollX,
                                rawScreen:raw.x-camera.scrollX,tick:world.engine.timing.timestamp};
                            if(elapsed>1000 && last) {
                                maxBack=Math.max(maxBack,last.screen-now.screen);
                                baselineBack=Math.max(baselineBack,last.rawScreen-now.rawScreen);
                                if(now.tick===last.tick) {
                                    noTickFrames++;
                                    if(now.sprite>last.sprite+.01) movingFrames++;
                                    maxNoTickBack=Math.max(maxNoTickBack,last.screen-now.screen);
                                }
                            }
                            last=now;
                            if(Math.abs(v.bodySprite.x-pose.position.x)>1e-8) throw Error('Body render phase mismatch');
                            for(let j=0;j<v.wheels.length;j++)
                                if(Math.abs(v.wheelSprites[j].x-s.motion.sample(v.wheels[j]).position.x)>1e-8)
                                    throw Error('Wheel render phase mismatch');
                        }
                        const before={x:s.vehicle.bodySprite.x,y:s.vehicle.bodySprite.y,c:camera.scrollX};
                        s.hasStarted=true; s.pauseRun();
                        for(let i=0;i<10;i++){time+=8;s.sys.step(time,8);camera.preRender();}
                        const frozen=before.x===s.vehicle.bodySprite.x && before.y===s.vehicle.bodySprite.y
                            && before.c===camera.scrollX;
                        s.closeGarage(); time+=10000; s.sys.step(time,8); camera.preRender();
                        const resumeJump=Math.abs(s.vehicle.bodySprite.x-before.x);
                        s.startRun(vehicle,'countryside','sandbox');
                        const reset=s.motion.sample(s.vehicle.body).position.x===260;
                        return {fps,vehicle,finite,noTickFrames,movingFrames,maxBack,baselineBack,maxNoTickBack,frozen,reset,resumeJump};
                    }''', {'vehicle': vehicle, 'fps': fps})
                    result['viewport'] = width
                    report.append(result)
                    print(json.dumps(result), flush=True)
                    assert result['finite'] and result['reset'], 'Invalid/stale render pose'
                    assert result['frozen'], 'Paused render changes pose'
                    assert result['resumeJump'] < 30, 'Long pause causes a catch-up teleport'
                    assert result['maxBack'] < 1.5, 'Vehicle visibly snaps backward between frames'
                    if isinstance(fps, int) and fps > 60:
                        assert result['noTickFrames'] > 0, 'High-refresh path was not exercised'
                        assert result['movingFrames'] == result['noTickFrames'], 'Vehicle freezes between physics ticks'
                        assert result['baselineBack'] > 2, 'Fixture no longer reproduces original un-interpolated judder'
                        assert result['maxNoTickBack'] < 0.5, 'No-physics frame produces backward judder'
            assert not errors, errors
            page.close()
        (OUT / 'motion-report.json').write_text(json.dumps(report, indent=2))
        browser.close()
finally:
    server.shutdown()
print('Frame-level motion regressions passed.', flush=True)
