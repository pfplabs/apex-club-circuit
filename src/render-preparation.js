// Upload textures and compile shader variants before enabling the Start button.
// This reduces first-use stalls; it is not an FPS or hardware capability promise.
const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
// A driver may never report KHR_parallel_shader_compile completion. Fail visibly
// instead of keeping Start disabled forever; do not claim a timed-out GPU is ready.
export async function boundedCompile(renderer,scene,camera,timeoutMs=60000){
 let timer;const canvas=renderer.domElement;let lost;
 const failure=new Promise((_,reject)=>{
  timer=setTimeout(()=>reject(new Error('Shader preparation exceeded 60 seconds. Reload this F1 tab to retry.')),timeoutMs);
  lost=()=>reject(new Error('WebGL context was lost while preparing shaders. Reload this F1 tab to retry.'));
  canvas?.addEventListener?.('webglcontextlost',lost,{once:true});
 });
 try{await Promise.race([Promise.resolve().then(()=>renderer.compileAsync?renderer.compileAsync(scene,camera):renderer.compile(scene,camera)),failure]);}
 finally{clearTimeout(timer);canvas?.removeEventListener?.('webglcontextlost',lost);}
}
export async function prepareRenderer(renderer,scene,camera,{waitFrame=frame,onStage=()=>{},warmGroups=[],clock=()=>performance.now(),compileTimeoutMs=60000}={}){
 const start=clock(),textures=new Set(),visibility=[],counts=[],culling=[];
 const warming=new Set();for(const group of warmGroups)group.traverse(o=>warming.add(o));for(const o of warming){visibility.push([o,o.visible]);if(o.isInstancedMesh&&o.instanceMatrix.count>0)counts.push([o,o.count]);}
 const add=value=>{if(value?.isTexture)textures.add(value);};add(scene.background);add(scene.environment);
 scene.traverse(o=>{if(o.isMesh){culling.push([o,o.frustumCulled]);o.frustumCulled=false;}for(const m of (Array.isArray(o.material)?o.material:[o.material]).filter(Boolean)){for(const v of Object.values(m))add(v);for(const u of Object.values(m.uniforms??{}))add(u?.value);}});
 try{
  for(const[o]of visibility)o.visible=true;for(const[o]of counts)o.count=1;
  onStage('UPLOADING TEXTURES',.72);await waitFrame();for(const t of textures)renderer.initTexture(t);
  const uploadedAt=clock();onStage('COMPILING LIGHTING & SHADERS',.82);await waitFrame();await boundedCompile(renderer,scene,camera,compileTimeoutMs);const compiledAt=clock();
  // compile() traverses all materials regardless of culling. Raster warm-up only
  // needs the starting view plus one instance of each optional shader variant.
  for(const[o,v]of culling)o.frustumCulled=v;
  onStage('PREPARING SHADOWS & FIRST FRAMES',.93);for(let i=0;i<3;i++){renderer.render(scene,camera);await waitFrame();}
  let gpuFenceReady=null;const gl=renderer.getContext?.();
  if(gl?.fenceSync){const sync=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);if(sync){gl.flush();const until=clock()+5000;try{while(clock()<until){const s=gl.clientWaitSync(sync,0,0);if(s===gl.ALREADY_SIGNALED||s===gl.CONDITION_SATISFIED){gpuFenceReady=true;break;}if(s===gl.WAIT_FAILED){gpuFenceReady=false;break;}await waitFrame();}gpuFenceReady??=false;}finally{gl.deleteSync(sync);}}}
  return {preparationMs:Math.round(clock()-start),uploadMs:Math.round(uploadedAt-start),compileMs:Math.round(compiledAt-uploadedAt),warmupMs:Math.round(clock()-compiledAt),textureCount:textures.size,warmupFrames:3,programCount:renderer.info?.programs?.length??null,gpuFenceReady};
 }finally{for(const[o,v]of visibility)o.visible=v;for(const[o,v]of counts)o.count=v;for(const[o,v]of culling)o.frustumCulled=v;}
}
