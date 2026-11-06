// Upload textures and compile shader variants before enabling the Start button.
// This reduces first-use stalls; it is not an FPS or hardware capability promise.
const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
export async function prepareRenderer(renderer,scene,camera,{waitFrame=frame,onStage=()=>{},warmGroups=[],clock=()=>performance.now()}={}){
 const start=clock(),textures=new Set(),visibility=[],counts=[],culling=[];
 const warming=new Set();for(const group of warmGroups)group.traverse(o=>warming.add(o));for(const o of warming){visibility.push([o,o.visible]);if(o.isInstancedMesh&&o.count===0&&o.instanceMatrix.count>0)counts.push([o,o.count]);}
 const add=value=>{if(value?.isTexture)textures.add(value);};add(scene.background);add(scene.environment);
 scene.traverse(o=>{if(o.isMesh){culling.push([o,o.frustumCulled]);o.frustumCulled=false;}for(const m of (Array.isArray(o.material)?o.material:[o.material]).filter(Boolean)){for(const v of Object.values(m))add(v);for(const u of Object.values(m.uniforms??{}))add(u?.value);}});
 try{
  for(const[o]of visibility)o.visible=true;for(const[o]of counts)o.count=1;
  onStage('UPLOADING TEXTURES',.72);await waitFrame();for(const t of textures)renderer.initTexture(t);
  onStage('COMPILING LIGHTING & SHADERS',.82);await waitFrame();if(renderer.compileAsync)await renderer.compileAsync(scene,camera);else renderer.compile(scene,camera);
  onStage('PREPARING SHADOWS & FIRST FRAMES',.93);for(let i=0;i<3;i++){renderer.render(scene,camera);await waitFrame();}
  let gpuFenceReady=null;const gl=renderer.getContext?.();
  if(gl?.fenceSync){const sync=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);if(sync){gl.flush();const until=clock()+5000;try{while(clock()<until){const s=gl.clientWaitSync(sync,0,0);if(s===gl.ALREADY_SIGNALED||s===gl.CONDITION_SATISFIED){gpuFenceReady=true;break;}if(s===gl.WAIT_FAILED){gpuFenceReady=false;break;}await waitFrame();}gpuFenceReady??=false;}finally{gl.deleteSync(sync);}}}
  return {preparationMs:Math.round(clock()-start),textureCount:textures.size,warmupFrames:3,programCount:renderer.info?.programs?.length??null,gpuFenceReady};
 }finally{for(const[o,v]of visibility)o.visible=v;for(const[o,v]of counts)o.count=v;for(const[o,v]of culling)o.frustumCulled=v;}
}
