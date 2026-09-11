'use client'
import {useEffect,useRef,useState} from 'react'
import {MEDIA_ACCEPT} from '@/lib/lab-media'
import {storeInventionMedia,validInventionMedia,type InventionMedia} from '@/lib/lab-invention-media'
import styles from '@/components/lab/feed/feed.module.css'

export function InventionMediaPreview({items}:{items:InventionMedia[]}) {
 const [error,setError]=useState('')
 return <>{items.map(m=><figure key={m.id}>{m.kind==='image'?<img src={m.dataUrl} alt={m.alt} onError={()=>setError(`${m.name} could not be decoded. Keep the original or choose another file.`)}/>:<video src={m.dataUrl} controls preload="metadata" aria-label={m.alt||m.name} onError={()=>setError(`${m.name} could not be played in this browser. Keep the original or choose another format.`)}/>}<figcaption>{m.caption}</figcaption><a href={m.dataUrl} download={m.name}>Download {m.name}</a></figure>)}{error&&<p role="alert">{error}</p>}</>
}
export default function InventionMediaEditor({items,onChange,onBusy,disabled}:{items:InventionMedia[];onChange:(items:InventionMedia[])=>void;onBusy:(busy:boolean)=>void;disabled:boolean}) {
 const active=useRef(true),pending=useRef(false),latest=useRef({items,onChange,onBusy})
 latest.current={items,onChange,onBusy}
 const [busy,setBusy]=useState(false),[error,setError]=useState('')
 useEffect(()=>{active.current=true;return()=>{active.current=false}},[])
 return <section className={styles.media}><h3>Photos &amp; video</h3><p className={styles.meta}>Saved only in this browser with this build, not uploaded or synced. Up to 4 PNG/JPEG/WebP or MP4/WebM files, 2 MiB total per build; browser quota may be smaller. Larger originals are not stored here. Keep backups. No autoplay.</p>
 <label>Photos or video<input aria-label="Photos or video" type="file" accept={MEDIA_ACCEPT} multiple disabled={disabled||busy} onChange={async e=>{
  const files=Array.from(e.target.files||[]);e.target.value='';if(pending.current||disabled)return
  pending.current=true;setBusy(true);latest.current.onBusy(true);setError('')
  try {
   const additions:InventionMedia[]=[]
   for(const f of files){additions.push(await storeInventionMedia(f));if(!active.current)return}
   if(!active.current)return
   const next=[...latest.current.items,...additions]
   if(!validInventionMedia(next))throw Error('Local attachment limit: 4 files, 2 MiB total. Remove a file first.')
   latest.current.onChange(next)
  } catch(e){if(active.current)setError(e instanceof Error?e.message:'Attachment could not be saved.')}
  finally {if(active.current){pending.current=false;setBusy(false);latest.current.onBusy(false)}}
 }}/></label>{busy&&<p role="status">Reading local files; wait before saving or closing…</p>}
 <InventionMediaPreview items={items}/>
 {items.map(m=><fieldset key={m.id} disabled={disabled||busy}><legend>{m.name}</legend><label>{m.kind==='image'?'Alt text':'Video description'}<input aria-label={`Alt text for ${m.name}`} maxLength={500} value={m.alt} onChange={e=>onChange(items.map(i=>i.id===m.id?{...i,alt:e.target.value}:i))}/></label><label>Caption<input aria-label={`Caption for ${m.name}`} maxLength={500} value={m.caption} onChange={e=>onChange(items.map(i=>i.id===m.id?{...i,caption:e.target.value}:i))}/></label><button type="button" aria-label={`Remove ${m.name}`} onClick={()=>onChange(items.filter(i=>i.id!==m.id))}>Remove</button></fieldset>)}{error&&<p role="alert">{error}</p>}</section>
}
