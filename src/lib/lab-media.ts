/** Local draft preview only. Never uploads, touches auth storage, or serializes a Blob. */
export const IMAGE_LIMIT=8*1024*1024, VIDEO_LIMIT=50*1024*1024, TOTAL_LIMIT=50*1024*1024, MEDIA_COUNT_LIMIT=4
export const MEDIA_ACCEPT='image/png,image/jpeg,image/webp,video/mp4,video/webm'
export type LocalMedia={id:string;scope:string;file:File;url:string;kind:'image'|'video'}
export async function validateMedia(file:File):Promise<'image'|'video'> {
  if(!MEDIA_ACCEPT.split(',').includes(file.type))throw Error('Choose PNG, JPEG, WebP, MP4, or WebM. SVG and HTML are not accepted.')
  const kind=file.type.startsWith('image/')?'image':'video'
  if(!file.size||file.size>(kind==='image'?IMAGE_LIMIT:VIDEO_LIMIT))throw Error('File size limit: photos up to 8 MiB, videos up to 50 MiB; empty files are not accepted.')
  const b=new Uint8Array(await file.slice(0,32).arrayBuffer())
  const ascii=(start:number,end:number)=>String.fromCharCode(...b.slice(start,end))
  const valid=file.type==='image/png'?[137,80,78,71,13,10,26,10].every((n,i)=>b[i]===n):file.type==='image/jpeg'?b[0]===255&&b[1]===216&&b[2]===255:file.type==='image/webp'?ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP':file.type==='video/mp4'?ascii(4,8)==='ftyp':[26,69,223,163].every((n,i)=>b[i]===n)
  if(!valid)throw Error('File signature does not match its media type. This file was not previewed.')
  return kind
}
export function createMediaSession(scope:string,urls:Pick<typeof URL,'createObjectURL'|'revokeObjectURL'>=URL) {
  let closed=false,seq=0,items:LocalMedia[]=[]
  return {
    get items(){return [...items]},
    async add(file:File) {
      if(closed)throw Error('This media preview is closed.')
      const kind=await validateMedia(file)
      if(closed)throw Error('This media preview is closed.')
      if(items.length>=MEDIA_COUNT_LIMIT||items.reduce((n,m)=>n+m.file.size,0)+file.size>TOTAL_LIMIT)throw Error('Preview limit: 4 files and 50 MiB total. Remove one before adding more.')
      const item={id:`media-${++seq}`,scope,file,kind,url:urls.createObjectURL(file)};items.push(item);return item
    },
    remove(id:string){const item=items.find(m=>m.id===id);if(item)urls.revokeObjectURL(item.url);items=items.filter(m=>m.id!==id)},
    dispose(){closed=true;items.forEach(m=>urls.revokeObjectURL(m.url));items=[]},
  }
}
