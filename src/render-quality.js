// Explicit settings: no automatic downgrades, geometry edits, disposal or downloads.
export const QUALITY_PRESETS=Object.freeze({fast:Object.freeze({pixelRatioCap:1,shadows:false}),balanced:Object.freeze({pixelRatioCap:1.35,shadows:true}),photo:Object.freeze({pixelRatioCap:1.7,shadows:true})});
const MAP_SLOTS=['map','normalMap','bumpMap','roughnessMap','metalnessMap','aoMap','clearcoatMap','clearcoatNormalMap','clearcoatRoughnessMap'];
export function settingsOwnKeyboard(target){return Boolean(target?.closest?.('select,input,textarea,[contenteditable="true"],#render-settings'));}
export function createRenderQuality({renderer,scene,defaultPreset='balanced',devicePixelRatio=()=>globalThis.devicePixelRatio||1,onChange=()=>{}}){
 if(!QUALITY_PRESETS[defaultPreset])throw new RangeError('Unknown quality preset');
 let preset=defaultPreset,texturesEnabled=true;const originals=new Map();
 const slotsFor=m=>MAP_SLOTS.filter(key=>key!=='map'||!(m.alphaTest>0||m.transparent||m.alphaHash||m.userData?.keepColorMap));
 function applyMaterial(material,original){let changed=false;for(const[slot,texture]of Object.entries(original)){const next=texturesEnabled?texture:null;if(material[slot]!==next){material[slot]=next;changed=true;}}if(changed)material.needsUpdate=true;}
 function register(root=scene){root.traverse(object=>{for(const material of(Array.isArray(object.material)?object.material:[object.material])){if(!material)continue;const saved=originals.get(material)||{};for(const slot of slotsFor(material)){if(material[slot]?.isTexture)saved[slot]=material[slot];}originals.set(material,saved);applyMaterial(material,saved);}});}
 function resize(){renderer.setPixelRatio(Math.min(Math.max(.5,devicePixelRatio()),QUALITY_PRESETS[preset].pixelRatioCap));}
 function settings(){return {preset,texturesEnabled,pixelRatio:renderer.getPixelRatio(),shadows:renderer.shadowMap.enabled,registeredMaterials:originals.size};}
 function setPreset(value){if(!QUALITY_PRESETS[value])throw new RangeError('Unknown quality preset: '+value);const changedShadows=renderer.shadowMap.enabled!==QUALITY_PRESETS[value].shadows;preset=value;resize();renderer.shadowMap.enabled=QUALITY_PRESETS[preset].shadows;renderer.shadowMap.needsUpdate=true;if(changedShadows)for(const material of originals.keys())material.needsUpdate=true;onChange(settings());}
 function setTextures(enabled){texturesEnabled=Boolean(enabled);for(const[material,original]of originals)applyMaterial(material,original);onChange(settings());}
 register();setPreset(preset);return {register,setPreset,setTextures,resize,settings};
}
// CPU submission and RAF cadence are not GPU timing. Own one reset per full frame.
export function createFrameMetrics(renderer,{capacity=180,now=()=>performance.now()}={}){
 if(!Number.isInteger(capacity)||capacity<1)throw new RangeError('Invalid capacity');
 const samples=[];let started=0,lastRAF=null,lastFrame=null;const originalAutoReset=renderer.info.autoReset;renderer.info.autoReset=false;
 function begin(rafTimestamp){renderer.info.reset();started=now();const delta=lastRAF===null?null:rafTimestamp-lastRAF;lastRAF=rafTimestamp;return delta;}
 function end(frameMs){const sample={frameMs,submissionMs:now()-started,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};lastFrame=sample;if(Number.isFinite(frameMs)&&frameMs>0&&frameMs<1000){samples.push(sample);if(samples.length>capacity)samples.shift();}return sample;}
 function snapshot(){const sorted=samples.map(s=>s.frameMs).sort((a,b)=>a-b),mean=key=>samples.length?samples.reduce((s,v)=>s+v[key],0)/samples.length:null,avgFrame=mean('frameMs');return {sampleCount:samples.length,lastFrame,averageFrameMs:avgFrame,estimatedFPS:avgFrame?1000/avgFrame:null,p95FrameMs:sorted.length?sorted[Math.ceil(sorted.length*.95)-1]:null,averageSubmissionMs:mean('submissionMs'),averageCalls:mean('calls'),averageTriangles:mean('triangles'),gpuTimeMs:null,timingNote:'RAF cadence and CPU submission only; not GPU execution time'};}
 function reset(){samples.length=0;lastRAF=null;lastFrame=null;}
 return {begin,end,snapshot,reset,dispose(){renderer.info.autoReset=originalAutoReset;}};
}
