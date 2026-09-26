"""Browser smoke/regression checks. Run after npm run build.
Requires: pip install playwright==1.57.0 && playwright install chromium
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
    def log_message(self, *_):
        pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT / 'dist')))
Thread(target=server.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{server.server_port}/?test'
SCENE = 'window.__hillClimb.scene.getScene("HillClimb")'

# A synchronous block of fixed steps makes physics assertions independent of CI FPS.
STEP = """({frames, throttle}) => {
  const s = window.__hillClimb.scene.getScene('HillClimb');
  s.matter.world.autoUpdate = false;
  s.keys.right.isDown = throttle > 0;
  s.keys.left.isDown = throttle < 0;
  const start = s.vehicle.body.position.x;
  const initialId = s.vehicle.body.id;
  let fallen = false;
  for (let i = 0; i < frames; i++) {
    s.matter.world.step(1000 / 60);
    s.update(0, 1000 / 60);
    fallen ||= s.vehicle.body.id !== initialId;
  }
  s.clearInput();
  const b = s.vehicle.body;
  return {x:b.position.x, y:b.position.y, angle:b.angle, dx:b.position.x-start,
    distance:s.distance, best:s.bestDistance, fallen, type:s.vehicleType,
    wheels:s.vehicle.wheels.length, grounded:s.contacts.grounded};
}"""

def check(value, message):
    if not value:
        raise AssertionError(message)
    print('PASS:', message, flush=True)

with sync_playwright() as p:
    browser = p.chromium.launch(args=['--no-sandbox', '--disable-dev-shm-usage'])
    page = browser.new_page(viewport={'width':1280, 'height':720})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL)
    page.wait_for_selector('[data-vehicle="monowheel"]')
    check(page.locator('#garage').is_visible(), 'Garage is shown on first load')
    check(page.locator('[data-vehicle]').count() == 2, 'Exactly two vehicle choices')
    page.screenshot(path=str(SHOTS / 'garage-desktop.png'))

    for kind, wheels in [('car', 2), ('monowheel', 1)]:
        page.locator(f'[data-vehicle="{kind}"]').click()
        check(page.locator(f'[data-vehicle="{kind}"]').get_attribute('aria-pressed') == 'true', f'{kind} card selected')
        page.locator('#start-run').click()
        check(page.locator('#garage').is_hidden(), f'{kind}: garage closes on start')
        state = page.evaluate(STEP, {'frames':90, 'throttle':0})
        print(kind, 'settled', json.dumps(state), flush=True)
        check(state['type'] == kind and state['wheels'] == wheels, f'{kind}: correct physics vehicle')
        check(not state['fallen'], f'{kind}: stable after spawn')
        state = page.evaluate(STEP, {'frames':240, 'throttle':1})
        print(kind, 'driven', json.dumps(state), flush=True)
        check(state['dx'] > 60, f'{kind}: throttle advances vehicle')
        check(not state['fallen'], f'{kind}: survives initial driving segment')
        page.screenshot(path=str(SHOTS / f'{kind}-desktop.png'))
        page.locator('#open-garage').click()
        check(page.evaluate(f'!{SCENE}.matter.world.enabled'), 'Garage pauses physics')
        check(page.locator('#resume-run').is_visible(), 'Existing run can be resumed')
        page.locator('#resume-run').click()
        check(page.evaluate(f'{SCENE}.matter.world.enabled'), 'Resume restores physics')
        page.locator('#restart').click()
        check(page.evaluate(f'{SCENE}.distance') == 0, f'{kind}: restart resets distance')
        check(page.evaluate(f'{SCENE}.vehicle.wheels.length') == wheels, f'{kind}: restart keeps vehicle type')
        page.locator('#open-garage').click()

    check(page.evaluate("Number(localStorage.getItem('hillclimb-best-car')) > 0"), 'Car record saved')
    check(page.evaluate("Number(localStorage.getItem('hillclimb-best-monowheel')) > 0"), 'Monowheel record saved separately')
    page.reload()
    page.wait_for_selector('[data-vehicle="monowheel"]')
    check(page.locator('[data-vehicle="monowheel"]').get_attribute('aria-pressed') == 'true', 'Vehicle choice survives reload')
    page.locator('#start-run').click()
    counts = page.evaluate("""() => {
      const s=window.__hillClimb.scene.getScene('HillClimb');
      const count=()=>[s.matter.world.localWorld.bodies.length,s.matter.world.localWorld.constraints.length];
      s.startRun('car'); const a=count();
      for(let i=0;i<20;i++){s.startRun('monowheel');s.startRun('car');}
      return {a,b:count(),uis:document.querySelectorAll('.game-interface').length};
    }""")
    check(counts['a'] == counts['b'] and counts['uis'] == 1, 'Switching twenty times does not leak objects')
    page.keyboard.press('v')
    check(page.locator('#garage').is_visible(), 'V opens garage')
    page.keyboard.press('Escape')
    check(page.locator('#garage').is_hidden(), 'Escape resumes current run')
    page.evaluate("localStorage.setItem('hillclimb-vehicle','invalid');localStorage.setItem('hillclimb-best-car','NaN')")
    page.reload(); page.wait_for_selector('[data-vehicle="car"]')
    check(page.locator('[data-vehicle="car"]').get_attribute('aria-pressed') == 'true', 'Invalid saved selection falls back to car')
    check(page.evaluate(f'{SCENE}.bestDistance') == 0, 'Invalid record falls back to zero')
    check(not errors, f'No browser exceptions: {errors}')
    page.close()

    mobile = browser.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True, device_scale_factor=1)
    page = mobile.new_page()
    mobile_errors=[]
    page.on('pageerror', lambda e: mobile_errors.append(str(e)))
    page.goto(URL); page.wait_for_selector('[data-vehicle="monowheel"]')
    check(page.locator('#start-run').is_visible(), 'Start button is accessible on mobile')
    page.screenshot(path=str(SHOTS / 'garage-mobile.png'))
    page.locator('[data-vehicle="monowheel"]').tap()
    page.locator('#start-run').tap()
    page.evaluate(STEP, {'frames':90,'throttle':0})
    cdp = mobile.new_cdp_session(page)
    gas=page.locator('#throttle').bounding_box(); brake=page.locator('#brake').bounding_box()
    a={'x':gas['x']+gas['width']/2, 'y':gas['y']+gas['height']/2, 'id':1}
    b={'x':brake['x']+brake['width']/2, 'y':brake['y']+brake['height']/2, 'id':2}
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[a]})
    check(page.evaluate(f'{SCENE}.ui.throttle') == 1, 'Touch throttle pressed')
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[a,b]})
    check(page.evaluate(f'{SCENE}.ui.throttle') == 0, 'Both pedals pressed cancel each other')
    cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[a]})
    check(page.evaluate(f'{SCENE}.ui.throttle') == 1, 'Releasing brake keeps throttle held')
    cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    check(page.evaluate(f'{SCENE}.ui.throttle') == 0, 'Touch release clears throttle')
    page.screenshot(path=str(SHOTS / 'monowheel-mobile.png'))
    page.set_viewport_size({'width':844,'height':390})
    page.locator('#open-garage').tap()
    check(page.locator('#start-run').is_visible(), 'Landscape garage usable')
    page.screenshot(path=str(SHOTS / 'garage-landscape.png'))
    check(not mobile_errors, f'No mobile browser exceptions: {mobile_errors}')
    mobile.close()

    blocked=browser.new_context()
    blocked.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage disabled')}})")
    page=blocked.new_page(); page.goto(URL)
    page.wait_for_selector('[data-vehicle="monowheel"]'); page.locator('#start-run').click()
    check(page.locator('#garage').is_hidden(), 'Game works when storage is disabled')
    blocked.close(); browser.close()
server.shutdown()
print('All browser checks passed.', flush=True)
