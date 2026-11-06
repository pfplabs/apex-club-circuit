import{test}from'node:test';import assert from'node:assert/strict';import * as THREE from'three';import{prepareRenderer}from'../src/render-preparation.js';
test('renderer preparation uploads unique textures, compiles and warms before ready',async()=>{const scene=new THREE.Scene(),t=new THREE.Texture();scene.environment=t;const m=new THREE.MeshStandardMaterial({map:t}),mesh=new THREE.Mesh(new THREE.BoxGeometry(),m);scene.add(mesh);const tools=new THREE.Group();tools.visible=false;scene.add(tools);const events=[];const renderer={initTexture(x){assert.equal(x,t);events.push('texture');},async compileAsync(){assert(tools.visible);assert(!mesh.frustumCulled);events.push('compile');},render(){events.push('render');},info:{programs:[{}]}};const stats=await prepareRenderer(renderer,scene,new THREE.Camera(),{waitFrame:async()=>{},warmGroups:[tools]});assert.deepEqual(events,['texture','compile','render','render','render']);assert.equal(stats.textureCount,1);assert.equal(stats.warmupFrames,3);assert.equal(tools.visible,false);assert.equal(mesh.frustumCulled,true);});
test('shader preparation failure still restores scene visibility and culling',async()=>{const scene=new THREE.Scene(),mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());scene.add(mesh);mesh.visible=false;await assert.rejects(prepareRenderer({initTexture(){},async compileAsync(){throw Error('GPU failure');}},scene,new THREE.Camera(),{waitFrame:async()=>{},warmGroups:[mesh]}));assert.equal(mesh.visible,false);assert.equal(mesh.frustumCulled,true);});
test('never-ready shader preparation reports a bounded failure and restores the scene',async()=>{
 const scene=new THREE.Scene(),mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial(),200);scene.add(mesh);mesh.visible=false;mesh.count=120;
 const events=new EventTarget();let renders=0;
 await assert.rejects(prepareRenderer({domElement:events,initTexture(){},compileAsync(){assert.equal(mesh.count,1);return new Promise(()=>{});},render(){renders++;}},scene,new THREE.Camera(),{waitFrame:async()=>{},warmGroups:[mesh],compileTimeoutMs:5}),/Shader preparation exceeded/);
 assert.equal(mesh.count,120);assert.equal(mesh.visible,false);assert.equal(mesh.frustumCulled,true);assert.equal(renders,0);
});
test('warm-up draws one instance per optional variant and restores normal culling before rendering',async()=>{
 const scene=new THREE.Scene(),mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial(),300);scene.add(mesh);mesh.count=250;const originallyUnculled=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());originallyUnculled.frustumCulled=false;scene.add(originallyUnculled);
 await prepareRenderer({initTexture(){},async compileAsync(){},render(){assert.equal(mesh.count,1);assert.equal(mesh.frustumCulled,true);assert.equal(originallyUnculled.frustumCulled,false);}},scene,new THREE.Camera(),{waitFrame:async()=>{},warmGroups:[mesh]});
 assert.equal(mesh.count,250);assert.equal(mesh.visible,true);
});
test('lost context rejects shader preparation without rendering and removes the listener',async()=>{
 const scene=new THREE.Scene(),events=new EventTarget();let removed=0;const remove=events.removeEventListener.bind(events);events.removeEventListener=(...args)=>{removed++;remove(...args);};
 await assert.rejects(prepareRenderer({domElement:events,initTexture(){},compileAsync(){events.dispatchEvent(new Event('webglcontextlost'));return new Promise(()=>{});},render(){assert.fail('must not render lost context');}},scene,new THREE.Camera(),{waitFrame:async()=>{}}),/context was lost/);assert.equal(removed,1);
});
test('late compile completion after deadline cannot start rendering or overwrite restored state',async()=>{
 const scene=new THREE.Scene(),mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());mesh.visible=false;scene.add(mesh);let complete,renders=0;
 const pending=prepareRenderer({initTexture(){},compileAsync(){return new Promise(resolve=>{complete=resolve;});},render(){renders++;}},scene,new THREE.Camera(),{waitFrame:async()=>{},warmGroups:[mesh],compileTimeoutMs:5});
 await assert.rejects(pending,/Shader preparation exceeded/);complete();await Promise.resolve();await Promise.resolve();assert.equal(renders,0);assert.equal(mesh.visible,false);assert.equal(mesh.frustumCulled,true);
});
