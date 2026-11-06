"""Reproducible Blender visualization of the actual browser circuit geometry.
Run: blender -b -t 8 --python blender/pit-scene/build_scene.py
Not a browser screenshot: source assets and simulation centerline assembled in Blender.
Final coordinates: game (x,y,z) -> Blender (x,-z,y); ground remains z=0.
"""
import bpy, math, json, random, os
from mathutils import Vector, Matrix
from pathlib import Path
OUT=Path(__file__).resolve().parent; OUT.mkdir(exist_ok=True)
# Prefer bundled inputs; after repository integration resolve the nearest project root.
ROOT=next(p for p in [OUT/'inputs',*OUT.parents] if (p/'public/assets').is_dir())
SNAP=json.loads((OUT/'course-snapshot.json').read_text())
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
random.seed(31273)
def material(n,c,rough=.6,metal=0):
 m=bpy.data.materials.new(n);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;return m
def noise_mat(n,c1,c2,scale,rough,bump):
 m=material(n,c1,rough);ns=m.node_tree.nodes;links=m.node_tree.links;p=ns.get('Principled BSDF');tex=ns.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=scale;tex.inputs['Detail'].default_value=3;coord=ns.new('ShaderNodeTexCoord');links.new(coord.outputs['Object'],tex.inputs['Vector']);r=ns.new('ShaderNodeValToRGB');r.color_ramp.elements[0].position=.2;r.color_ramp.elements[0].color=(*c1,1);r.color_ramp.elements[1].position=.8;r.color_ramp.elements[1].color=(*c2,1);links.new(tex.outputs['Fac'],r.inputs[0]);links.new(r.outputs['Color'],p.inputs['Base Color']);b=ns.new('ShaderNodeBump');b.inputs['Strength'].default_value=bump;b.inputs['Distance'].default_value=.035;links.new(tex.outputs['Fac'],b.inputs['Height']);links.new(b.outputs[0],p.inputs['Normal']);return m
asphalt=noise_mat('Fine grain asphalt',(.055,.065,.073),(.125,.14,.15),45,.78,.3);grass=noise_mat('Living grass',(.045,.085,.018),(.22,.29,.055),1.3,.95,.3);gravel=noise_mat('Fine runoff gravel',(.24,.23,.18),(.42,.40,.33),12,.98,.5);white=material('Paint ivory',(.88,.89,.85));red=material('Kerb red',(.56,.035,.025));metal=material('Galvanized rails',(.40,.45,.46),.4,.7);dark=material('Gantry charcoal',(.025,.04,.045),.5,.4);yellow=material('Sign acid yellow',(.85,.93,.04));leaf=material('Forest canopy',(.07,.15,.05),.9);trunk=material('Tree bark',(.13,.08,.04));cloud=material('Cloud white',(.9,.94,1),1)
def photographic(m,kind,uv=False):
 ns=m.node_tree.nodes;links=m.node_tree.links;p=ns.get('Principled BSDF');coord=ns.new('ShaderNodeTexCoord')
 if uv:
  scale=ns.new('ShaderNodeVectorMath');scale.operation='MULTIPLY';scale.inputs[1].default_value=(17/8.4,4/2.1,1);links.new(coord.outputs['UV'],scale.inputs[0]);vector=scale.outputs[0]
 else:
  geom=ns.new('ShaderNodeNewGeometry');scale=ns.new('ShaderNodeVectorMath');scale.operation='SCALE';scale.inputs[3].default_value=.25;links.new(geom.outputs['Position'],scale.inputs[0]);vector=scale.outputs[0]
 for typ in ['albedo','normal','roughness']:
  tex=ns.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(ROOT/'public/assets/textures'/f'{kind}-{typ}.jpg'));tex.image.pack();tex.extension='REPEAT';links.new(vector,tex.inputs['Vector'])
  if typ=='albedo':links.new(tex.outputs['Color'],p.inputs['Base Color'])
  elif typ=='roughness':tex.image.colorspace_settings.name='Non-Color';links.new(tex.outputs['Color'],p.inputs['Roughness'])
  else:
   tex.image.colorspace_settings.name='Non-Color';normal=ns.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.35 if kind=='asphalt' else .75;links.new(tex.outputs['Color'],normal.inputs['Color']);links.new(normal.outputs[0],p.inputs['Normal'])
photographic(asphalt,'asphalt',True);photographic(grass,'grass')
def box(n,loc,dim,m):
 vs=[(x/2,y/2,z/2) for x,y,z in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
 me=bpy.data.meshes.new(n);me.from_pydata(vs,[],[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]);me.materials.append(m);o=bpy.data.objects.new(n,me);bpy.context.collection.objects.link(o);o.location=loc;o.scale=dim;return o
def cone(n,loc,r,d,m,verts=10,r2=0):
 vs=[(math.cos(i*math.tau/verts)*rr,math.sin(i*math.tau/verts)*rr,z) for z,rr in [(-d/2,r),(d/2,r2)] for i in range(verts)];fs=[tuple(reversed(range(verts))),tuple(range(verts,verts*2))]+[(i,(i+1)%verts,(i+1)%verts+verts,i+verts) for i in range(verts)];me=bpy.data.meshes.new(n);me.from_pydata(vs,[],fs);me.materials.append(m);o=bpy.data.objects.new(n,me);bpy.context.collection.objects.link(o);o.location=loc;return o
def cylinder(n,loc,r,d,m,verts=10):return cone(n,loc,r,d,m,verts,r)
def label(s,loc,rot,size,m):
 bpy.ops.object.text_add(location=loc,rotation=rot);o=bpy.context.object;o.data.body=s;o.data.align_x='CENTER';o.data.size=size;o.data.extrude=.002;o.data.materials.append(m);return o
# Exact snapshot exported from current simulation and track-details modules.
track=[(p['x'],p['z']) for p in SNAP['track']]
N=len(track)
def heading(i):a=track[i%N];b=track[(i+1)%N];return math.atan2(b[0]-a[0],b[1]-a[1])
def ribbon(n,l,r,z,m):
 vs=[];fs=[];uvs=[];travel=0
 for i in range(N+1):
  if i:travel+=math.hypot(track[i%N][0]-track[(i-1)%N][0],track[i%N][1]-track[(i-1)%N][1])
  uvs.extend([(0,travel/4),(4,travel/4)])
  x,y=track[i%N];h=heading(i);nx,ny=math.cos(h),-math.sin(h);vs.extend([(x+nx*l,y+ny*l,z),(x+nx*r,y+ny*r,z)])
  if i<N:k=2*i;fs.append((k,k+1,k+3,k+2))
 me=bpy.data.meshes.new(n);me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new(n,me);bpy.context.collection.objects.link(o);o.data.materials.append(m)
 layer=me.uv_layers.new(name='Track UV')
 for poly in me.polygons:
  for loop in poly.loop_indices:layer.data[loop].uv=uvs[me.loops[loop].vertex_index]
box('Ground',(0,0,-.07),(2000,2000,.1),grass)
ribbon('Runoff',-14.8,14.8,.015,gravel);ribbon('Grass verge',-11.2,11.2,.02,grass);ribbon('Circuit asphalt',-8.5,8.5,.035,asphalt);ribbon('Left painted edge',-8.1,-7.94,.045,white);ribbon('Right painted edge',7.94,8.1,.045,white)
for side in [-1,1]:
 for i in range(0,N,8):
  x,y=track[i];h=heading(i)
  if side==1 and x>205 and -225<y<115:continue
  dx,dy=math.cos(h)*side*15.5,-math.sin(h)*side*15.5
  box('Rail post',(x+dx,y+dy,.6),(.16,.16,1.2),metal);q=track[(i+8)%N];ln=math.hypot(q[0]-x,q[1]-y)
  for z in [.68,1.05]:o=box('Rail beam',((x+q[0])/2+dx,(y+q[1])/2+dy,z),(.12,ln+1,.16),metal);o.rotation_euler.z=-h
sx,sy=track[0]
for x in range(-8,8):
 for y in range(2):box('Finish checker',(sx+x+.5,sy+y+.5,.05),(1,1,.012),white if (x+y)%2 else dark)
for i in range(1,9):
 j=(N-i*5)%N;x,y=track[j];h=heading(j);off=3 if i%2 else -3;o=box('Starting grid',(x+math.cos(h)*off,y-math.sin(h)*off,.06),(2,.12,.03),white);o.rotation_euler.z=-h
for x in [sx-12,sx+12]:box('Gantry upright',(x,sy+3,3.5),(.5,.5,7),dark)
box('Gantry sign',(sx,sy+3,6.7),(24,.6,1.8),dark);label('F1 2013 / CLUB CIRCUIT',(sx,sy+2.68,6.3),(math.pi/2,0,0),.87,yellow)
# Current sculpted kerbs and tapered pit helpers exported directly from Three.js.
for index,item in enumerate(SNAP['details']):
 raw=item['position'];vs=[(raw[i],raw[i+2],raw[i+1]) for i in range(0,len(raw),3)];fs=[(i,i+2,i+1) for i in range(0,len(vs),3)];me=bpy.data.meshes.new('Current road detail');me.from_pydata(vs,[],fs);o=bpy.data.objects.new(item['name'] or 'Pit lane detail',me);bpy.context.collection.objects.link(o)
 if item['material']=='Asphalt':m=asphalt
 else:m=material('Road detail material '+str(index),item['base'])
 me.materials.append(m)
 if item['color']:
  colors=me.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
  for loop in me.loops:
   vi=loop.vertex_index*3;colors.data[loop.index].color=(*item['color'][vi:vi+3],1)
  node=m.node_tree.nodes.new('ShaderNodeVertexColor');node.layer_name='Color';m.node_tree.links.new(node.outputs['Color'],m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
 if item['uv']:
  uv=me.uv_layers.new(name='UVMap')
  for loop in me.loops:
   vi=loop.vertex_index*2;u,v=item['uv'][vi:vi+2];uv.data[loop.index].uv=(u*4,v)
print('ROAD_GEOMETRY_READY',flush=True)
# Use actual editable Blender assets. Collection instances preserve exact geometry.
def asset(name,path=None):
 col=bpy.data.collections.new(name+' asset');before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(path or ROOT/'public/assets'/f'{name}.glb'))
 for obj in set(bpy.data.objects)-before:
  for c in list(obj.users_collection):c.objects.unlink(obj)
  col.objects.link(obj)
 return col
car=asset('car');pit=asset('pit-building');stand=asset('grandstand');oak=asset('oak-realistic');props=asset('pit-props');crew=asset('pit-crew',ROOT/'public/assets/pit-crew.glb')
def instance(name,col,loc,angle=0):
 o=bpy.data.objects.new(name,None);o.instance_type='COLLECTION';o.instance_collection=col;o.location=loc;o.rotation_euler.z=angle;bpy.context.collection.objects.link(o);return o
instance('Car staged beside pit lane',car,(232,-79,.07),0)
for i in range(11):
 o=instance('Pit block '+str(i),pit,(241,-135+i*12,0),math.pi/2);o.scale.y=-1
for i in range(10):
 o=instance('Stand block '+str(i),stand,(184,-135+i*12,0),-math.pi/2);o.scale.y=-1
for z in [-123,-99,-75,-51,-27]:
 o=instance('Pit props',props,(241,z,0),math.pi/2);o.scale.y=-1
crewRoot=instance('Static garage crew',crew,(241,-75,0),math.pi/2);crewRoot.scale.y=-1
bpy.ops.object.light_add(type='POINT',location=(240,-73.5,2.7));bpy.context.object.data.energy=170;bpy.context.object.data.color=(1,.9,.7);bpy.context.object.data.shadow_soft_size=.5
for i in range(10):
 y=-139+i*15;box('Trackside advertising',(194,y,1.4),(.12,11,1.8),yellow)
 label('APEX MOTORSPORT' if i%2 else 'OPEN WHEEL / 2013',(194.07,y,1.1),(math.pi/2,0,math.pi/2),.64,dark)
# Correct wood and paint physically for the modern lighting.
for m in bpy.data.materials:
 if not m.use_nodes:continue
 p=m.node_tree.nodes.get('Principled BSDF')
 if not p:continue
 if 'white' in m.name.lower():p.inputs['Coat Weight'].default_value=.28;p.inputs['Coat Roughness'].default_value=.22
 if 'cedar' in m.name.lower():
  nodes=m.node_tree.nodes;links=m.node_tree.links;coord=nodes.new('ShaderNodeTexCoord');mapping=nodes.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY';mapping.inputs[1].default_value=(.8,20,20);links.new(coord.outputs['Generated'],mapping.inputs[0]);noise=nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=5;links.new(mapping.outputs[0],noise.inputs['Vector']);r=nodes.new('ShaderNodeValToRGB');r.color_ramp.elements[0].color=(.09,.032,.01,1);r.color_ramp.elements[1].color=(.40,.22,.09,1);links.new(noise.outputs['Fac'],r.inputs[0]);links.new(r.outputs[0],p.inputs['Base Color'])
# Exact foliage placements from current foliage.js. Instance the authored oak.
for i,p in enumerate(SNAP['foliage']):
 o=instance('Oak '+str(i),oak,(p['x'],p['z'],p['y']),-p['rotation']);o.scale=(p['scale'],-p['scale'],p['scale'])
mountain=grass;tv=[];tf=[]
for j in range(101):
 y=-1000+j*20
 for i in range(101):
  x=-1000+i*20;d=math.hypot(x,y);h=max(0,min(1,(d-380)/150))*(35+math.sin(x*.012)*math.cos(y*.009)*35+abs(math.sin(x*.006+y*.008))*85+math.sin(x*.026+y*.03)*8);tv.append((x,y,h*.24-.1))
for j in range(100):
 for i in range(100):
  k=j*101+i;tf.extend([(k,k+1,k+102),(k,k+102,k+101)])
me=bpy.data.meshes.new('100 by 100 displaced terrain');me.from_pydata(tv,[],tf);me.materials.append(mountain);o=bpy.data.objects.new('Organic mountain terrain',me);bpy.context.collection.objects.link(o)
for poly in me.polygons:poly.use_smooth=True
print('BUILDINGS_AND_SCENERY_READY',flush=True)
# Sky texture gives physically based daylight; subtle cloud forms are geometry like game.
world=bpy.data.worlds.new('Blue daylight');world.use_nodes=True;nodes=world.node_tree.nodes;sky=nodes.new('ShaderNodeTexSky');sky.sky_type='NISHITA';sky.sun_elevation=math.radians(32);sky.sun_rotation=math.radians(130);sky.air_density=1.1;sky.dust_density=.6;world.node_tree.links.new(sky.outputs[0],nodes.get('Background').inputs[0]);nodes.get('Background').inputs['Strength'].default_value=.35;bpy.context.scene.world=world
bpy.ops.object.light_add(type='SUN',location=(150,190,260));sun=bpy.context.object;sun.name='Warm afternoon sun';sun.data.energy=2.5;sun.data.angle=.04;sun.data.color=(1,.91,.77);sun.rotation_euler=(math.radians(27),math.radians(-30),math.radians(-35))
cloudmesh=bpy.data.meshes.new('Shared cloud form');cv=[(math.sin(math.pi*j/8)*math.cos(math.tau*i/12),math.sin(math.pi*j/8)*math.sin(math.tau*i/12),math.cos(math.pi*j/8)) for j in range(9) for i in range(12)];cf=[(j*12+i,j*12+(i+1)%12,(j+1)*12+(i+1)%12,(j+1)*12+i) for j in range(8) for i in range(12)];cloudmesh.from_pydata(cv,[],cf);cloudmesh.materials.append(cloud)
for j in range(28):
 a=random.random()*math.tau;d=300+random.random()*400;x,y=math.sin(a)*d,math.cos(a)*d;z=100+random.random()*70
 for k in range(4):
  o=bpy.data.objects.new('Distant cloud',cloudmesh);bpy.context.collection.objects.link(o);o.location=(x+k*16,y,z+random.random()*5);o.scale=(22+random.random()*16,12+random.random()*6,7+random.random()*4)
  for p in o.data.polygons:p.use_smooth=True
hdr=ROOT/'public/assets/environment/partly-cloudy-sky.hdr'
if hdr.exists():
 env=world.node_tree.nodes.new('ShaderNodeTexEnvironment');env.image=bpy.data.images.load(str(hdr));env.image.pack();world.node_tree.links.new(env.outputs['Color'],world.node_tree.nodes.get('Background').inputs['Color']);world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.7
 for obj in bpy.data.objects:
  if obj.name.startswith('Distant cloud'):obj.hide_render=True
# Current folded roller shutters from the actual garage-doors.js helper.
doors=json.loads((OUT/'garage-doors-snapshot.json').read_text());door_materials={}
for i,item in enumerate(doors['meshes']):
 key=tuple(item['color'])+(item['metalness'],item['roughness'])
 if key not in door_materials:door_materials[key]=material('Garage shutter material',item['color'],item['roughness'],item['metalness'])
 raw=item['position'];vs=[(raw[j],raw[j+2],raw[j+1]) for j in range(0,len(raw),3)];fs=[(j,j+2,j+1) for j in range(0,len(vs),3)];me=bpy.data.meshes.new('Shutter geometry');me.from_pydata(vs,[],fs);me.materials.append(door_materials[key]);o=bpy.data.objects.new('Closed garage shutter '+str(i),me);bpy.context.collection.objects.link(o)
# Use the proper right-handed glTF-to-Blender mapping: game (x,y,z) -> (x,-z,y).
# Reflect constructed world layout once, never reflect source asset lettering.
bpy.context.view_layer.update()
reflection=Matrix.Diagonal((1,-1,1,1))
for obj in list(bpy.context.scene.objects):
 if obj.parent is None:obj.matrix_world=reflection@obj.matrix_world
car_object=bpy.data.objects.get('Car staged beside pit lane');car_object.scale.x*=-1
# Camera is actual scene photography, without HUD or fake gameplay labels.
bpy.ops.object.camera_add(location=(220.8,67.2,2.8));cam=bpy.context.object;cam.name='Circuit beauty camera';target=Vector((235.0,78.0,1.05));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=43;cam.data.clip_end=2500;sc=bpy.context.scene;sc.camera=cam;sc.render.engine='CYCLES';sc.cycles.samples=64;sc.cycles.use_denoising=False;sc.cycles.max_bounces=5;sc.render.resolution_x=1600;sc.render.resolution_y=1000;sc.render.resolution_percentage=100;sc.view_settings.view_transform='AgX';sc.view_settings.exposure=0;sc.render.image_settings.file_format='PNG';sc.render.filepath=str(OUT/'pit-scene-blender-wip.png')
# Use repository-relative image dependencies to keep the editable scene compact.
for im in bpy.data.images:
 if im.type=='RENDER_RESULT':continue
 if im.name.startswith('oak-'):
  target=ROOT/'blender/foliage'/({'oak-bark':'oak-bark.jpg','oak-bark-normal':'oak-bark-normal.png','oak-leaf-cluster':'oak-leaf-cluster.png'}[im.name])
 elif im.name.startswith('partly-cloudy'):target=ROOT/'public/assets/environment/partly-cloudy-sky.hdr'
 else:target=ROOT/'public/assets/textures'/(im.name.split('.jpg')[0]+'.jpg')
 if not target.is_file():continue
 if im.packed_file:im.unpack(method='REMOVE')
 im.filepath='//'+os.path.relpath(target,OUT)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'pit-scene-blender-wip.blend'),compress=True);bpy.ops.render.render(write_still=True)
print('BEAUTY_READY',sc.render.filepath,flush=True)
print('WIP_SCENE_COMPLETE',flush=True)
