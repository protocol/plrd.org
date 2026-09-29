# pyright: reportUndefinedVariable=false
# Browser-harness injects js/cdp/capture_screenshot and the native input functions.
# Execute through browser-harness after acquiring the task's browser lock.
# QA_ORIGIN and QA_OUT may be provided in the harness globals. No storage mutations.
import json
import time
from pathlib import Path
origin = globals().get('QA_ORIGIN', 'http://127.0.0.1:34721').rstrip('/')
out = Path(globals().get('QA_OUT', '/opt/data/tmp/cover-c-browser'))
out.mkdir(parents=True, exist_ok=True)
reports = []

def check(condition, note):
    if not condition:
        raise AssertionError(note)

def snap(name):
    return capture_screenshot(path=str(out / (name + '.png')))

def rect(selector):
    return js('(() => {const e=document.querySelector(' + json.dumps(selector) + '); if(!e) return null; const r=e.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height};})()')

def reveal(selector):
    js('document.querySelector(' + json.dumps(selector) + ').scrollIntoView({block:"center",behavior:"instant"})')
    r = rect(selector)
    check(r and r['w'] > 0 and r['h'] > 0, 'visible target ' + selector)
    return r

def click(selector, name):
    r = reveal(selector)
    snap(name + '-before')
    click_at_xy(r['x'] + r['w']/2, r['y'] + min(r['h']/2, 100))
    time.sleep(.25)
    snap(name + '-after')

def wait_js(expression):
    for _ in range(30):
        if js(expression):
            return
        time.sleep(.2)
    raise AssertionError('timed out: ' + expression)

for width in [1440, 1024, 768, 390, 320]:
    cdp('Emulation.setDeviceMetricsOverride', width=width, height=1000 if width>700 else 844, deviceScaleFactor=1, mobile=False)
    goto_url(origin + '/interventions/')
    wait_for_load()
    wait_js("!!document.querySelector('#featured-interventions')")
    # Reveal every lazily loaded image; HTML presence alone is not asset-delivery proof.
    count = js("document.querySelectorAll('[data-intervention-cover]').length")
    check(count == 18, 'expected 3 featured + 15 catalog images')
    for index in range(count):
        js(f"document.querySelectorAll('[data-intervention-cover]')[{index}].scrollIntoView({{block:'center',behavior:'instant'}})")
        wait_js(f"(() => {{ const i=document.querySelectorAll('[data-intervention-cover]')[{index}]; return i.complete && i.naturalWidth>0 }})()")
    layout = js("""(() => {
      const selectors='section[aria-labelledby="featured-interventions"] a,section[aria-labelledby="explore-all-interventions"] li a';
      return {inner:innerWidth, client:document.documentElement.clientWidth, scroll:document.documentElement.scrollWidth,
        mapImages:document.querySelectorAll('section[aria-labelledby="portfolio-map"] img').length,
        bad:[...document.querySelectorAll(selectors)].flatMap(a=>{
          const r=a.getBoundingClientRect(); let issues=[];
          if(r.left<0 || r.right>innerWidth+1 || a.scrollWidth>a.clientWidth+1) issues.push('card bounds');
          const img=a.querySelector('img'); if(!img || !img.complete || !img.naturalWidth) issues.push('image load');
          if(img){const i=img.getBoundingClientRect();if(i.left<r.left || i.right>r.right+1)issues.push('image bounds');}
          return issues.map(issue=>({href:a.getAttribute('href'),issue}));
        })};
    })()""")
    check(layout['inner'] == width, f'viewport mismatch {width}: {layout}')
    check(layout['scroll'] <= width and not layout['bad'] and layout['mapImages']==0, f'layout {width}: {layout}')
    js("document.querySelector('#featured-interventions').scrollIntoView({block:'start',behavior:'instant'})")
    check(rect('#featured-interventions')['y'] >= 60, 'featured heading below sticky navigation')
    snap(f'featured-{width}')
    js("document.querySelector('#explore-all-interventions').scrollIntoView({block:'start',behavior:'instant'})")
    snap(f'catalog-{width}')
    click('[aria-label="Group the map"] button:nth-child(2)', f'group-area-{width}')
    check(js("document.querySelector('[aria-label=\"Group the map\"] button:nth-child(2)').getAttribute('aria-pressed')") == 'true', 'native grouping')
    check(js("document.querySelectorAll('section[aria-labelledby=\"explore-all-interventions\"] img').length") == 15, 'art retained after regrouping')
    snap(f'catalog-area-{width}')
    # Native image hit opens the exact selected program, not a separate art lightbox.
    click('section[aria-labelledby="featured-interventions"] a img', f'open-cover-{width}')
    wait_js("!!document.querySelector('[role=dialog]')")
    check(js("document.querySelector('[role=dialog] img').dataset.interventionCover") == 'sovereign-ai', 'matching dialog cover')
    check('/interventions/sovereign-ai' in page_info()['url'], 'program address')
    js("document.querySelector('[role=dialog]').parentElement.scrollTo({top:0,behavior:'instant'})")
    snap(f'detail-{width}')
    dialog = rect('[role=dialog]')
    check(dialog['x']>=0 and dialog['x']+dialog['w']<=width, 'dialog bounds')
    click('[role=dialog] button[aria-label=Close]', f'close-{width}')
    wait_js("!document.querySelector('[role=dialog]')")
    reports.append({'width':width,'layout':layout,'grouping':'pass','imageLinkDialogClose':'pass'})

# Direct URL and reload also show the cover; Escape still closes it.
goto_url(origin+'/interventions/connectomics-benchmark/')
wait_for_load()
wait_js("!!document.querySelector('[role=dialog]')")
wait_js("document.querySelector('[role=dialog] img').complete && document.querySelector('[role=dialog] img').naturalWidth>0")
check(js("document.querySelector('[role=dialog] img').dataset.interventionCover")=='connectomics-benchmark','direct link identity')
snap('direct-detail-320')
cdp('Page.reload')
wait_for_load()
wait_js("!!document.querySelector('[role=dialog]')")
check(js("document.querySelector('[role=dialog] img').dataset.interventionCover")=='connectomics-benchmark','reload art retained')
press_key('Escape')
time.sleep(.3)
snap('escape-after-reload')
wait_js("!document.querySelector('[role=dialog]')")
(out/'results.json').write_text(json.dumps({'origin':origin,'viewports':reports,'directReloadEscape':'pass'},indent=2))
print(json.dumps({'origin':origin,'result':'PASS','widths':[r['width'] for r in reports],'screenshots':str(out)}))
