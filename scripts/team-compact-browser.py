import json, os
from pathlib import Path
out=Path(os.environ['QA_OUT'])
goto_url(os.environ['QA_ORIGIN'].rstrip('/')+'/authors/');wait_for_load()
results=[]
for width,height in [(1440,1000),(390,844),(320,844)]:
    cdp('Emulation.setDeviceMetricsOverride',width=width,height=height,deviceScaleFactor=1,mobile=False)
    js("document.querySelector('#team-openings-heading').scrollIntoView({behavior:'instant',block:'center'})")
    p=js('''(() => {const h=document.querySelector('#team-openings-heading');const s=h.closest('section');const a=s.querySelector('a');const grid=document.querySelector('.grid');return {width:innerWidth,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,gap:h.getBoundingClientRect().top-grid.getBoundingClientRect().bottom,font:parseFloat(getComputedStyle(h).fontSize),sectionHeight:s.getBoundingClientRect().height,text:s.innerText,href:a.href,links:s.querySelectorAll('a').length,rect:a.getBoundingClientRect().toJSON()}})()''')
    print(p)
    assert p['gap']<=80,p
    assert p['font']<=24,p
    assert p['sectionHeight']<=210,p
    assert p['links']==1 and p['href']=='https://os.pl.xyz/jobs',p
    assert p['rect']['x']>=0 and p['rect']['right']<=p['clientWidth'] and p['rect']['bottom']<=height,p
    capture_screenshot(path=str(out/f'compact-{width}.png'))
    results.append(p)
(out/'compact-browser-checks.json').write_text(json.dumps(results,indent=2)+'\n')
