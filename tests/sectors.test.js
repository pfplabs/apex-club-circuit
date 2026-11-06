import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Race,track} from '../src/simulation.js';
import {sectorStatus,drawSectorMap,SECTOR_COLORS} from '../src/sectors.js';
function lap(r,times){for(let i=1;i<=720;i++){r.lapTime+=times[Math.min(2,Math.floor((i-1)/240))]/240;r.recordProgress({index:i%720,distance:0});}}
test('F1 convention uses overall best before personal best, not previous lap',()=>{
 assert.equal(sectorStatus(7,8,10),'purple');assert.equal(sectorStatus(9,8,10),'green');
 assert.equal(sectorStatus(11,8,10),'yellow');assert.equal(sectorStatus(8,8,8),'yellow');
 assert.equal(sectorStatus(9,null,null),'neutral');assert.equal(sectorStatus(9,null,10),'green');
});
test('three sectors sum to lap, rollover preserves display and compares session best',()=>{
 const r=new Race();r.state='racing';lap(r,[10,11,12]);
 assert.deepEqual(r.sectors.statuses,['neutral','neutral','neutral']);
 assert(Math.abs(r.sectors.previous.reduce((a,b)=>a+b,0)-r.laps[0])<1e-8);
 lap(r,[9,11,13]);assert.deepEqual(r.sectors.statuses,['purple','yellow','yellow']);
 assert.equal(r.sectors.next,0);assert.equal(r.lapTime,0);assert(r.sectors.display.every(Number.isFinite));
 r.reset();assert.deepEqual(r.sectors.previous,[null,null,null]);
});
test('invalid laps and recovery cannot pollute previous or best sector baselines',()=>{
 const r=new Race();r.state='racing';lap(r,[10,10,10]);const previous=[...r.sectors.previous];
 r.resetCar();lap(r,[8,8,8]);assert.deepEqual(r.sectors.previous,previous);assert.deepEqual(r.sectors.best,previous);assert.deepEqual(r.sectors.overallBest,previous);
 assert.deepEqual(r.sectors.statuses,['neutral','neutral','neutral']);assert.equal(r.laps.length,1);
});
test('map splits all segments into three colored paths including final wrap',()=>{
 const paths=[];let path;const ctx={beginPath(){path=[]},moveTo(x,y){path.push([x,y])},lineTo(x,y){path.push([x,y])},stroke(){paths.push({color:this.strokeStyle,path})},arc(){},fill(){},fillText(){}};
 drawSectorMap(ctx,track,p=>[p.x,p.z],['purple','green','yellow']);
 assert.deepEqual(paths.map(p=>p.color),[SECTOR_COLORS.purple,SECTOR_COLORS.green,SECTOR_COLORS.yellow]);
 assert(paths.every(p=>p.path.length===241));assert.deepEqual(paths[2].path.at(-1),paths[0].path[0]);
});

test('beating a slow previous lap without beating session PB stays yellow',()=>{
 const r=new Race();r.state='racing';lap(r,[10,10,10]);lap(r,[12,12,12]);lap(r,[11,11,11]);
 assert.deepEqual(r.sectors.statuses,['yellow','yellow','yellow']);
});
