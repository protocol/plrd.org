export function sampleSignal(frequency:number,sampleRate:number,noise:number) {
  if(!Number.isFinite(sampleRate)||sampleRate<4||sampleRate>240) throw Error('Sample rate must be between 4 and 240 Hz')
  if(!Number.isFinite(frequency)||frequency<1||frequency>20||!Number.isFinite(noise)||noise<0||noise>1) throw Error('Invalid signal parameters')
  return Array.from({length:Math.floor(sampleRate)+1},(_,i)=>{const t=i/sampleRate;return {time:t,value:Math.sin(2*Math.PI*frequency*t)+noise*Math.sin(i*127.1+3.7)*Math.cos(i*31.3)}})
}
