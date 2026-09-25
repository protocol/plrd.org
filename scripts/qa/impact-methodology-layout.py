"""Run in browser-harness with QA_ORIGIN and QA_OUT set before exec.
Actual rendered geometry: tabs, bottleneck hierarchy, accordions and noindex.
No auth or data writes. Screenshots are captures of the supplied origin.
"""
import json
from pathlib import Path

origin = globals().get('QA_ORIGIN', 'http://127.0.0.1:4171')
out = Path(globals().get('QA_OUT', '/opt/data/tmp/pr171/qa'))
out.mkdir(parents=True, exist_ok=True)
goto_url(origin + '/impact-preview-eb61fba1b98e/')
wait_for_load()
js('document.fonts.ready.then(() => true)', await_promise=True)
failures = []
results = []

def click_center(rect):
    click_at_xy(rect['x'] + rect['width'] / 2, rect['y'] + rect['height'] / 2)

def methodology_tab(label):
    return js(f"""(() => {{
      const e = [...document.querySelectorAll('[data-methodology-tabs] [role=tab]')].find(t => t.textContent.includes({label!r}));
      e.scrollIntoView({{block:'center', behavior:'instant'}});
      return e.getBoundingClientRect().toJSON();
    }})()""")

for width in [1440, 1146, 1024, 768, 640, 390, 320]:
    cdp('Emulation.setDeviceMetricsOverride', width=width, height=1000, deviceScaleFactor=1, mobile=False)
    click_center(methodology_tab('Diagnose'))
    result = js(r"""(() => {
      const tabs = [...document.querySelectorAll('[data-methodology-tabs] [role=tab]')].map(tab => tab.textContent.replace(/\s+/g,' ').trim());
      const selected = document.querySelector('[data-methodology-tabs] [role=tab][aria-selected="true"]')?.textContent.replace(/\s+/g,' ').trim();
      const names = [...document.querySelectorAll('[data-bottlenecks] > div > div:first-child')].map(el => ({
        text: el.textContent.trim(),
        font: parseFloat(getComputedStyle(el).fontSize),
      }));
      const question = [...document.querySelectorAll('#methodology p')].find(p => /preventing this field from moving faster/.test(p.textContent));
      const qFont = question ? parseFloat(getComputedStyle(question).fontSize) : 0;
      const panels = [...document.querySelectorAll('[role=tabpanel]')].map(p => ({id: p.querySelector('section')?.id, hidden: p.hidden}));
      return {
        width: innerWidth,
        client: document.documentElement.clientWidth,
        tabs,
        selected,
        names,
        qFont,
        nameFont: names[0] ? names[0].font : 0,
        panels,
        robot: document.querySelector('meta[name=robots]')?.content,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
      };
    })()""")
    results.append(result)
    if result['width'] != width:
        failures.append(f'{width}: wrong viewport')
    labels = ' | '.join(result['tabs'])
    if not all(name in labels for name in ['Diagnose', 'Intervene', 'Learn']):
        failures.append(f'{width}: missing Diagnose/Intervene/Learn tabs ({result["tabs"]})')
    if any(word in labels for word in ['Observe', 'Compound']):
        failures.append(f'{width}: Observe/Compound still present as tabs ({result["tabs"]})')
    if 'noindex' not in (result['robot'] or ''):
        failures.append(f'{width}: noindex missing')
    if result['overflow']:
        failures.append(f'{width}: horizontal overflow')
    if result['nameFont'] <= result['qFont']:
        failures.append(f"{width}: bottleneck names ({result['nameFont']}px) not larger than the question ({result['qFont']}px)")
    if len(result['names']) != 10:
        failures.append(f"{width}: expected 10 bottleneck names, got {len(result['names'])} {[n['text'] for n in result['names']]}")
    visible = [p for p in result['panels'] if not p['hidden']]
    if len(visible) != 1 or visible[0]['id'] != 'diagnose':
        failures.append(f'{width}: default tab should show only Diagnose ({result["panels"]})')

    for label, section in [('Intervene', 'intervene'), ('Learn', 'learn'), ('Diagnose', 'diagnose')]:
        click_center(methodology_tab(label))
        state = js(f"""(() => {{
          const panel = [...document.querySelectorAll('[role=tabpanel]')].find(p => p.querySelector('section')?.id === {section!r});
          const others = [...document.querySelectorAll('[role=tabpanel]')].filter(p => p !== panel);
          return {{
            selected: document.querySelector('[data-methodology-tabs] [role=tab][aria-selected="true"]')?.textContent.includes({label!r}),
            hidden: panel?.hidden,
            othersHidden: others.every(p => p.hidden),
            hash: location.hash,
          }};
        }})()""")
        if not state['selected'] or state['hidden'] or not state['othersHidden']:
            failures.append(f'{width}: {label} tab failed {state}')

    click_center(methodology_tab('Intervene'))
    for index in range(6):
        rect = js(f"""(() => {{
          const e = document.querySelectorAll('#intervene summary')[{index}];
          e.scrollIntoView({{block:'center', behavior:'instant'}});
          return e.getBoundingClientRect().toJSON();
        }})()""")
        capture_screenshot(path=str(out / 'interaction.png'))
        click_center(rect)
        state = js(f"""(() => {{
          const e = document.querySelectorAll('#intervene details')[{index}];
          return {{open: e.open, overflow: [...e.querySelectorAll('p')].some(p => p.scrollWidth > p.clientWidth + 1)}};
        }})()""")
        if not state['open'] or state['overflow']:
            failures.append(f'{width}: accordion {index + 1} failed {state}')
        press_key('Enter')
        if js(f"document.querySelectorAll('#intervene details')[{index}].open"):
            click_center(rect)

    if width in [1440, 390]:
        for label, section in [('Diagnose', 'diagnose'), ('Intervene', 'intervene'), ('Learn', 'learn')]:
            click_center(methodology_tab(label))
            js(f"""(() => {{
              const e = document.getElementById({section!r});
              window.scrollTo({{top: Math.max(0, e.getBoundingClientRect().top + window.scrollY - 85), behavior: 'instant'}});
              return e.getBoundingClientRect().toJSON();
            }})()""")
            capture_screenshot(path=str(out / f'{section}-{width}.png'))
        click_center(methodology_tab('Diagnose'))
        js("""(() => {
          const e = document.getElementById('field-velocity');
          e.scrollIntoView({block:'start', behavior:'instant'});
          return e.getBoundingClientRect().toJSON();
        })()""")
        capture_screenshot(path=str(out / f'field-velocity-{width}.png'))

(out / 'results.json').write_text(json.dumps({'origin': origin, 'results': results, 'failures': failures}, indent=2))
print(json.dumps({'results': results, 'failures': failures}, indent=2))
assert not failures, '\n'.join(failures)
