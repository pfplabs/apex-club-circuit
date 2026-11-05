import bpy, math, os, json
from mathutils import Vector
OUT=os.path.dirname(os.path.abspath(__file__))
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(n,c,metal=0,rough=.38):
 m=bpy.data.materials.new(n); m.diffuse_color=(*c,1); m.use_nodes=True; p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
white=mat('Warm pearl white',(.88,.91,.93),.18); yellow=mat('Racing yellow',(.96,.87,.004),.05); red=mat('Signal red',(.75,.012,.022)); black=mat('Slick rubber',(.012,.014,.018),0,.82); carbon=mat('Carbon suspension',(.024,.032,.04),.35,.35); silver=mat('Machined aluminium',(.53,.58,.62),.8,.25); glass=mat('Dark visor',(.025,.045,.075),.6,.16); blue=mat('Team blue',(.008,.09,.24)); wood=mat('Warm cedar',(.28,.13,.055),0,.85); seat=mat('Grandstand blue',(.03,.22,.38),.05,.5); concrete=mat('Concrete',(.43,.46,.48),0,.88); window=mat('Reflective dark windows',(.035,.07,.095),.65,.2); roof=mat('Light grey roof',(.65,.68,.69),.3,.7)
def finish(o,n,m):
 o.name=n;o.data.materials.append(m);return o
def box(n,loc,dim,m,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.dimensions=dim;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);finish(o,n,m)
 if bevel: mod=o.modifiers.new('Soft edges','BEVEL');mod.width=bevel;mod.segments=3;o.modifiers.new('Normals','WEIGHTED_NORMAL')
 return o
def uv(n,loc,scale,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=loc);o=bpy.context.object;o.scale=scale;finish(o,n,m)
 for f in o.data.polygons:f.use_smooth=True
 return o
def rod(n,a,b,r,m):
 a,b=Vector(a),Vector(b);bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=r,depth=(b-a).length,location=(a+b)/2);o=bpy.context.object;o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return finish(o,n,m)
def loft(n,sections,m):
 # sections: longitudinal y, half width, base, top; rounded octagonal cross sections
 vs=[]
 for y,w,b,t in sections:
  vs += [(-w*.7,y,b),(-w,y,b+.06),(-w,y,t-.08),(-w*.7,y,t),(w*.7,y,t),(w,y,t-.08),(w,y,b+.06),(w*.7,y,b)]
 fs=[tuple(range(7,-1,-1))]
 for j in range(len(sections)-1):
  for i in range(8):fs.append((j*8+i,j*8+(i+1)%8,(j+1)*8+(i+1)%8,(j+1)*8+i))
 fs.append(tuple(range((len(sections)-1)*8,len(sections)*8)))
 mesh=bpy.data.meshes.new(n);mesh.from_pydata(vs,[],fs);mesh.update();o=bpy.data.objects.new(n,mesh);bpy.context.collection.objects.link(o);finish(o,n,m);o.modifiers.new('Surface normals','WEIGHTED_NORMAL');return o
def text(n,s,loc,size,m,rot=(0,0,0)):
 bpy.ops.object.text_add(location=loc,rotation=rot);o=bpy.context.object;o.name=n;o.data.body=s;o.data.align_x='CENTER';o.data.size=size;o.data.extrude=.001;o.data.materials.append(m);bpy.ops.object.convert(target='MESH');return bpy.context.object
def torus(n,loc,major,minor,m,rot=(0,math.pi/2,0)):
 bpy.ops.mesh.primitive_torus_add(major_segments=48,minor_segments=12,location=loc,major_radius=major,minor_radius=minor,rotation=rot);o=bpy.context.object;finish(o,n,m)
 for p in o.data.polygons:p.use_smooth=True
 return o
# chassis overall length 5.20, span 2.00
box('Undertray',(0,-.12,.155),(1.36,3.6,.07),carbon,.045)
loft('Sculpted nose',[(.05,.30,.31,.70),(.70,.26,.32,.69),(1.44,.22,.33,.57),(2.05,.22,.34,.51),(2.20,.19,.34,.48)],white)
loft('Yellow nose tip',[(1.95,.222,.335,.535),(2.20,.222,.335,.50),(2.27,.18,.355,.47)],yellow)
# narrow red double stripe follows top of long white nose
for x in [-.065,.065]:
 verts=[]
 for y,z in [(.16,.704),(.70,.694),(1.44,.574),(1.94,.541)]:verts.extend([(x-.018,y,z),(x+.018,y,z)])
 me=bpy.data.meshes.new('stripe');me.from_pydata(verts,[],[(i,i+1,i+3,i+2) for i in range(0,6,2)]);o=bpy.data.objects.new('Twin red racing stripe',me);bpy.context.collection.objects.link(o);finish(o,o.name,red)
# cockpit rails and black open tub
uv('Cockpit inner tub',(0,-.30,.51),(.30,.50,.14),carbon)
for side in [-1,1]:
 o=loft('Cockpit white shoulder',[(.18,.105,.28,.66),(-.40,.12,.25,.70),(-.89,.15,.25,.68)],white);o.location.x=side*.29
 o=loft('Sculpted sidepod',[(.10,.27,.21,.57),(-.25,.36,.20,.62),(-.85,.37,.20,.61),(-1.35,.25,.23,.51),(-1.65,.16,.26,.46)],white);o.location.x=side*.50
 box('Sidepod intake',(side*.50,.095,.48),(.40,.025,.14),carbon,.035)
 # blue graphic on sidepod exterior, own branding
 box('Blue sidepod graphic',(side*.875,-.69,.40),(.006,.72,.15),blue,.003)
 text('Team side lettering','APEX',(side*.883,-.66,.38),.13,white,(math.pi/2,0,side*math.pi/2))
 rod('Mirror stalk',(side*.31,.05,.62),(side*.46,.02,.82),.016,silver)
 box('White mirror',(side*.48,.02,.83),(.19,.09,.10),white,.025)
 box('Mirror yellow stripe',(side*.48,.068,.83),(.13,.006,.035),yellow,.005)
# engine cover, airbox and rollover structure
loft('Engine cover', [(-.74,.26,.30,.78),(-1.05,.29,.28,1.03),(-1.35,.23,.26,.93),(-1.80,.12,.25,.62),(-2.05,.09,.25,.43)],white)
loft('Yellow engine spine',[(-.73,.17,.69,.93),(-.93,.21,.72,1.14),(-1.18,.18,.72,1.13),(-1.50,.10,.62,.87),(-1.85,.035,.43,.60)],yellow)
box('Airbox black opening',(0,-.725,.90),(.20,.02,.22),carbon,.045)
rod('Roll hoop',(-.19,-.79,.75),(-.13,-.91,1.1),.027,carbon);rod('Roll hoop right',(.19,-.79,.75),(.13,-.91,1.1),.027,carbon)
uv('Driver helmet',(0,-.39,.75),(.145,.16,.155),white);uv('Helmet visor',(0,-.275,.78),(.135,.055,.062),glass);torus('Helmet yellow band',(0,-.39,.755),.143,.012,yellow,(0,0,0))
rod('Steering column',(0,-.10,.49),(0,-.02,.68),.021,carbon)
torus('Steering wheel',(0,-.01,.68),.115,.022,carbon,(math.pi/2-.4,0,0));box('Steering centre',(0,-.01,.68),(.15,.032,.055),carbon,.015)
# multi element front wing, wide flat white main plane and endplates
box('Front wing main plane',(0,2.30,.145),(1.96,.52,.055),white,.025)
box('Front wing yellow leading edge',(0,2.56,.15),(1.97,.06,.065),yellow,.018)
for s in [-1,1]:
 box('Front wing upper flap',(s*.65,2.13,.225),(.61,.25,.045),white,.018)
 box('Front wing red trailing edge',(s*.65,2.01,.25),(.61,.028,.038),red,.006)
 box('Front wing endplate',(s*.978,2.30,.25),(.035,.55,.25),white,.02)
 box('Endplate yellow accent',(s*.999,2.40,.18),(.008,.34,.05),yellow)
 rod('Nose wing pylon',(s*.14,2.10,.36),(s*.14,2.17,.17),.035,white)
 text('Wing branding','APEX',(s*.65,2.30,.181),.095,blue)
# rear wing with vertical plates and red line
box('Rear wing',(0,-2.27,.99),(1.66,.43,.065),white,.03)
box('Rear wing yellow lip',(0,-2.48,1.0),(1.67,.045,.07),yellow,.012)
box('Rear wing lower element',(0,-2.13,.88),(1.59,.32,.05),white,.015)
for s in [-1,1]:
 box('Rear wing endplate',(s*.83,-2.25,.82),(.038,.53,.47),white,.018)
 box('Rear wing red detail',(s*.852,-2.25,.88),(.008,.44,.038),red)
 rod('Rear wing pylon',(s*.22,-1.96,.30),(s*.22,-2.19,.95),.035,carbon)
text('Rear wing team','APEX RACING',(0,-2.25,1.028),.13,blue)
# wheel empties preserve pivot for game steering/spin. suspension remains chassis-owned.
for suffix,x,y,width in [('FL',-.81,1.38,.31),('FR',.81,1.38,.31),('RL',-.80,-1.45,.38),('RR',.80,-1.45,.38)]:
 z=.36; side=1 if x>0 else -1
 bpy.ops.object.empty_add(type='PLAIN_AXES',location=(x,y,z));pivot=bpy.context.object;pivot.name='Wheel_'+suffix
 before=set(bpy.context.scene.objects)
 # tire modeled as smooth bevel cylinder rather than donut
 bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=.36,depth=width,location=(x,y,z),rotation=(0,math.pi/2,0));o=bpy.context.object;finish(o,'Tyre_'+suffix,black);bev=o.modifiers.new('Rounded tyre shoulders','BEVEL');bev.width=.045;bev.segments=4;o.modifiers.new('Tyre normals','WEIGHTED_NORMAL')
 for p in o.data.polygons:p.use_smooth=True
 for face in [-1,1]:
  xx=x+face*(width/2+.001)
  torus('Yellow sidewall_'+suffix,(xx,y,z),.306,.009,yellow)
  rod('Rim inset',(xx-face*.012,y,z),(xx+face*.006,y,z),.218,carbon)
  torus('Rim lip_'+suffix,(xx+face*.01,y,z),.216,.012,silver)
  rod('Wheel hub',(xx,y,z),(xx+face*.022,y,z),.052,silver)
  for j in range(10):
   a=j*2*math.pi/10
   rod('Alloy spoke',(xx+face*.012,y+.055*math.cos(a),z+.055*math.sin(a)),(xx+face*.012,y+.202*math.cos(a+.12),z+.202*math.sin(a+.12)),.013,silver)
 for o in set(bpy.context.scene.objects)-before:
  o.parent=pivot;o.matrix_parent_inverse=pivot.matrix_world.inverted()
 for dy in [-.32,.32]:
  for h in [.27,.47]:rod('Wishbone '+suffix,(side*.25,y+dy,h),(x,y,.36),.016,carbon)
 rod('Pushrod '+suffix,(side*.24,y+.15,.62),(x,y,.30),.019,silver)
# exhaust and rear diffuser
rod('Exhaust',(0,-1.76,.48),(0,-2.10,.46),.052,silver)
for x in [-.5,-.25,0,.25,.5]:box('Diffuser fin',(x,-1.85,.16),(.022,.65,.19),carbon)
# export and document car before preview extras
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/car.blend')
def export(path):
 # Batch static mesh parts while preserving four animation pivot groups.
 groups={}
 for obj in list(bpy.context.scene.objects):
  if obj.type=='MESH': groups.setdefault(obj.parent,[]).append(obj)
 for parent,objects in groups.items():
  bpy.ops.object.select_all(action='DESELECT')
  for obj in objects: obj.select_set(True)
  for obj in objects:
   bpy.context.view_layer.objects.active=obj
   for mod in list(obj.modifiers): bpy.ops.object.modifier_apply(modifier=mod.name)
  bpy.context.view_layer.objects.active=objects[0]
  bpy.ops.object.join()
  bpy.context.object.name=(parent.name+'_Geometry') if parent else 'Static_Geometry'
 bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=path,export_format='GLB',export_yup=True,use_selection=True,export_apply=True)
export(OUT+'/car.glb')
# studio preview
box('Preview ground',(0,0,-.035),(200,200,.05),concrete)
bpy.ops.object.camera_add(location=(5.8,7.8,3.8));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.55))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=6.6;bpy.context.scene.camera=cam
for loc,power,size in [((1,4,7),1400,5),((-4,-1,5),1100,4),((2,-5,4),900,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.samples=24;sc.cycles.use_denoising=False;sc.render.resolution_x=1200;sc.render.resolution_y=900;sc.render.resolution_percentage=100;sc.world.color=(.2,.2,.2);sc.render.filepath=OUT+'/car-preview.png';bpy.ops.render.render(write_still=True)
# modular buildings
def clear():bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
clear()
box('Stand foundation',(0,0,.12),(12,5.4,.24),concrete)
for row in range(7):
 y=-1.9+row*.66;z=.28+row*.43
 box('Terrace '+str(row),(0,y,z/2),(11.6,.68,z),concrete)
 box('Wood step fascia',(0,y-.34,z-.09),(11.6,.035,.18),wood)
 for col in range(22):
  x=-5.25+col*.50
  if col in [7,14]:continue
  box('Blue seat',(x,y,z+.17),(.42,.40,.11),seat,.04)
  box('Blue backrest',(x,y+.16,z+.38),(.42,.085,.38),seat,.045)
  box('Seat white marker',(x,y+.113,z+.50),(.065,.008,.08),white)
for x in [-5.7,-1.9,1.9,5.7]:
 rod('Roof structural column',(x,2.30,0),(x,2.30,4.65),.085,silver)
 rod('Sloped roof bearer',(x,-2.8,4.15),(x,2.60,4.65),.09,wood)
box('Wood rear wall',(0,2.57,2.55),(12,.15,4.5),wood)
for z in [i*.15+.35 for i in range(29)]:box('Horizontal cedar trim',(0,2.48,z),(12,.018,.025),carbon)
o=box('Canopy wood roof',(0,0,4.46),(12.6,6.1,.20),wood);o.rotation_euler.x=math.atan(.5/5.4)
box('Dark roof front fascia',(0,-3.04,4.21),(12.65,.10,.25),carbon)
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/grandstand.blend');export(OUT+'/grandstand.glb')
clear()
box('Pit apron',(0,-1,.07),(12.4,7,.14),concrete)
box('Rear wall',(0,2.4,2.6),(12,.22,5.2),wood)
for x in [-5.9,5.9]:box('Side wall',(x,0,2.6),(.20,4.8,5.2),wood)
box('Second floor',(0,0,2.9),(12,4.8,.25),concrete)
box('Upper front wood',(0,-2.4,4.45),(12,.20,1.45),wood)
box('Flat pale roof',(0,0,5.28),(12.6,5.4,.22),roof,.025)
for i in range(4):
 x=-4.5+i*3
 box('Garage dark interior',(x,2.25,1.45),(2.7,.05,2.65),carbon)
 box('Garage lintel',(x,-2.41,2.72),(2.75,.15,.28),wood)
 box('Garage yellow number',(x,-2.50,2.78),(.5,.025,.22),yellow)
 text('Garage number',str(i+1),(x,-2.525,2.72),.16,carbon,(math.pi/2,0,0))
 box('Upper dark glazing',(x,-2.515,4.22),(2.75,.04,.90),window)
 for off in [-1.35,0,1.35]:box('Window mullion',(x+off,-2.56,4.22),(.035,.03,.93),silver)
for x in [-6,-3,0,3,6]:box('Garage pier',(x,-2.35,1.45),(.22,.30,2.9),white)
for z in [3.1+i*.13 for i in range(16)]:
 if 3.75<z<4.7:continue
 box('Facade cedar strips',(0,-2.515,z),(12,.018,.018),carbon)
box('Pit sign panel',(0,-2.54,3.25),(7,.06,.40),blue)
text('Pit team name','APEX MOTORSPORT',(0,-2.58,3.13),.27,white,(math.pi/2,0,0))
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/pit-building.blend');export(OUT+'/pit-building.glb')
print('ASSETS_COMPLETE')
