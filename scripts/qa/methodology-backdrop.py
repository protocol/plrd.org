"""Run inside browser-harness with QA_ORIGIN and QA_OUT; no data writes."""
import json
import time
from pathlib import Path

origin = QA_ORIGIN.rstrip('/')
out = Path(QA_OUT)
out.mkdir(parents=True, exist_ok=True)
route = '/interventions-preview-872d1767c376/methodology/'
results = []

def click_tab(tab):
    selector = f'[data-methodology-tabs] [role=tab][id$="-tab-{tab}"]'
    capture_screenshot(path=str(out / 'interaction.png'))
    rect = js(f'''(() => {{
      const el = document.querySelector({json.dumps(selector)});
      el.scrollIntoView({{block:'center', behavior:'instant'}});
      return el.getBoundingClientRect().toJSON();
    }})()''')
    click_at_xy(rect['x'] + rect['width']/2, rect['y'] + rect['height']/2)
    time.sleep(.25)
    assert js("document.querySelector('[role=tabpanel]:not([hidden]) section').id") == tab

for width in [1440, 390, 320]:
    cdp('Emulation.setDeviceMetricsOverride', width=width, height=1000, deviceScaleFactor=1, mobile=width<640)
    goto_url(origin + route)
    wait_for_load()
    js('document.fonts.ready.then(() => true)', await_promise=True)
    for theme in ['light', 'dark']:
        # CSS theme probe only; do not persist a preference in localStorage.
        js(f"document.documentElement.classList.toggle('dark', {str(theme == 'dark').lower()})")
        for tab, surface in [('diagnose', '#methodology'), ('intervene', '#intervene'), ('learn', '#field-velocity')]:
            click_tab(tab)
            state = js(f'''(() => {{
              const e = document.querySelector({json.dumps(surface)});
              const bg = x => getComputedStyle(x).backgroundColor;
              const effective = x => {{while(x && bg(x)==='rgba(0, 0, 0, 0)') x=x.parentElement; return x ? bg(x) : 'transparent';}};
              return {{surface:{json.dumps(surface)}, background:bg(e), effective:effective(e), body:effective(document.body),
                width:innerWidth, client:document.documentElement.clientWidth, scroll:document.documentElement.scrollWidth,
                selected:document.querySelector('[data-methodology-tabs] [aria-selected=true]').textContent.trim(),
                robots:document.querySelector('meta[name=robots]')?.content,
                cards:document.querySelectorAll('#field-velocity [data-chart-deck]').length}};
            }})()''')
            assert state['background'] == 'rgba(0, 0, 0, 0)', state
            assert state['effective'] == state['body'], state
            if tab == 'learn':
                state['galleryBackground'] = js("getComputedStyle(document.querySelector('#field-velocity .instrument-preview-viewport')).backgroundColor")
                assert state['galleryBackground'] == 'rgba(0, 0, 0, 0)', state
            assert state['width'] == width and state['scroll'] <= state['client'] + 1, state
            assert 'noindex' in state['robots'], state
            # Show the section with its tabs, not the shared intro or obscured heading.
            js(f'''(() => {{
              const e=document.querySelector({json.dumps(surface)});
              const tabs=document.querySelector('[data-methodology-tabs]').getBoundingClientRect().height;
              const header=document.querySelector('header').getBoundingClientRect().height;
              window.scrollTo({{top:window.scrollY+e.getBoundingClientRect().top-header-tabs,behavior:'instant'}});
            }})()''')
            time.sleep(.2)
            capture_screenshot(path=str(out / f'{tab}-{theme}-{width}.png'))
            results.append(dict(state, theme=theme, tab=tab))
    js("document.documentElement.classList.remove('dark')")

# Legacy URL renders the same shared page and retains area and tab selection.
goto_url(origin + '/impact-preview-eb61fba1b98e/?area=neurotech#learn')
wait_for_load()
time.sleep(.3)
assert js("document.querySelector('[role=tabpanel]:not([hidden]) section').id") == 'learn'
assert js("getComputedStyle(document.querySelector('#field-velocity')).backgroundColor") == 'rgba(0, 0, 0, 0)'
report = dict(origin=origin, route=route, results=results, legacy=True, passed=True)
(out / 'results.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2))
