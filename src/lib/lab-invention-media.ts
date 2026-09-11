import {MEDIA_ACCEPT, validateMedia} from '@/lib/lab-media'

// Small, local-only attachments live atomically with text/captions. No upload or
// object-URL persistence; larger originals stay with the maker until a blob store exists.
export const INVENTION_MEDIA_LIMIT = 2 * 1024 * 1024
export type InventionMedia = {id:string; name:string; type:string; size:number; kind:'image'|'video'; dataUrl:string; alt:string; caption:string}
const safeText = (v:unknown, max:number) => typeof v==='string' && v.length<=max && !/[\u0000-\u001f\u007f]/.test(v)
export function validInventionMedia(items:unknown): items is InventionMedia[] {
  if(!Array.isArray(items)||items.length>4)return false
  let total=0
  return items.every(m=>{
    if(!m || !safeText(m.id,100) || !m.id || !safeText(m.name,255) || !m.name || !safeText(m.alt,500) || !safeText(m.caption,500) ||
      !MEDIA_ACCEPT.split(',').includes(m.type) || m.kind!==(m.type.startsWith('image/')?'image':'video') ||
      !Number.isInteger(m.size) || m.size<=0 || (total+=m.size)>INVENTION_MEDIA_LIMIT || typeof m.dataUrl!=='string')return false
    const prefix=`data:${m.type};base64,`, encoded=m.dataUrl.slice(prefix.length)
    if(!m.dataUrl.startsWith(prefix)||encoded.length!==4*Math.ceil(m.size/3)||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded))return false
    try {
      const bytes=atob(encoded)
      if(bytes.length!==m.size)return false
      const b=(i:number)=>bytes.charCodeAt(i)
      return m.type==='image/png'?[137,80,78,71,13,10,26,10].every((n,i)=>b(i)===n):m.type==='image/jpeg'?b(0)===255&&b(1)===216&&b(2)===255:m.type==='image/webp'?bytes.slice(0,4)==='RIFF'&&bytes.slice(8,12)==='WEBP':m.type==='video/mp4'?bytes.slice(4,8)==='ftyp':[26,69,223,163].every((n,i)=>b(i)===n)
    } catch {return false}
  }) && new Set(items.map(m=>m.id)).size===items.length
}
export async function storeInventionMedia(file:File):Promise<InventionMedia> {
  if(file.size>INVENTION_MEDIA_LIMIT)throw Error('Local build attachments are limited to 2 MiB total. Keep larger originals; no upload was attempted.')
  const kind=await validateMedia(file), bytes=new Uint8Array(await file.arrayBuffer())
  let binary=''
  for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192))
  const item:InventionMedia={id:crypto.randomUUID(),name:file.name,type:file.type,size:file.size,kind,dataUrl:`data:${file.type};base64,${btoa(binary)}`,alt:'',caption:''}
  if(!validInventionMedia([item]))throw Error('Invalid local attachment.')
  return item
}
