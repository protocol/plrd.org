import csv,json,time
from pathlib import Path
root=Path(globals().get('QA_ROOT',Path.cwd()))
out=root/'docs/methodology-refresh-20261106';out.mkdir(parents=True,exist_ok=True)
origin=globals().get('QA_ORIGIN','http://127.0.0.1:38762')
results=[]

def native(selector):
    js(f'''(() => {{const e=document.querySelector({json.dumps(selector)});if(!e)throw Error('missing control');e.scrollIntoView({{block:'center',behavior:'instant'}});}})()''')
    capture_screenshot(path=str(out/'interaction.png'))
    r=js(f'''document.querySelector({json.dumps(selector)}).getBoundingClientRect().toJSON()''')
    click_at_xy(r['x']+r['width']/2,r['y']+r['height']/2)
    time.sleep(.4)

for width in [1440,390,320]:
    cdp('Emulation.setDeviceMetricsOverride',width=width,height=1000,deviceScaleFactor=1,mobile=width<640)
    goto_url('http://127.0.0.1:38761/methodology/?area=neurotech#learn');wait_for_load()
    assert wait_for_element('[data-instrument="idea_vintage"]',visible=True)
    js("document.querySelector('#field-velocity').scrollIntoView({block:'start',behavior:'instant'})")
    capture_screenshot(path=str(out/f'local-main-before-{width}.png'))
    for area in ['digital-human-rights','economies-governance','ai-robotics','neurotech']:
        goto_url(origin+'/methodology/?area='+area+'#learn');wait_for_load()
        assert wait_for_element('[data-instrument="idea_vintage"]',visible=True)
        for _ in range(30):
            if js("document.querySelector('[data-instrument=idea_vintage]').innerText.includes('Citation latency')"):break
            time.sleep(.1)
        state=js("({label:document.querySelector('[data-instrument=idea_vintage]').innerText,translation:document.querySelector('[data-instrument=latency_compression]').innerText,width:innerWidth,client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth})")
        assert state['label'].startswith('Citation latency'),state
        assert state['translation'].startswith('Latency compression'),state
        if width>320: assert state['scroll']<=state['client']+1,state
        if area=='neurotech':
            js("document.querySelector('#field-velocity').scrollIntoView({block:'start',behavior:'instant'})")
            capture_screenshot(path=str(out/f'local-candidate-overview-{width}.png'))
        goto_url(origin+'/methodology/?area='+area+'#fv/'+area+'/idea_vintage/primary');wait_for_load()
        assert wait_for_element('[role="dialog"]',visible=True),(width,area)
        heading=js("document.querySelector('[role=dialog] h2').innerText")
        assert 'citation latency' in heading.lower(),heading
        assert js("document.querySelector('[role=dialog] .gallery-plot svg')!==null")
        if area=='neurotech':capture_screenshot(path=str(out/f'local-candidate-chart-{width}.png'))
        native('[role="dialog"] [data-flip-action]')
        assert js("document.querySelector('[role=dialog] [data-face=data]').getAttribute('aria-hidden')")=='false'
        actual=js("[...document.querySelectorAll('[role=dialog] [data-face=data] tbody tr')].map(r=>[...r.children].map(c=>c.innerText))")
        expected=list(csv.DictReader(line for line in (root/f'src/data/velocity/{area}.csv').read_text().splitlines() if not line.startswith('#')))
        expected=[r for r in expected if r['idea_vintage_median_years']]
        assert len(actual)==len(expected),(area,len(actual),len(expected))
        for got,want in zip(actual,expected):
            assert int(got[0])==int(want['year']) and float(got[1])==float(want['idea_vintage_median_years']),(got,want)
            if want['vintage_ci_lo'] and want['vintage_ci_hi']:
                assert got[2].startswith(f"{float(want['vintage_ci_lo']):g}–{float(want['vintage_ci_hi']):g};"),(got,want)
            assert ('Under-indexed' in got[2])==(want['reliable']=='0'),(got,want)
        press_key('Escape');time.sleep(.2)
        assert js("document.querySelector('[role=dialog]')===null")
        results.append({'width':width,'area':area,'title':heading,'sourceRows':len(actual),'labels':state,'legacyLink':True,'escape':True})
report={'passed':True,'sourceRevision':globals().get('QA_REVISION','local candidate; source CSVs read at replay time'),'provenance':'Local production builds. Canonical domain browser blocked by organization policy; public HTML read separately.','results':results}
(out/'browser-qa.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
