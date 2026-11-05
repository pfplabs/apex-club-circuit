import * as THREE from 'three';
import {Race,nearest,track,heading,formatTime,angleDiff} from './simulation.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createWorld} from './world.js';
import './style.css';
const $=id=>document.getElementById(id),race=new Race(),input={left:false,right:false,gas:false,brake:false};
const ui={hud:$('hud'),menu:$('menu'),pause:$('pause-menu'),results:$('results'),speed:$('speedometer'),count:$('countdown'),touch:$('touch-controls')};
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.08,1800);let renderer,world,cameraMode=0,best=Infinity,previousState='',loaded=false,engine,audioOn=false;
try{best=Number(localStorage.getItem('f1-3d-best'))||Infinity;}catch{}
$('best').textContent=formatTime(best);$('start').disabled=true;
try{
 renderer=new THREE.WebGLRenderer({canvas:$('scene'),antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.06).texture;pmrem.dispose();
}catch(e){showError('This game needs WebGL 2. Try an up-to-date browser with hardware acceleration enabled.');throw e;}
function showError(message){$('error').textContent=message;$('error').classList.remove('hidden');$('load-status').textContent='RENDERER UNAVAILABLE';}
function setStateUI(){
 const s=race.state,active=s==='racing'||s==='countdown';ui.menu.classList.toggle('hidden',s!=='ready');ui.pause.classList.toggle('hidden',s!=='paused');ui.results.classList.toggle('hidden',s!=='finished'&&s!=='parked');ui.hud.classList.toggle('hidden',s==='ready');ui.speed.classList.toggle('hidden',!active);ui.touch.classList.toggle('hidden',!active);$('pause').disabled=!active;ui.count.classList.toggle('hidden',s!=='countdown');
 if(s==='finished'||s==='parked'){
   $('results').querySelector('.eyebrow').textContent=s==='parked'?'PARKED IN THE GARAGE':'CHEQUERED FLAG';$('results').querySelector('h1').innerHTML=s==='parked'?'Back in<br>the garage.':'Three laps.<br>Your mark.';
   const b=Math.min(...race.laps);if(b<best){best=b;try{localStorage.setItem('f1-3d-best',String(best));}catch{}}
   $('best').textContent=formatTime(best);$('lap-results').innerHTML=race.laps.map((t,i)=>`<div><span>LAP ${String(i+1).padStart(2,'0')}</span><strong>${formatTime(t)}</strong></div>`).join('')+`<div><span>RACE TOTAL</span><strong>${formatTime(race.elapsed)}</strong></div>`;
 }
 previousState=s;
}
function clearInput(){Object.keys(input).forEach(k=>input[k]=false);document.querySelectorAll('[data-control]').forEach(b=>b.classList.remove('pressed'));}
function start(){if(!loaded)return;race.start();setStateUI();clearInput();if(audioOn)engine?.ctx.resume();}
function restart(){race.reset();race.start();clearInput();setStateUI();}
function pause(){race.pause();clearInput();setStateUI();}
$('start').onclick=start;$('resume').onclick=start;$('restart').onclick=restart;$('restart-pause').onclick=restart;$('pause').onclick=pause;
function toggleCamera(){cameraMode=(cameraMode+1)%3;$('camera').querySelector('b').textContent=['CHASE','COCKPIT','ORBIT'][cameraMode];}
$('camera').onclick=toggleCamera;
function toggleAudio(){
 if(!engine){const ctx=new (window.AudioContext||window.webkitAudioContext)(),gain=ctx.createGain(),osc=ctx.createOscillator(),filter=ctx.createBiquadFilter();osc.type='sawtooth';filter.type='lowpass';filter.frequency.value=900;gain.gain.value=0;osc.connect(filter).connect(gain).connect(ctx.destination);osc.start();engine={ctx,gain,osc};}
 audioOn=!audioOn;engine.ctx.resume();$('audio').querySelector('b').textContent=audioOn?'ON':'OFF';
}
$('audio').onclick=toggleAudio;
const keys={ArrowUp:'gas',KeyW:'gas',ArrowDown:'brake',KeyS:'brake',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
window.addEventListener('keydown',e=>{
 if(keys[e.code]){e.preventDefault();input[keys[e.code]]=true;}
 if(e.repeat)return;
 if(e.code==='Enter'&&(race.state==='ready'||race.state==='paused'))start();
 if(e.code==='Escape'||e.code==='Space'){e.preventDefault();if(race.state==='paused')start();else pause();}
 if(e.code==='KeyC')toggleCamera();if(e.code==='KeyR'&&race.state==='racing')race.resetCar();if(e.code==='KeyM')toggleAudio();
});window.addEventListener('keyup',e=>{if(keys[e.code]){e.preventDefault();input[keys[e.code]]=false;}});
window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
for(const b of document.querySelectorAll('[data-control]')){
 const name=b.dataset.control;b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);input[name]=true;b.classList.add('pressed');});
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>{input[name]=false;b.classList.remove('pressed');});
}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
const map=$('map').getContext('2d');function drawMap(){map.clearRect(0,0,260,260);const pt=p=>[130+p.x*.39,132+p.z*.39];map.lineWidth=10;map.lineJoin='round';map.strokeStyle='#06131299';map.beginPath();track.forEach((p,i)=>{const [x,y]=pt(p);i?map.lineTo(x,y):map.moveTo(x,y);});map.closePath();map.stroke();map.lineWidth=3;map.strokeStyle='#eceddf';map.stroke();const gate=track[(race.nextCheckpoint*60)%track.length],[gx,gy]=pt(gate);map.fillStyle='#f2fa3d';map.fillRect(gx-3,gy-3,6,6);const [x,y]=pt(race.car);map.fillStyle='#effc43';map.beginPath();map.arc(x,y,5,0,Math.PI*2);map.fill();}
let last=performance.now(),clock=0,accumulator=0,wheelAngle=0;const look=new THREE.Vector3(),desired=new THREE.Vector3(),forward=new THREE.Vector3(),right=new THREE.Vector3();
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;clock+=dt;if(!world)return;
 accumulator+=dt;while(accumulator>=1/120){race.step(1/120,input);accumulator-=1/120;}
 if(previousState!==race.state)setStateUI();const c=race.car;world.car.position.set(c.x,.035,c.z);world.car.rotation.y=c.yaw+Math.PI;
 wheelAngle+=c.speed*dt/.36;world.wheels.forEach(w=>{w.rotation.x=wheelAngle;if(w.name==='Wheel_FL'||w.name==='Wheel_FR')w.rotation.y=-c.steer*.28;});
 forward.set(Math.sin(c.yaw),0,Math.cos(c.yaw));right.set(Math.cos(c.yaw),0,-Math.sin(c.yaw));
 if(race.state==='ready'){
   const a=c.yaw+Math.PI*.28+Math.sin(clock*.12)*.2;desired.set(c.x+Math.sin(a)*8.4,3.1,c.z+Math.cos(a)*8.4);look.set(c.x+right.x*2.1,1,c.z+right.z*2.1);
 }else if(cameraMode===1){
   desired.set(c.x-forward.x*.48,1.05,c.z-forward.z*.48);look.set(c.x+forward.x*40,.95,c.z+forward.z*40);
 }else if(cameraMode===2){
   desired.set(c.x+Math.sin(clock*.17)*11,5.5,c.z+Math.cos(clock*.17)*11);look.set(c.x,.75,c.z);
 }else{
   desired.set(c.x-forward.x*(7.5+c.speed*.035),3.4+c.speed*.012,c.z-forward.z*(7.5+c.speed*.035));look.set(c.x+forward.x*7,1,c.z+forward.z*7);
 }
 if(cameraMode===1&&race.state!=='ready')camera.position.copy(desired);else camera.position.lerp(desired,1-Math.exp(-dt*6));camera.lookAt(look);camera.fov=58+(race.state==='racing'?c.speed*.15:0);camera.updateProjectionMatrix();
 const gateIndex=(race.nextCheckpoint*60)%track.length,gate=track[gateIndex];world.gate.position.set(gate.x,0,gate.z);world.gate.rotation.y=heading(gateIndex);world.gate.visible=race.state==='racing';
 $('lap').innerHTML=`${String(Math.min(race.laps.length+1,3)).padStart(2,'0')}<span>/ 03</span>`;$('time').textContent=formatTime(race.lapTime);$('speed').textContent=Math.round(c.speed*3.6).toString().padStart(3,'0');$('gear').textContent=c.speed<1?'N':Math.min(7,Math.floor(c.speed/11)+1);$('rpm').firstElementChild.style.width=`${(c.speed%11)/11*100}%`;
 $('status').textContent=race.state==='racing'?(race.inPit?'PIT LANE · PARK IN HIGHLIGHTED GARAGE':race.contact?'BARRIER CONTACT':race.offroad?'OFF TRACK · REDUCED GRIP':`GATE ${String(race.nextCheckpoint).padStart(2,'0')} / 12`):'';ui.count.textContent=Math.ceil(race.countdown)||'GO';
 if(engine){engine.osc.frequency.setTargetAtTime(55+c.speed*5,engine.ctx.currentTime,.08);engine.gain.gain.setTargetAtTime(audioOn&&race.state==='racing'?.026:0,engine.ctx.currentTime,.1);}
 drawMap();renderer.render(scene,camera);
}
requestAnimationFrame(animate);
createWorld(scene,renderer).then(w=>{world=w;loaded=true;camera.position.set(race.car.x-5,3,race.car.z-7);$('load-status').textContent='READY · ALL ASSETS LOCAL';$('length').textContent=(w.trackLength/1000).toFixed(2);$('start').disabled=false;setStateUI();}).catch(e=>{console.error(e);showError('The 3D assets could not load. Serve this project with npm run dev or npm run preview; do not open index.html directly. '+e.message);});
// Read-only diagnostics for QA. Gameplay inputs still go through normal controls.
window.__F1_TEST__={snapshot:()=>({loaded,state:race.state,car:{...race.car},laps:[...race.laps],elapsed:race.elapsed,nextCheckpoint:race.nextCheckpoint,offroad:race.offroad,inPit:race.inPit,meshCount:world?.meshCount,triangles:renderer.info.render.triangles,calls:renderer.info.render.calls,cameraMode}),nearest,track,heading,angleDiff};
