import json,time
from pathlib import Path
origin=globals().get('QA_ORIGIN','http://127.0.0.1:3287')
out=Path(globals().get('QA_OUT','/opt/data/tmp/impact-cleanup-0929/docs/methodology-nesting'))
out.mkdir(parents=True,exist_ok=True)
base='/interventions-preview-872d1767c376/'
route=base+'methodology/'
results=[]
def rect(selector):
    return js(f'''(() => {{const e=document.querySelector({json.dumps(selector)}); if(!e) throw Error('missing '+{json.dumps(selector)});e.scrollIntoView({{block:'center',behavior:'instant'}});return e.getBoundingClientRect().toJSON();}})()''')
def click(selector):
    r=rect(selector);capture_screenshot(path=str(out/'interaction.png'));click_at_xy(r['x']+r['width']/2,r['y']+r['height']/2);time.sleep(.3)

goto_url(origin+base);wait_for_load()
for width in [1440,768,390,320]:
    cdp('Emulation.setDeviceMetricsOverride',width=width,height=1000,deviceScaleFactor=1,mobile=width<640)
    goto_url(origin+base);wait_for_load()
    click(f'a[href="{route}"]');wait_for_load()
    assert js('location.pathname')==route
    js('document.fonts.ready.then(()=>true)',await_promise=True)
    assert js('document.querySelectorAll("[data-methodology-tabs] [role=tab]").length')==3
    assert js('document.querySelectorAll(":modal").length')==0
    js("window.scrollTo({top:0,behavior:'instant'})")
    time.sleep(.25)
    s=js('''(() => {const b=document.querySelector('nav[aria-label="Breadcrumb"]');return {width:innerWidth,client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,breadcrumb:b.innerText,links:[...b.querySelectorAll('a')].filter(e=>e.getClientRects().length).map(e=>({text:e.textContent,href:e.getAttribute('href')})),h1:document.querySelector('h1').innerText,font:getComputedStyle(document.querySelector('h1')).fontSize,title:document.title,canonical:document.querySelector('link[rel=canonical]')?.href,robots:document.querySelector('meta[name=robots]')?.content,googlebot:document.querySelector('meta[name=googlebot]')?.content};})()''')
    assert s['width']==width and s['scroll']<=s['client']+1,s
    assert 'Interventions' in s['breadcrumb'] and 'Impact' not in s['breadcrumb'],s
    if width>=640: assert 'Home' in s['breadcrumb'] and 'Methodology' in s['breadcrumb'],s
    assert s['h1']=='How we build fields.' and s['font']==('44px' if width>=768 else '32px'),s
    assert 'noindex' in s['robots'] and 'noindex' in s['googlebot'],s
    assert s['canonical'].endswith(route),s
    capture_screenshot(path=str(out/f'methodology-{width}.png'))
    for label in ['intervene','learn','diagnose']:
        click(f'[role=tab][id$="-tab-{label}"]')
        state=js('''(() => {const e=document.querySelector('[role=tabpanel]:not([hidden])');return {section:e.querySelector('section')?.id,path:location.pathname,hash:location.hash};})()''')
        assert state=={'section':label,'path':route,'hash':'#'+label},state
    # The parent crumb is a real navigation link on desktop and mobile.
    click(f'nav[aria-label="Breadcrumb"] '+('ol' if width>=640 else 'div.sm\\:hidden')+f' a[href="{base}"]');wait_for_load()
    assert js('location.pathname')==base
    results.append(s)
# Fresh deep link and compatibility path retain selected area and fragment.
for path in [route,'/impact-preview-eb61fba1b98e/']:
    goto_url(origin+path+'?area=neurotech#learn');wait_for_load();time.sleep(.4)
    s=js('''({path:location.pathname,search:location.search,hash:location.hash,selected:document.querySelector('[role=tabpanel]:not([hidden]) section')?.id,breadcrumb:document.querySelector('nav[aria-label="Breadcrumb"]').textContent})''')
    assert s['selected']=='learn' and s['search']=='?area=neurotech',s
    assert 'Impact' not in s['breadcrumb'] and 'Interventions' in s['breadcrumb'],s
    results.append(s)
(out/'results.json').write_text(json.dumps({'origin':origin,'results':results,'pass':True},indent=2))
print(json.dumps({'origin':origin,'results':results,'pass':True},indent=2))
