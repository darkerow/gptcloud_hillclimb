/** Procedural sounds only; no third-party recordings. Starts after a user gesture. */
export class GameAudio {
  constructor(settings){this.settings=settings;this.context=null;this.timer=0;this.note=0;}
  unlock(){
    if(!this.settings.sound&&!this.settings.music)return;
    try{
      if(!this.context){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;this.context=new A();
        this.engine=this.context.createOscillator();this.engine.type='triangle';this.gain=this.context.createGain();
        this.gain.gain.value=0;this.engine.connect(this.gain);this.gain.connect(this.context.destination);this.engine.start();}
      this.context.resume().catch(()=>{});
    }catch{this.context=null;}
  }
  tone(freq,duration=0.09,volume=0.04){
    if(!this.context||!this.settings.sound)return;
    try{const o=this.context.createOscillator(),g=this.context.createGain(),t=this.context.currentTime;
      o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(0.0001,t+duration);
      o.connect(g);g.connect(this.context.destination);o.start();o.stop(t+duration);o.onended=()=>{o.disconnect();g.disconnect();};}catch{}
  }
  update(speed,throttle,running,delta){
    if(!this.context)return;const t=this.context.currentTime;
    this.engine.frequency.setTargetAtTime(38+Math.min(Math.abs(speed),25)*9+Math.abs(throttle)*22,t,0.1);
    this.gain.gain.setTargetAtTime(running&&this.settings.sound?0.012+Math.abs(throttle)*0.018:0,t,0.05);
    if(this.settings.music&&running){this.timer+=delta;if(this.timer>360){this.timer=0;const notes=[220,277,330,277,196,247,294,247];
      // Music remains independent of the effects toggle.
      const enabled=this.settings.sound;this.settings.sound=true;this.tone(notes[this.note++%8],0.22,0.012);this.settings.sound=enabled;}}
  }
  stop(){if(this.context)this.gain.gain.setTargetAtTime(0,this.context.currentTime,0.02);}
  destroy(){this.engine?.stop();this.context?.close().catch(()=>{});}
}
