import test from 'node:test';
import assert from 'node:assert/strict';
import {createRenderQuality,createFrameMetrics,settingsOwnKeyboard} from '../src/render-quality.js';
const texture=()=>({isTexture:true});
function setup(materials){const renderer={ratio:1,setPixelRatio(v){this.ratio=v;},getPixelRatio(){return this.ratio;},shadowMap:{enabled:true}};const scene={traverse(fn){materials.forEach(material=>fn({material}));}};return {renderer,scene};}
test('repeated texture swaps restore exact maps and retain alpha, displacement and lighting',()=>{
 const map=texture(),normalMap=texture(),alphaMap=texture(),displacementMap=texture(),emissiveMap=texture(),envMap=texture();const opaque={map,normalMap,displacementMap,emissiveMap,envMap},leaf={map,alphaMap,alphaTest:.4},glass={map,transparent:true},sign={map,userData:{keepColorMap:true}},hash={map,alphaHash:true};
 const q=createRenderQuality(setup([opaque,leaf,glass,sign,hash]));for(let i=0;i<4;i++){q.setTextures(false);assert.equal(opaque.map,null);assert.equal(opaque.normalMap,null);for(const m of [leaf,glass,sign,hash])assert.equal(m.map,map);assert.equal(leaf.alphaMap,alphaMap);assert.equal(opaque.displacementMap,displacementMap);assert.equal(opaque.emissiveMap,emissiveMap);assert.equal(opaque.envMap,envMap);q.setTextures(true);assert.equal(opaque.map,map);assert.equal(opaque.normalMap,normalMap);}
});
test('late maps and new materials register while disabled without losing original references',()=>{
 const list=[],q=createRenderQuality(setup(list));q.setTextures(false);const map=texture(),m={map};list.push(m);q.register();q.register();assert.equal(m.map,null);q.setTextures(true);assert.equal(m.map,map);q.setTextures(false);const normalMap=texture();m.normalMap=normalMap;q.register();assert.equal(m.normalMap,null);q.setTextures(true);assert.equal(m.normalMap,normalMap);
});
test('quality caps survive device ratio changes and settings notify metric reset owner',()=>{
 let ratio=2,changes=0;const s=setup([]),q=createRenderQuality({...s,devicePixelRatio:()=>ratio,onChange:()=>changes++});assert.equal(s.renderer.ratio,1.35);q.setPreset('fast');assert.equal(s.renderer.ratio,1);assert.equal(s.renderer.shadowMap.enabled,false);ratio=1.5;q.resize();assert.equal(s.renderer.ratio,1);q.setPreset('photo');assert.equal(s.renderer.ratio,1.5);assert.equal(s.renderer.shadowMap.enabled,true);q.setTextures(false);assert.equal(changes,4);assert.throws(()=>q.setPreset('ultra'),RangeError);
});
test('full-frame counters accumulate passes; RAF and CPU timing stay distinct',()=>{
 let clock=0,resets=0;const info={autoReset:true,render:{calls:0,triangles:0},reset(){resets++;this.render.calls=0;this.render.triangles=0;}};const m=createFrameMetrics({info},{now:()=>clock,capacity:2});assert.equal(info.autoReset,false);let dt=m.begin(0);clock=2;m.end(dt);dt=m.begin(16);info.render.calls+=5;info.render.calls+=3;info.render.triangles+=40;clock=5;m.end(dt);assert.equal(resets,2);assert.equal(m.snapshot().averageCalls,8);assert.equal(m.snapshot().estimatedFPS,62.5);assert.equal(m.snapshot().averageSubmissionMs,3);assert.equal(m.snapshot().gpuTimeMs,null);dt=m.begin(5000);m.end(dt);assert.equal(m.snapshot().sampleCount,1);m.reset();assert.equal(m.snapshot().sampleCount,0);assert.equal(m.snapshot().lastFrame,null);m.dispose();assert.equal(info.autoReset,true);
});
test('settings targets retain native keyboard ownership',()=>{
 for(const kind of ['select','input','textarea','[contenteditable="true"]','#render-settings'])assert(settingsOwnKeyboard({closest:selector=>selector.includes(kind)?{}:null}));assert.equal(settingsOwnKeyboard({closest:()=>null}),false);assert.equal(settingsOwnKeyboard(null),false);
});
