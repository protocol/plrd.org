import json, time
from pathlib import Path
origin = globals().get('QA_ORIGIN', 'http://127.0.0.1:3351')
out = Path(globals().get('QA_OUT', '/opt/data/tmp/plrd-refresh-browser-baseline'))
expected_dir = Path(globals().get('QA_EXPECTED', '/opt/data/tmp/plrd-refresh-live'))
out.mkdir(parents=True, exist_ok=True)
areas = ['digital-human-rights', 'economies-governance', 'ai-robotics', 'neurotech']
results = []

def until(fn, desc, seconds=20):
    end=time.monotonic()+seconds
    while time.monotonic()<end:
        value=fn()
        if value: return value
        time.sleep(.1)
    raise AssertionError(desc)

def click(selector):
    js(f"(() => {{const e=document.querySelector({json.dumps(selector)}); if(!e) throw Error('Missing target'); e.scrollIntoView({{block:'center',behavior:'instant'}});}})()")
    capture_screenshot(path=str(out/'interaction.png'))
    pos=js(f"(() => {{const e=document.querySelector({json.dumps(selector)}); const r=e.getBoundingClientRect(); const x=r.x+r.width/2,y=r.y+r.height/2; return {{x,y,hit:e.contains(document.elementFromPoint(x,y))}};}})()")
    assert pos['hit'], (selector,pos)
    click_at_xy(pos['x'],pos['y'])
    time.sleep(.35)

def bounds():
    return js("({width:innerWidth,client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,dialog:document.querySelector('[role=dialog]')?.getBoundingClientRect().toJSON()})")

for width in [1440,390,320]:
    cdp('Emulation.setDeviceMetricsOverride',width=width,height=1000,deviceScaleFactor=1,mobile=width<640)
    for area in areas:
        expected=json.loads((expected_dir/f'{area}.json').read_text())
        records={r['instrument']:r for r in expected['records']}
        cdp('Page.bringToFront')
        cdp('Emulation.setEmulatedMedia', features=[{'name':'prefers-reduced-motion','value':'reduce'}])
        goto_url(origin+f'/methodology/?area={area}#learn');wait_for_load()
        until(lambda:js("document.querySelector('[data-methodology-tabs] [aria-selected=true]')?.textContent?.includes('Learn')"),'Learn hydration')
        js('document.fonts.ready.then(()=>true)', await_promise=True)
        time.sleep(1)
        for instrument in ['idea_vintage','latency_compression']:
            r=records[instrument]
            selector=f'[data-instrument="{instrument}"]'
            cover_text=js(f"document.querySelector({json.dumps(selector)}).innerText")
            if instrument=='latency_compression':
                if area=='digital-human-rights':
                    assert 'Accelerating' not in cover_text and 'Selected completions' in cover_text,cover_text
                else:
                    assert 'Evidence gap' in cover_text and 'Coming soon' not in cover_text,cover_text
            click(selector)
            until(lambda:js("!!document.querySelector('[role=dialog]')"),'modal')
            view=bounds()
            assert view['width']==width and view['scroll']<=view['client']+1,view
            assert view['dialog']['left']>=-1 and view['dialog']['right']<=width+1,view
            chart_count=js("document.querySelectorAll('[role=dialog] [data-is-chart=true]').length")
            expected_count=1 if r['state']=='reading' and len(r.get('series',[]))>1 else 0
            assert chart_count==expected_count,(area,instrument,chart_count)
            if expected_count:
                plot=js("(() => {const s=document.querySelector('[role=dialog] [data-face=chart] .gallery-plot svg'); return {lines:[...s.querySelectorAll('polyline')].map(e=>e.getAttribute('points')),text:s.textContent,rect:s.getBoundingClientRect().toJSON()};})()")
                assert plot['lines'] and plot['rect']['width']>200,plot
                face_text=js("document.querySelector('[role=dialog] [data-face=chart]').innerText")
                assert 'years' in face_text
                if instrument=='latency_compression':
                    for term in ['Median lag by final-specification publication year','not a field-wide trend','exclude unfinished transitions','month-normalized']:
                        assert term in face_text,(term,face_text)
                    assert 'Accelerating' not in face_text

                if width in [1440,390,320]: capture_screenshot(path=str(out/f'{area}-{instrument}-{width}-chart.png'))
                click('[role=dialog] [data-flip-action]')
                assert js("document.querySelector('[role=dialog] [data-face=data]').getAttribute('aria-hidden')")=='false'
                data=js("(() => {const e=document.querySelector('[role=dialog] [data-face=data]');return {rows:[...e.querySelectorAll('tbody tr')].map(r=>[...r.cells].map(c=>c.textContent)),text:e.innerText,links:[...e.querySelectorAll('a')].map(a=>a.href)};})()")
                assert len(data['rows'])==len(r['series']),(area,instrument,len(data['rows']),len(r['series']))
                for row,point in zip(data['rows'],r['series']):
                    assert float(row[0])==float(point['x']) and float(row[1])==float(point['y']),(row,point)
                    if point.get('reliable') is False: assert 'Under-indexed' in row[2]
                assert r['value'] in data['text'],(r['value'],data['text'])
                if r.get('checkedAt'): assert r['checkedAt'][:10] in data['text']
                assert data['links'],(area,instrument,'missing sources')
                if width==1440: capture_screenshot(path=str(out/f'{area}-{instrument}-{width}-data.png'))
                click('[role=dialog] [data-flip-action]')
            else:
                text=js("document.querySelector('[role=dialog]').innerText")
                assert 'No chart is wired' in text and r['blocker'] in text
                assert js("document.querySelectorAll('[role=dialog] svg polyline').length")==0
                if r.get('sources'): assert js("document.querySelectorAll('[role=dialog] a[target=_blank]').length") >= len(r['sources'])
                if width in [1440,390,320]: capture_screenshot(path=str(out/f'{area}-{instrument}-{width}-gap.png'))
            url=js('location.href')
            assert f'#fv/{area}/{instrument}/' in url,url
            press_key('Escape')
            until(lambda:js("!document.querySelector('[role=dialog]')"),'dismissal')
            assert js(f"document.activeElement===document.querySelector({json.dumps(selector)})"),(area,instrument,'focus')
            results.append({'width':width,'area':area,'instrument':instrument,'charts':chart_count,'points':len(r.get('series',[])),'url':url,'bounds':view})
        if width in [1440,390,320]:
            js("document.querySelector('[data-instrument=idea_vintage]').scrollIntoView({block:'center',behavior:'instant'})")
            capture_screenshot(path=str(out/f'{area}-{width}-overview.png'))
(out/'results.json').write_text(json.dumps({'origin':origin,'pass':True,'results':results},indent=2))
print(json.dumps({'pass':True,'cases':len(results),'output':str(out)}))
