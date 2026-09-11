'use client'
import {useCallback,useEffect,useState} from 'react'
import {useLabFollowing} from '@/components/lab/social/useLabFollowing'
import {loadBench,changeBench,type BenchAction,type InventionBench} from '@/lib/lab-inventions'
const CHANGED='open-lab:invention-bench-changed'
export function useInventionBench(){
 const {owner,mode,scope,ready}=useLabFollowing()
 const [loaded,setLoaded]=useState<{scope:string;state:InventionBench;error:string}|null>(null),[error,setError]=useState('')
 const refresh=useCallback(()=>{try{setLoaded({scope,...loadBench(window.localStorage,owner,mode)})}catch{setError('Browser storage is unavailable. Bench changes cannot be saved.')}},[owner,mode,scope])
 useEffect(()=>{setError('');refresh();window.addEventListener(CHANGED,refresh);window.addEventListener('storage',refresh);return()=>{window.removeEventListener(CHANGED,refresh);window.removeEventListener('storage',refresh)}},[refresh])
 const current=loaded?.scope===scope?loaded:null
 function act(action:BenchAction){
  if(!ready||!current)return {ok:false,error:'Wait for this identity’s bench to load.'}
  let result;try{result=changeBench(window.localStorage,owner,mode,action)}catch{result={ok:false,error:'Browser storage is unavailable. Not saved.'}}
  setError(result.error||'');if(result.ok){refresh();window.dispatchEvent(new Event(CHANGED))}return result
 }
 return {owner,mode,scope,ready:ready&&!!current,state:current?.state,error:error||current?.error||'',act}
}
