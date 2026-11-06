"""Reproducible Blender visualization of the actual browser circuit geometry.
Run: blender -b -t 8 --python blender/build_circuit.py
Not a browser screenshot: source assets and simulation centerline assembled in Blender.
Game (x,y,z) -> Blender (x,z,y); ground plane remains z=0.
"""
import bpy, math, json, random, os
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent; OUT=ROOT/'evidence'; OUT.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
random.seed(31273)
def material(n,c,rough=.6,metal=0):
 m=bpy.data.materials.new(n);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;return m
def noise_mat(n,c1,c2,scale,rough,bump):
 m=material(n,c1,rough);ns=m.node_tree.nodes;links=m.node_tree.links;p=ns.get('Principled BSDF');tex=ns.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=scale;tex.inputs['Detail'].default_value=3;coord=ns.new('ShaderNodeTexCoord');links.new(coord.outputs['Object'],tex.inputs['Vector']);r=ns.new('ShaderNodeValToRGB');r.color_ramp.elements[0].position=.2;r.color_ramp.elements[0].color=(*c1,1);r.color_ramp.elements[1].position=.8;r.color_ramp.elements[1].color=(*c2,1);links.new(tex.outputs['Fac'],r.inputs[0]);links.new(r.outputs['Color'],p.inputs['Base Color']);b=ns.new('ShaderNodeBump');b.inputs['Strength'].default_value=bump;b.inputs['Distance'].default_value=.035;links.new(tex.outputs['Fac'],b.inputs['Height']);links.new(b.outputs[0],p.inputs['Normal']);return m
asphalt=noise_mat('Fine grain asphalt',(.055,.065,.073),(.125,.14,.15),45,.78,.3);grass=noise_mat('Living grass',(.045,.085,.018),(.22,.29,.055),1.3,.95,.3);gravel=noise_mat('Fine runoff gravel',(.24,.23,.18),(.42,.40,.33),12,.98,.5);white=material('Paint ivory',(.88,.89,.85));red=material('Kerb red',(.56,.035,.025));metal=material('Galvanized rails',(.40,.45,.46),.4,.7);dark=material('Gantry charcoal',(.025,.04,.045),.5,.4);yellow=material('Sign acid yellow',(.85,.93,.04));leaf=material('Forest canopy',(.07,.15,.05),.9);trunk=material('Tree bark',(.13,.08,.04));cloud=material('Cloud white',(.9,.94,1),1)
def photographic(m,kind,uv=False):
 ns=m.node_tree.nodes;links=m.node_tree.links;p=ns.get('Principled BSDF');coord=ns.new('ShaderNodeTexCoord')
 if uv: vector=coord.outputs['UV']
 else:
  geom=ns.new('ShaderNodeNewGeometry');scale=ns.new('ShaderNodeVectorMath');scale.operation='SCALE';scale.inputs[3].default_value=.25;links.new(geom.outputs['Position'],scale.inputs[0]);vector=scale.outputs[0]
 for typ in ['albedo','normal','roughness']:
  tex=ns.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(ROOT/'public/assets/textures'/f'{kind}-{typ}.jpg'));tex.image.pack();tex.extension='REPEAT';links.new(vector,tex.inputs['Vector'])
  if typ=='albedo':links.new(tex.outputs['Color'],p.inputs['Base Color'])
  elif typ=='roughness':tex.image.colorspace_settings.name='Non-Color';links.new(tex.outputs['Color'],p.inputs['Roughness'])
  else:
   tex.image.colorspace_settings.name='Non-Color';normal=ns.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.55;links.new(tex.outputs['Color'],normal.inputs['Color']);links.new(normal.outputs[0],p.inputs['Normal'])
photographic(asphalt,'asphalt',True);photographic(grass,'grass')
def box(n,loc,dim,m):
 vs=[(x/2,y/2,z/2) for x,y,z in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
 me=bpy.data.meshes.new(n);me.from_pydata(vs,[],[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]);me.materials.append(m);o=bpy.data.objects.new(n,me);bpy.context.collection.objects.link(o);o.location=loc;o.scale=dim;return o
def cone(n,loc,r,d,m,verts=10,r2=0):
 vs=[(math.cos(i*math.tau/verts)*rr,math.sin(i*math.tau/verts)*rr,z) for z,rr in [(-d/2,r),(d/2,r2)] for i in range(verts)];fs=[tuple(reversed(range(verts))),tuple(range(verts,verts*2))]+[(i,(i+1)%verts,(i+1)%verts+verts,i+verts) for i in range(verts)];me=bpy.data.meshes.new(n);me.from_pydata(vs,[],fs);me.materials.append(m);o=bpy.data.objects.new(n,me);bpy.context.collection.objects.link(o);o.location=loc;return o
def cylinder(n,loc,r,d,m,verts=10):return cone(n,loc,r,d,m,verts,r)
def label(s,loc,rot,size,m):
 bpy.ops.object.text_add(location=loc,rotation=rot);o=bpy.context.object;o.data.body=s;o.data.align_x='CENTER';o.data.size=size;o.data.extrude=.002;o.data.materials.append(m);return o
# Read exact exported simulation centerline when available.
paths=[ROOT/'blender/track.json',ROOT/'track.json',ROOT/'evidence/track.json']; track=None
for path in paths:
 if path.exists():
  data=json.loads(path.read_text());raw=data.get('track',data.get('points',[])) if isinstance(data,dict) else data
  if raw:track=[(p['x'],p['z']) if isinstance(p,dict) else tuple(p[:2]) for p in raw];break
if track is None:
 cp=[(x*2.2,y*2.2) for x,y in [(95,-75),(95,10),(80,80),(30,110),(-40,100),(-90,60),(-110,-5),(-80,-60),(-40,-50),(-25,-85),(30,-110),(78,-105)]];track=[]
 for j in range(720):
  s=j/720*12;i=int(s);u=s-i;v=[]
  for k in range(2):
   a,b,c,d=[cp[q%12][k] for q in [i-1,i,i+1,i+2]];v.append(.5*(2*b+(-a+c)*u+(2*a-5*b+4*c-d)*u*u+(-a+3*b-3*c+d)*u*u*u))
  track.append(tuple(v))
 (ROOT/'blender/track.json').write_text(json.dumps({'track':[{'x':x,'z':y} for x,y in track],'source':'Exact simulation.js Catmull-Rom formula, scale 2.2'},indent=2))
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
for i in range(0,N,2):
 x,y=track[i];qx,qy=track[(i+2)%N];h=math.atan2(qx-x,qy-y);length=math.hypot(qx-x,qy-y)
 for side in [-1,1]:
  o=box('Continuous kerb',((x+qx)/2+math.cos(h)*side*8.85,(y+qy)/2-math.sin(h)*side*8.85,.09),(.85,length+.08,.12),white if (i//4)%2 else red);o.rotation_euler.z=-h
for side in [-1,1]:
 for i in range(0,N,8):
  x,y=track[i];h=heading(i)
  if side==1 and x>205 and -177<y<55:continue
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
apron=box('Pit apron',(229,-60,.04),(26,215,.05),asphalt);uv=apron.data.uv_layers.new(name='Apron UV')
for poly in apron.data.polygons:
 for loop in poly.loop_indices:
  v=apron.data.vertices[apron.data.loops[loop].vertex_index].co;uv.data[loop].uv=((v.x+.5)*4,v.y+.5)
for y in range(-163,45,8):box('Pit lane marking',(222,y,.08),(.15,4,.03),white)
print('ROAD_GEOMETRY_READY',flush=True)
# Use actual editable Blender assets. Collection instances preserve exact geometry.
def asset(name):
 col=bpy.data.collections.new(name+' asset');
 with bpy.data.libraries.load(str(ROOT/'blender'/f'{name}.blend'),link=False) as (src,dst):dst.objects=src.objects
 for o in dst.objects:
  if o:col.objects.link(o)
 return col
car=asset('car');pit=asset('pit-building');stand=asset('grandstand')
def instance(name,col,loc,angle=0):
 o=bpy.data.objects.new(name,None);o.instance_type='COLLECTION';o.instance_collection=col;o.location=loc;o.rotation_euler.z=angle;bpy.context.collection.objects.link(o);return o
instance('Start car',car,(sx,sy,.04),-heading(0))
for i in range(11):instance('Pit block '+str(i),pit,(241,-135+i*12,0),-math.pi/2)
for i in range(10):instance('Stand block '+str(i),stand,(184,-135+i*12,0),math.pi/2)
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
# Exact browser PRNG state: 28 clouds consume 19 calls each; two fallback
# 25,000-pixel textures consume six calls per pixel before tree placement.
seed=31273
def rnd():
 global seed
 seed=(seed*16807)%2147483647
 return (seed-1)/2147483646
for _ in range(28*19+2*25000*6):rnd()
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1);base=bpy.context.object;foliage=base.data;foliage.name='Shared clustered foliage';foliage.materials.append(leaf);bpy.data.objects.remove(base,do_unlink=True)
for poly in foliage.polygons:poly.use_smooth=True
for i in range(230):
 a=rnd()*math.tau;d=340+rnd()*160;x,y=math.sin(a)*d,math.cos(a)*d;cone('Tree trunk',(x,y,4),.5,8,trunk,7,.22)
 for j in range(8):
  angle=j*2.399;spread=2.7 if j else 0;o=bpy.data.objects.new('Irregular foliage',foliage);bpy.context.collection.objects.link(o);o.location=(x+math.sin(angle)*spread,y+math.cos(angle)*spread,7.5+(j%3)*2)
  sx,sz,sy=2.6+rnd()*1.6,2.5+rnd()*2,2.4+rnd()*1.6;o.scale=(sx,sy,sz);rx,ry,rz=rnd(),rnd()*6,rnd();o.rotation_euler=(rx,rz,-ry)
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
 env=world.node_tree.nodes.new('ShaderNodeTexEnvironment');env.image=bpy.data.images.load(str(hdr));env.image.pack();world.node_tree.links.new(env.outputs['Color'],world.node_tree.nodes.get('Background').inputs['Color']);world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.5
 for obj in bpy.data.objects:
  if obj.name.startswith('Distant cloud'):obj.hide_render=True
# Camera is actual scene photography, without HUD or fake gameplay labels.
bpy.ops.object.camera_add(location=(201,-175,2.8));cam=bpy.context.object;cam.name='Circuit beauty camera';target=Vector((211,-151,1.1));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=35;cam.data.clip_end=2500;sc=bpy.context.scene;sc.camera=cam;sc.render.engine='CYCLES';sc.cycles.samples=32;sc.cycles.use_denoising=False;sc.cycles.max_bounces=5;sc.render.resolution_x=1600;sc.render.resolution_y=1000;sc.render.resolution_percentage=100;sc.view_settings.view_transform='AgX';sc.view_settings.exposure=-.4;sc.render.image_settings.file_format='PNG';sc.render.filepath=str(OUT/'circuit-blender.png')
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blender/circuit.blend'),compress=True);bpy.ops.render.render(write_still=True)
print('BEAUTY_READY',sc.render.filepath,flush=True)
print('CIRCUIT_COMPLETE',flush=True)
