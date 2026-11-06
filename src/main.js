import {interpolateCar} from './render-motion.js';
import {createRenderQuality,createFrameMetrics,settingsOwnKeyboard} from './render-quality.js';
import {pitCamera} from './camera-presentation.js';
import {roadSurface} from './course.js';
import * as THREE from 'three';
import {prepareRenderer} from './render-preparation.js';
import {vehicleGroundPose} from './vehicle-ground.js';
import {serviceBox,pitServiceView} from './pit-service.js';
import {pitGuidance} from './pit-guidance.js';
import {createTyreServiceRig,updateTyreServiceRig} from './tyre-visuals.js';
import {updateServiceTools} from './service-tools.js';
import {updateWheelRig,wheelSpinDelta} from './vehicle-visuals.js';
import {Race,nearest,track,heading,formatTime,angleDiff} from './simulation.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {updateRacingGuide} from './racing-guide.js';
import {createWorld} from './world.js';
import './style.css';
const $=id=>document.getElementById(id),race=new Race(),input={left:false,right:false,gas:false,brake:false};
// Local visual QA starts at the service box; production builds remove this branch.
if(import.meta.env.DEV&&new URLSearchParams(location.search).get('qa')==='pit'){Object.assign(race.car,serviceBox());race.state='racing';race.pitService.phase='offered';race.pitService.settled=.4;}
// Development-only repeatable hill views and DOM-readable performance evidence.
const roadQA=import.meta.env.DEV&&new URLSearchParams(location.search).get('qa')==='road';
if(roadQA){const i=Math.max(0,Math.min(track.length-1,Number(new URLSearchParams(location.search).get('at'))||100));Object.assign(race.car,track[i],{yaw:heading(i)});race.state='racing';}
let qaReadout;if(roadQA){qaReadout=document.createElement('output');qaReadout.id='road-qa';qaReadout.style.cssText='position:fixed;bottom:30px;left:20px;z-index:100;color:white;background:#142021;padding:8px;font:12px monospace';document.body.append(qaReadout);}
const ui={hud:$('hud'),menu:$('menu'),pause:$('pause-menu'),results:$('results'),speed:$('speedometer'),count:$('countdown'),touch:$('touch-controls')};
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.08,1800);let renderer,renderQuality,frameMetrics,world,cameraMode=0,best=Infinity,previousState='',loaded=false,engine,audioOn=false,guideEnabled=true,tyreRig,previousPitPhase='idle';
try{best=Number(localStorage.getItem('f1-3d-best-course-v5'))||Infinity;}catch{}
$('best').textContent=formatTime(best);$('start').disabled=true;
const startup={startedAt:performance.now()},frameStats={frames:0,totalMs:0,worstMs:0,over50ms:0};
function loadStage(text,progress){$('load-status').textContent=text;$('load-progress').firstElementChild.style.width=`${Math.round(progress*100)}%`;$('start').textContent=progress<1?'PREPARING CIRCUIT…':'TAKE THE WHEEL ↗';}
loadStage('LOADING MODELS & MATERIALS',0);
try{
 renderer=new THREE.WebGLRenderer({canvas:$('scene'),antialias:true,powerPreference:'high-performance'});renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.06).texture;pmrem.dispose();
}catch(e){showError('This game needs WebGL 2. Try an up-to-date browser with hardware acceleration enabled.');throw e;}
frameMetrics=createFrameMetrics(renderer);
function resetMetrics(){frameMetrics.reset();frameStats.frames=0;frameStats.totalMs=0;frameStats.worstMs=0;frameStats.over50ms=0;}
renderQuality=createRenderQuality({renderer,scene,onChange:resetMetrics});
$('render-preset').onchange=e=>{clearInput();renderQuality.setPreset(e.target.value);};
$('surface-textures').onchange=e=>{clearInput();renderQuality.setTextures(e.target.checked);};
$('render-settings').addEventListener('focusin',clearInput);
function showError(message){$('error').textContent=message;$('error').classList.remove('hidden');$('load-status').textContent='RENDERER UNAVAILABLE';}
function setStateUI(){
 const s=race.state,active=s==='racing'||s==='countdown';ui.menu.classList.toggle('hidden',s!=='ready');ui.pause.classList.toggle('hidden',s!=='paused');ui.results.classList.toggle('hidden',s!=='finished'&&s!=='parked');ui.hud.classList.toggle('hidden',s==='ready');ui.speed.classList.toggle('hidden',!active);ui.touch.classList.toggle('hidden',!active);$('pause').disabled=!active;ui.count.classList.toggle('hidden',s!=='countdown');
 if(s==='finished'||s==='parked'){
   $('results').querySelector('.eyebrow').textContent=s==='parked'?'PARKED IN THE GARAGE':'CHEQUERED FLAG';$('results').querySelector('h1').innerHTML=s==='parked'?'Back in<br>the garage.':'Three laps.<br>Your mark.';
   const b=Math.min(...race.laps);if(b<best){best=b;try{localStorage.setItem('f1-3d-best-course-v5',String(best));}catch{}}
   $('best').textContent=formatTime(best);$('lap-results').innerHTML=race.laps.map((t,i)=>`<div><span>LAP ${String(i+1).padStart(2,'0')}</span><strong>${formatTime(t)}</strong></div>`).join('')+`<div><span>RACE TOTAL</span><strong>${formatTime(race.elapsed)}</strong></div>`;
 }
 previousState=s;
}
function clearInput(){Object.keys(input).forEach(k=>input[k]=false);document.querySelectorAll('[data-control]').forEach(b=>b.classList.remove('pressed'));}
function start(){if(!loaded)return;race.start();resetMetrics();setStateUI();clearInput();if(audioOn)engine?.ctx.resume();}
function restart(){race.reset();race.start();clearInput();setStateUI();}
function pause(){race.pause();clearInput();setStateUI();}
$('start').onclick=start;$('resume').onclick=start;$('restart').onclick=restart;$('restart-pause').onclick=restart;$('pause').onclick=pause;
function toggleCamera(){cameraMode=(cameraMode+1)%3;$('camera').querySelector('b').textContent=['CHASE','COCKPIT','ORBIT'][cameraMode];}
$('camera').onclick=toggleCamera;
for(const button of document.querySelectorAll('[data-pit-choice]'))button.onclick=()=>{if(race.choosePitService(button.dataset.pitChoice))clearInput();};
function toggleGuide(){guideEnabled=!guideEnabled;$('guide').querySelector('b').textContent=guideEnabled?'ON':'OFF';$('guide').setAttribute('aria-pressed',String(guideEnabled));}
$('guide').onclick=toggleGuide;
function toggleAudio(){
 if(!engine){const ctx=new (window.AudioContext||window.webkitAudioContext)(),gain=ctx.createGain(),osc=ctx.createOscillator(),filter=ctx.createBiquadFilter();osc.type='sawtooth';filter.type='lowpass';filter.frequency.value=900;gain.gain.value=0;osc.connect(filter).connect(gain).connect(ctx.destination);osc.start();engine={ctx,gain,osc};}
 audioOn=!audioOn;engine.ctx.resume();$('audio').querySelector('b').textContent=audioOn?'ON':'OFF';
}
$('audio').onclick=toggleAudio;
const keys={ArrowUp:'gas',KeyW:'gas',ArrowDown:'brake',KeyS:'brake',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
window.addEventListener('keydown',e=>{
 if(settingsOwnKeyboard(e.target))return;
 if(keys[e.code]){e.preventDefault();input[keys[e.code]]=true;}
 if(e.repeat)return;
 if(e.code==='Enter'&&(race.state==='ready'||race.state==='paused'))start();
 if(e.code==='Escape'||e.code==='Space'&&!e.target.closest('button,input,select')){e.preventDefault();if(race.state==='paused')start();else pause();}
 if(e.code==='KeyL')toggleGuide();if(e.code==='KeyC')toggleCamera();if(e.code==='KeyR'&&race.state==='racing'){race.resetCar();clearInput();}if(e.code==='KeyM')toggleAudio();
});window.addEventListener('keyup',e=>{if(keys[e.code]){e.preventDefault();input[keys[e.code]]=false;}});
window.addEventListener('blur',()=>{pause();resetMetrics();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
for(const b of document.querySelectorAll('[data-control]')){
 const name=b.dataset.control;b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);input[name]=true;b.classList.add('pressed');});
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>{input[name]=false;b.classList.remove('pressed');});
}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderQuality.resize();renderer.setSize(innerWidth,innerHeight);resetMetrics();});
const map=$('map').getContext('2d'),mapBounds={minX:Math.min(...track.map(p=>p.x)),maxX:Math.max(...track.map(p=>p.x)),minZ:Math.min(...track.map(p=>p.z)),maxZ:Math.max(...track.map(p=>p.z))},mapScale=228/Math.max(mapBounds.maxX-mapBounds.minX,mapBounds.maxZ-mapBounds.minZ);function drawMap(){map.clearRect(0,0,260,260);const pt=p=>[130+(p.x-(mapBounds.minX+mapBounds.maxX)/2)*mapScale,130+(p.z-(mapBounds.minZ+mapBounds.maxZ)/2)*mapScale];map.lineWidth=10;map.lineJoin='round';map.strokeStyle='#06131299';map.beginPath();track.forEach((p,i)=>{const [x,y]=pt(p);i?map.lineTo(x,y):map.moveTo(x,y);});map.closePath();map.stroke();map.lineWidth=3;map.strokeStyle='#eceddf';map.stroke();const gate=track[(race.nextCheckpoint*60)%track.length],[gx,gy]=pt(gate);map.fillStyle='#f2fa3d';map.fillRect(gx-3,gy-3,6,6);const [x,y]=pt(race.car);map.fillStyle='#effc43';map.beginPath();map.arc(x,y,5,0,Math.PI*2);map.fill();}
let previousCar={...race.car};
let last=performance.now(),clock=0,accumulator=0,wheelAngle=0;const look=new THREE.Vector3(),desired=new THREE.Vector3(),forward=new THREE.Vector3(),right=new THREE.Vector3();
function animate(now){requestAnimationFrame(animate);const frameMs=now-last,dt=Math.min(frameMs/1000,.05);last=now;if(loaded&&race.state==='racing'){frameStats.frames++;frameStats.totalMs+=frameMs;frameStats.worstMs=Math.max(frameStats.worstMs,frameMs);if(frameMs>50)frameStats.over50ms++;}clock+=dt;if(!world)return;const metricDelta=frameMetrics.begin(now);
 if(roadQA&&new URLSearchParams(location.search).has('drive')){const c=race.car,i=nearest(c.x,c.z).index,target=track[(i+5)%track.length],error=Math.atan2(Math.sin(Math.atan2(target.x-c.x,target.z-c.z)-c.yaw),Math.cos(Math.atan2(target.x-c.x,target.z-c.z)-c.yaw));input.gas=race.elapsed<18&&c.speed<40;input.brake=race.elapsed>=18||c.speed>41;input.steer=Math.max(-1,Math.min(1,-error*3));}
 accumulator+=dt;while(accumulator>=1/120){previousCar={...race.car};race.step(1/120,input);accumulator-=1/120;}
 if(previousState!==race.state)setStateUI();const c=race.state==='racing'?interpolateCar(previousCar,race.car,accumulator*120):race.car;world.car.position.set(c.x,.035,c.z);world.car.rotation.y=c.yaw+Math.PI;world.sun.position.set(c.x+150,260,c.z+190);world.sun.target.position.set(c.x,roadSurface(c.x,c.z).height,c.z);world.sun.target.updateMatrixWorld();
 if(race.state==='racing')wheelAngle+=wheelSpinDelta(c.speed,dt);updateWheelRig(world.wheelRig,wheelAngle,c.steer);
 const serviceVisual=updateTyreServiceRig(tyreRig,race.pitService);const groundPose=vehicleGroundPose(c);world.car.position.y=groundPose.height+serviceVisual.jackHeight;world.car.rotation.set(groundPose.pitch,c.yaw+Math.PI,groundPose.roll,'YXZ');updateServiceTools(world.serviceTools,c,serviceVisual);
 if(previousPitPhase==='changing'&&race.pitService.phase==='released')clearInput();previousPitPhase=race.pitService.phase;
 const pitView=pitServiceView(race.pitService,c,{raceState:race.state});$('pit-service').classList.toggle('hidden',!pitView.visible);$('pit-choices').classList.toggle('hidden',!pitView.showChoices);for(const button of document.querySelectorAll('[data-pit-choice]'))button.disabled=!pitView.canChoose;
 const guidance=pitGuidance(race.pitService,c);
 $('pit-instruction').textContent=pitView.active?pitView.phaseLabel:guidance.message;$('pit-detail').textContent=guidance.detail;
 $('pit-service').style.setProperty('--pit-color',guidance.color);for(const item of document.querySelectorAll('[data-pit-step]')){const step=Number(item.dataset.pitStep);item.classList.toggle('current',step===guidance.step);item.classList.toggle('complete',step<guidance.step);if(step===guidance.step)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');}
 world.pitApproach.update(race);
 $('pit-progress').classList.toggle('hidden',!pitView.active);$('pit-progress').firstElementChild.style.width=`${pitView.progress*100}%`;
 $('tyre-compound').textContent=pitView.compound;$('tyre-compound').style.color=pitView.color;$('tyre-wear').textContent=`WEAR ${Math.round(pitView.wear*100)}%`;
 forward.set(Math.sin(c.yaw),0,Math.cos(c.yaw));right.set(Math.cos(c.yaw),0,-Math.sin(c.yaw));
 const presentation=pitCamera(race.state==='parked'?'parked':race.pitService.phase,c);
 document.body.classList.toggle('pit-presentation',!!presentation);
 $('camera').querySelector('b').textContent=presentation?.label??['CHASE','COCKPIT','ORBIT'][cameraMode];
 if(presentation){desired.set(presentation.position.x,presentation.position.y,presentation.position.z);look.set(presentation.target.x,presentation.target.y,presentation.target.z);
 }else if(race.state==='ready'){
   const a=c.yaw+Math.PI*.28+Math.sin(clock*.12)*.2;desired.set(c.x+Math.sin(a)*8.4,3.1,c.z+Math.cos(a)*8.4);look.set(c.x+right.x*2.1,1,c.z+right.z*2.1);
 }else if(cameraMode===1){
   desired.set(c.x-forward.x*.48,1.05,c.z-forward.z*.48);look.set(c.x+forward.x*40,.95,c.z+forward.z*40);
 }else if(cameraMode===2){
   desired.set(c.x+Math.sin(clock*.17)*11,5.5,c.z+Math.cos(clock*.17)*11);look.set(c.x,.75,c.z);
 }else{
   desired.set(c.x-forward.x*(7.5+c.speed*.035),3.4+c.speed*.012,c.z-forward.z*(7.5+c.speed*.035));look.set(c.x+forward.x*7,1,c.z+forward.z*7);
 }
 if(!presentation){desired.y+=groundPose.height;look.y+=groundPose.height;if(cameraMode===1)look.y+=Math.tan(groundPose.pitch)*40;}
 if(cameraMode===1&&!presentation&&race.state!=='ready')camera.position.copy(desired);else camera.position.lerp(desired,1-Math.exp(-dt*6));camera.lookAt(look);camera.fov=58+(race.state==='racing'?Math.abs(c.speed)*.15:0);camera.updateProjectionMatrix();
 const gateIndex=(race.nextCheckpoint*60)%track.length,gate=track[gateIndex];world.gate.position.set(gate.x,gate.y,gate.z);world.gate.rotation.y=heading(gateIndex);world.gate.visible=race.state==='racing';
 $('lap').innerHTML=`${String(Math.min(race.laps.length+1,3)).padStart(2,'0')}<span>/ 03</span>`;$('time').textContent=formatTime(race.lapTime);$('speed').textContent=Math.round(Math.abs(c.speed)*3.6).toString().padStart(3,'0');$('gear').textContent=c.speed<-.3?'R':c.speed<1?'N':Math.min(7,Math.floor(c.speed/11)+1);$('rpm').firstElementChild.style.width=`${(Math.abs(c.speed)%11)/11*100}%`;
 $('throttle-input').style.transform=`scaleX(${race.pedals.throttle})`;$('brake-input').style.transform=`scaleX(${race.pedals.brake})`;
 $('reverse-help').textContent=c.speed<-.01?'REVERSE':c.speed===0?(race.pedals.reverseReady?'S TO REVERSE':input.brake?'RELEASE BRAKE TO ARM REVERSE':'HOLD STILL TO ARM REVERSE'):'';
 $('status').textContent=race.state==='racing'?(race.inPit?'PIT LANE · 60 KM/H · FOLLOW SERVICE GUIDE':race.contact?'BARRIER CONTACT':race.offroad?'OFF TRACK · REDUCED GRIP':`GATE ${String(race.nextCheckpoint).padStart(2,'0')} / 12`):'';ui.count.textContent=Math.ceil(race.countdown)||'GO';
 if(engine){engine.osc.frequency.setTargetAtTime(55+Math.abs(c.speed)*5,engine.ctx.currentTime,.08);engine.gain.gain.setTargetAtTime(audioOn&&race.state==='racing'?.026:0,engine.ctx.currentTime,.1);}
 const cue=updateRacingGuide(world.guide,race,clock,guideEnabled),braking=$('brake-cue');braking.classList.toggle('hidden',!cue.active);braking.style.setProperty('--urgency',String(cue.intensity));
 if(cue.active){$('brake-target').textContent=`SLOW TO ${Math.round((cue.corner?.targetSpeed??cue.recommendedSpeed)*3.6)} KM/H`;$('brake-distance').textContent=cue.corner&&cue.corner.distance>8?`${Math.round(cue.corner.distance)} M TO CORNER`:'EASE OFF / BRAKE';}
 world.safety.update(camera.position);world.spectators.update(camera.position);world.woodland.updateFoliage(camera.position);world.brakingDetails.updateTyreBarriers(camera.position);drawMap();renderer.render(scene,camera);frameMetrics.end(metricDelta);
 if(qaReadout&&frameStats.frames%60===0)qaReadout.textContent=JSON.stringify({frames:frameStats.frames,fps:Math.round(frameStats.frames*1000/Math.max(1,frameStats.totalMs)),worstMs:Math.round(frameStats.worstMs),over50ms:frameStats.over50ms,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles});
}
requestAnimationFrame(animate);
createWorld(scene,renderer,{onProgress:p=>loadStage(`${p.stage} · ${p.done} / ${p.total}`,p.done/p.total*.65)}).then(async w=>{
 startup.assetsMs=Math.round(performance.now()-startup.startedAt);tyreRig=createTyreServiceRig(w.wheelRig);renderQuality.register(scene);camera.position.set(race.car.x-5,3,race.car.z-7);camera.lookAt(race.car.x,1,race.car.z);w.car.position.set(race.car.x,.035,race.car.z);w.car.rotation.y=race.car.yaw+Math.PI;
 const preview={active:true,jackHeight:.12,wheelOut:.4,toolSpin:2};updateServiceTools(w.serviceTools,race.car,preview);
 w.woodland.updateFoliage(camera.position);w.brakingDetails.updateTyreBarriers(camera.position);w.serviceTools.group.position.y=-50;
 startup.gpu=await prepareRenderer(renderer,scene,camera,{onStage:loadStage,warmGroups:[w.serviceTools.group,w.guide.group,w.gate,w.woodland,w.brakingDetails.tyreLOD]});w.serviceTools.group.visible=false;
 renderQuality.register(scene);resetMetrics();world=w;loaded=true;$('render-preset').disabled=false;$('surface-textures').disabled=false;startup.totalMs=Math.round(performance.now()-startup.startedAt);loadStage('READY · ASSETS & GPU PREPARED',1);$('load-progress').classList.add('hidden');$('length').textContent=(w.trackLength/1000).toFixed(2);$('start').disabled=false;setStateUI();
}).catch(e=>{console.error(e);showError('The 3D assets or renderer could not initialize. Serve this project with npm run dev or npm run preview, then try an up-to-date WebGL browser. '+e.message);});
// Read-only diagnostics for QA. Gameplay inputs still go through normal controls.
window.__F1_TEST__={snapshot:()=>({loaded,state:race.state,car:{...race.car},laps:[...race.laps],elapsed:race.elapsed,nextCheckpoint:race.nextCheckpoint,offroad:race.offroad,inPit:race.inPit,meshCount:world?.meshCount,triangles:renderer.info.render.triangles,calls:renderer.info.render.calls,cameraMode,guideEnabled,pitService:{...race.pitService},startup:{...startup},frameStats:{...frameStats},quality:renderQuality.settings(),frameMetrics:frameMetrics.snapshot(),spectators:world?.spectators.group.userData,foliage:world?.woodland.userData.lodStats,barriers:world?.brakingDetails.tyreLOD.userData.lodStats}),nearest,track,heading,angleDiff};
