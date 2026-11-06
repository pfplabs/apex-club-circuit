import {formatTime} from './simulation.js';
// The simulation has no engine RPM or opponents. Show a labelled rev estimate
// and real solo lap history rather than inventing a race classification.
export function telemetry(speed,throttle,brake){
 const velocity=Math.abs(speed),gear=speed<-.3?'R':velocity<1?'N':Math.min(7,Math.floor(velocity/11)+1);
 const revs=velocity<1?3:Math.min(15,6+(velocity%11)/11*9);
 return {speed:Math.round(velocity*3.6),mph:Math.round(velocity*2.236936),gear,revs,throttle:Math.max(0,Math.min(1,throttle)),brake:Math.max(0,Math.min(1,brake))};
}
export function createBroadcastHUD(root){
 const overlay=document.createElement('section');overlay.id='broadcast-hud';overlay.className='hidden';overlay.setAttribute('aria-label','Live driving telemetry');
 overlay.innerHTML=`<svg viewBox="0 0 1000 300" role="img" aria-label="Curved cockpit telemetry: speed, gear, pedals and estimated RPM">
 <defs><linearGradient id="hud-glass" x2="0" y2="1"><stop stop-color="#152d3c" stop-opacity=".25"/><stop offset="1" stop-color="#0d1d29" stop-opacity=".85"/></linearGradient><pattern id="hud-segments" width="9" height="40" patternUnits="userSpaceOnUse"><rect width="6" height="40" fill="#60f2c4"/></pattern><pattern id="brake-segments" width="9" height="40" patternUnits="userSpaceOnUse"><rect width="6" height="40" fill="#ff5959"/></pattern></defs>
 <path class="hud-glass" d="M35 252 Q500 -38 965 252 L940 295 Q500 41 60 295Z"/>
 <path class="hud-edge" d="M35 252 Q500 -38 965 252 M60 295 Q500 41 940 295"/>
 <path class="hud-fine" d="M329 139 L338 56 Q500 15 662 56 L671 139 M414 120 L414 40 M586 120 L586 40"/>
 <text id="broadcast-speed" class="hud-speed" x="500" y="75">000</text><text class="hud-label" x="500" y="96">KM/H</text>
 <text id="broadcast-mph" class="hud-minor" x="625" y="82">0</text><text class="hud-label" x="625" y="102">MPH</text>
 <text id="broadcast-turn" class="hud-minor" x="374" y="82">S1</text><text class="hud-label" x="374" y="102">SECTOR</text>
 <rect class="hud-gear-box" x="421" y="122" width="158" height="84" rx="20"/><text id="broadcast-gear" x="500" y="184">N</text>
 <g transform="translate(110 204) rotate(-21)"><text class="hud-label" x="0" y="-8" text-anchor="start">THROTTLE</text><rect class="hud-bar-bg" width="220" height="22"/><rect id="broadcast-throttle" width="0" height="22" fill="url(#hud-segments)"/><text class="hud-label" x="0" y="42" text-anchor="start">BRAKE</text><rect class="hud-bar-bg" y="50" width="220" height="14"/><rect id="broadcast-brake" y="50" width="0" height="14" fill="url(#brake-segments)"/></g>
 <g transform="translate(705 150) rotate(21)"><text class="hud-label" x="0" y="0" text-anchor="start">SOLO SESSION</text><text id="broadcast-lap" class="hud-minor" x="0" y="32" text-anchor="start">LAP 1 / 3</text><text id="broadcast-time" class="hud-minor" x="0" y="64" text-anchor="start">00:00.000</text></g>
 <path class="hud-rev-bg" d="M300 268 Q500 178 700 268" pathLength="100"/><path id="broadcast-revs" d="M300 268 Q500 178 700 268" pathLength="100"/>
 <rect x="408" y="244" width="184" height="54" rx="8" fill="#102532"/><text class="hud-label" x="500" y="264">RPM × 1000 · EST.</text><text id="broadcast-rpm" class="hud-minor" x="500" y="287">3.0</text>
 </svg><small id="broadcast-reverse"></small>`;
 const banner=document.createElement('aside');banner.id='fastest-lap';banner.className='hidden';banner.setAttribute('aria-label','Session fastest lap');banner.innerHTML='<span class="stopwatch">◷</span><b>SESSION BEST</b><span>YOU <small>SOLO SESSION</small></span><strong>--:--.---</strong>';
 const compact=document.createElement('div');compact.id='compact-telemetry';compact.innerHTML='<div><b id="compact-gear">N</b><strong id="compact-speed">000</strong><small>KM/H</small></div><label>THROTTLE<span><i id="compact-throttle"></i></span></label><label>BRAKE<span><i id="compact-brake"></i></span></label>';overlay.append(compact);
 root.append(overlay,banner);
 const el=id=>document.getElementById(id),cache=new Map();let last=-Infinity,lapCount=0,showUntil=0;
 function text(id,value){if(cache.get(id)!==value){el(id).textContent=value;cache.set(id,value);}}
 return {update(race,now){
  const active=race.state!=='ready';overlay.classList.toggle('hidden',!active);root.classList.toggle('broadcast-active',active);root.classList.toggle('hud-modal',['paused','finished','parked'].includes(race.state));root.classList.toggle('hud-service',!document.getElementById('pit-service').classList.contains('hidden'));
  if(race.laps.length<lapCount){lapCount=0;showUntil=0;}
  if(race.laps.length>lapCount){const latest=race.laps.at(-1);if(latest===Math.min(...race.laps)){showUntil=now+7000;banner.querySelector('strong').textContent=formatTime(latest);}lapCount=race.laps.length;}
  banner.classList.toggle('hidden',!active||!showUntil||(now>showUntil&&race.state!=='paused')||!lapCount);
  root.classList.toggle('hud-timing',!banner.classList.contains('hidden'));root.classList.toggle('hud-settings',document.getElementById('render-settings').open);
  if(!active||now-last<50)return;last=now;
  const t=telemetry(race.car.speed,race.pedals.throttle,race.pedals.brake);
  text('broadcast-speed',String(t.speed).padStart(3,'0'));text('broadcast-mph',String(t.mph));text('broadcast-gear',String(t.gear));text('broadcast-rpm',t.revs.toFixed(1));
  text('broadcast-turn',`S${Math.min(3,Math.floor(race.lastIndex/240)+1)}`);text('broadcast-lap',`LAP ${Math.min(3,race.laps.length+1)} / 3`);text('broadcast-time',formatTime(race.lapTime));
  el('broadcast-throttle').setAttribute('width',String(t.throttle*220));el('broadcast-brake').setAttribute('width',String(t.brake*220));el('broadcast-revs').style.strokeDasharray=`${t.revs/15*100} 100`;
  text('broadcast-reverse',el('reverse-help').textContent);text('compact-speed',String(t.speed).padStart(3,'0'));text('compact-gear',String(t.gear));el('compact-throttle').style.transform=`scaleX(${t.throttle})`;el('compact-brake').style.transform=`scaleX(${t.brake})`;
 }};
}
