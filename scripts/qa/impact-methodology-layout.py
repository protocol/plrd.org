"""Run in browser-harness with QA_ORIGIN and QA_OUT set before exec.
Actual rendered geometry: quote spacing, grid labels, accordions and noindex.
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
for width in [1440, 1146, 1024, 768, 640, 390, 320]:
    cdp('Emulation.setDeviceMetricsOverride', width=width, height=1000, deviceScaleFactor=1, mobile=False)
    result = js(r"""(() => {
      const quote = document.querySelector('#diagnose blockquote');
      const previous = quote.previousElementSibling;
      const hero = document.querySelector('h1').closest('section');
      const cards = [...hero.querySelector('.grid').children];
      const labels = cards.map(card => {
        const label = [...card.children].find(e=>['Diagnose','Intervene','Observe','Compound','Learn'].includes(e.textContent.trim()));
        const range=document.createRange(); range.selectNodeContents(label);
        const r=range.getBoundingClientRect(), box=card.getBoundingClientRect();
        return {text:label.textContent.trim(),left:r.left-box.left,right:box.right-r.right};
      });
      const summary=document.querySelector('#intervene summary');
      return {width:innerWidth,client:document.documentElement.clientWidth,
        quoteGap:quote.getBoundingClientRect().top-previous.getBoundingClientRect().bottom,
        labels,numberColor:getComputedStyle(cards[0].firstElementChild).color,
        robot:document.querySelector('meta[name=robots]')?.content,
        summaryRect:summary.getBoundingClientRect().toJSON()};
    })()""")
    results.append(result)
    if result['width'] != width: failures.append(f'{width}: wrong viewport')
    if result['quoteGap'] < 20: failures.append(f"{width}: diagnosis quote overlaps/crowds intro (gap {result['quoteGap']}px)")
    if any(x['left'] < 10 or x['right'] < 10 for x in result['labels']): failures.append(f'{width}: operating-model label intrudes into card padding')
    if result['numberColor'] == 'rgb(246, 246, 246)': failures.append(f'{width}: nearly invisible step numbers')
    if 'noindex' not in (result['robot'] or ''): failures.append(f'{width}: noindex missing')
    # Native summary activation, all six rows. Reset before each width.
    for index in range(6):
        rect=js(f"(() => {{const e=document.querySelectorAll('#intervene summary')[{index}];e.scrollIntoView({{block:'center',behavior:'instant'}});return e.getBoundingClientRect().toJSON()}})()")
        capture_screenshot(path=str(out/'interaction.png'))
        click_at_xy(rect['x']+rect['width']/2,rect['y']+rect['height']/2)
        state=js(f"(() => {{const e=document.querySelectorAll('#intervene details')[{index}];return {{open:e.open,overflow:[...e.querySelectorAll('p')].some(p=>p.scrollWidth>p.clientWidth+1)}}}})()")
        if not state['open'] or state['overflow']: failures.append(f'{width}: accordion {index+1} failed {state}')
        press_key('Enter')
        # Pointer focus is not guaranteed on summary in every browser; close with a native click if still open.
        if js(f"document.querySelectorAll('#intervene details')[{index}].open"):
            click_at_xy(rect['x']+rect['width']/2,rect['y']+rect['height']/2)
    for section in ['diagnose','intervene','field-velocity'] if width in [1440,390] else []:
        js(f"(() => {{const e=document.getElementById('{section}');window.scrollTo({{top:e.offsetTop-85,behavior:'instant'}});return e.getBoundingClientRect().toJSON()}})()")
        capture_screenshot(path=str(out/f'{section}-{width}.png'))
(out/'results.json').write_text(json.dumps({'origin':origin,'results':results,'failures':failures},indent=2))
print(json.dumps({'results':results,'failures':failures},indent=2))
assert not failures, '\n'.join(failures)
