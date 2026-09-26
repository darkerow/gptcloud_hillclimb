"""Camera regressions against the production build and real Phaser cameras."""
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

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(args=['--no-sandbox', '--disable-dev-shm-usage'])
        for width, height in [(1280, 720), (390, 844)]:
            page = browser.new_page(viewport={'width': width, 'height': height})
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto(URL)
            page.wait_for_selector('#start-run')
            for kind in ['car', 'monowheel']:
                result = page.evaluate('''kind => {
                    const s = window.__hillClimb.scene.getScene('HillClimb');
                    s.matter.world.autoUpdate = false;
                    s.startRun(kind);
                    const c = s.cameras.main, rig = s.cameraRig;
                    const fake = { type:kind, body:{position:{x:1000,y:430}},
                        wheels:[{position:{x:1000.25,y:500.75}}] };
                    if (kind === 'car') fake.wheels.push({position:{x:1096.25,y:500.75}});
                    rig.track(fake, s.scale.width);
                    c.preRender();
                    const ys = [], xs = [];
                    for(let i=0;i<240;i++) {
                        fake.body.position.x = 1000 + Math.sin(i)*25;
                        fake.body.position.y = 430 + Math.cos(i)*15;
                        fake.wheels.forEach(w => w.position.y = 500.75 + Math.sin(i)*8);
                        rig.update(1000/60); c.preRender();
                        xs.push(c.scrollX); ys.push(c.scrollY);
                    }
                    const range = a => Math.max(...a)-Math.min(...a);
                    const noise = { x:range(xs), y:range(ys), roundPixels:c.roundPixels };
                    s.followVehicle();
                    for(let i=0;i<90;i++) { s.matter.world.step(1000/60); s.update(0,1000/60); c.preRender(); }
                    const initialId = s.vehicle.body.id;
                    const startX = s.vehicle.body.position.x;
                    s.keys.right.isDown = true;
                    let maxStepX=0, maxStepY=0, visible=true;
                    let previousX=c.scrollX, previousY=c.scrollY;
                    for(let i=0;i<240;i++) {
                        s.matter.world.step(1000/60); s.update(0,1000/60); c.preRender();
                        maxStepX=Math.max(maxStepX, Math.abs(c.scrollX-previousX));
                        maxStepY=Math.max(maxStepY, Math.abs(c.scrollY-previousY));
                        previousX=c.scrollX; previousY=c.scrollY;
                        const pos=s.vehicle.body.position;
                        visible &&= pos.x>c.scrollX && pos.x<c.scrollX+c.width
                            && pos.y>c.scrollY+60 && pos.y<c.scrollY+c.height-100;
                    }
                    s.clearInput();
                    return {noise, maxStepX, maxStepY, visible,
                        dx:s.vehicle.body.position.x-startX, alive:s.vehicle.body.id===initialId};
                }''', kind)
                print(width, kind, json.dumps(result), flush=True)
                assert result['noise']['x'] < 1e-8 and result['noise']['y'] < 1e-8, 'Body bob/bumps move the camera'
                assert result['noise']['roundPixels'] is False, 'Whole-pixel camera rounding returned'
                assert result['dx'] > 60 and result['alive'], 'Driving regressed'
                assert result['visible'], 'Vehicle leaves the viewport'
                assert result['maxStepX'] < 30 and result['maxStepY'] < 12, 'Sudden camera jump'
                page.screenshot(path=str(SHOTS / f'camera-{kind}-{width}.png'))
            assert not errors, errors
            page.close()
        browser.close()
finally:
    server.shutdown()
print('Camera browser regressions passed.', flush=True)
