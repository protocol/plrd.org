'use client'
import {useEffect,useRef,useState} from 'react'
import {createMediaSession,MEDIA_ACCEPT,type LocalMedia} from '@/lib/lab-media'
import styles from '@/components/lab/feed/feed.module.css'
export default function MediaPicker({scope}:{scope:string}){return <Picker key={scope} scope={scope}/>}
function Picker({scope}:{scope:string}){
 const manager=useRef<ReturnType<typeof createMediaSession>|null>(null)
 const [items,setItems]=useState<LocalMedia[]>([]),[meta,setMeta]=useState<Record<string,{alt:string;caption:string}>>({}),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 useEffect(()=>{const session=createMediaSession(scope);manager.current=session;return()=>{session.dispose();manager.current=null}},[scope])
 function downloadCaptions(){const blob=new Blob([JSON.stringify({scope,localPreviewOnly:true,media:items.map(i=>({file:i.file.name,type:i.file.type,...meta[i.id]}))},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='local-media-captions.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 return <section className={styles.media}><h3>Photos &amp; video</h3><p className={styles.meta}>Local preview only, not saved or uploaded. Closing this composer or reloading removes previews. Keep your original files and download captions before leaving. Public media upload is not implemented here.</p>
 <label>Photos or video<input aria-label="Photos or video" type="file" accept={MEDIA_ACCEPT} multiple disabled={busy} onChange={async e=>{const files=Array.from(e.target.files||[]),session=manager.current;e.target.value='';if(!session)return;setError('');setBusy(true);try{for(const file of files)await session.add(file)}catch(err){if(manager.current===session)setError(err instanceof Error?err.message:'Could not preview media.')}finally{if(manager.current===session){setItems(session.items);setBusy(false)}}}}/></label><p className={styles.meta}>PNG/JPEG/WebP ≤8 MiB; MP4/WebM ≤50 MiB. Up to 4 files, 50 MiB total. No autoplay.</p>
 {items.map(item=>{const m=meta[item.id]||{alt:'',caption:''};return <figure key={item.id}>
 {item.kind==='image'?<img src={item.url} alt={m.alt} onError={()=>setError(`${item.file.name} could not be decoded. Remove it or choose another file.`)}/>:<video src={item.url} controls preload="metadata" aria-label={m.alt||item.file.name} onError={()=>setError(`${item.file.name} could not be played in this browser. Keep the original or choose another format.`)}/>}
 <label>{item.kind==='image'?'Alt text':'Video description'}<input aria-label={`Alt text for ${item.file.name}`} maxLength={500} value={m.alt} onChange={e=>setMeta({...meta,[item.id]:{...m,alt:e.target.value}})}/></label><label>Caption<input aria-label={`Caption for ${item.file.name}`} maxLength={500} value={m.caption} onChange={e=>setMeta({...meta,[item.id]:{...m,caption:e.target.value}})}/></label><figcaption>{m.caption}</figcaption><div className={styles.actions}><a href={item.url} download={item.file.name}>Download original</a><button type="button" aria-label={`Remove ${item.file.name}`} onClick={()=>{manager.current?.remove(item.id);setItems(manager.current?.items||[])}}>Remove</button></div></figure>})}
 {items.length>0&&<button type="button" onClick={downloadCaptions}>Download captions</button>}{error&&<p role="alert">{error}</p>}
 </section>
}
