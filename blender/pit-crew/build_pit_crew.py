import bpy,math,os,json
from mathutils import Vector
OUT=os.path.dirname(os.path.abspath(__file__))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(n,c,metal=0,rough=.5):
 m=bpy.data.materials.new(n);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
suit=mat('Ivory Nomex woven suit',(.69,.71,.70),0,.78);seam=mat('Stitched grey seam',(.29,.32,.34),0,.8);yellow=mat('Racing yellow trim',(.88,.67,.015),.07,.43);red=mat('Scarlet identifying stripe',(.53,.012,.018),.05,.48);black=mat('Black leather and rubber',(.018,.022,.027),0,.65);helmet=mat('Warm white helmet shell',(.86,.87,.83),.18,.25);visor=mat('Blue black mirrored visor',(.012,.034,.046),.8,.12);steel=mat('Brushed tool steel',(.45,.52,.55),.86,.24);carbon=mat('Equipment graphite',(.045,.053,.06),.65,.36)
def finish(o,n,m):o.name=n;o.data.materials.append(m);return o
def mesh(n,vs,fs,m):
 me=bpy.data.meshes.new(n);me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new(n,me);bpy.context.collection.objects.link(o);finish(o,n,m)
 for p in me.polygons:p.use_smooth=True
 return o
def uv(n,p,scale,m,segments=24,rings=12):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=p);o=bpy.context.object;o.scale=scale;return finish(o,n,m)
def box(n,p,d,m,b=.01):
 bpy.ops.mesh.primitive_cube_add(size=1,location=p);o=bpy.context.object;o.dimensions=d;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);finish(o,n,m)
 if b:mod=o.modifiers.new('Manufactured bevel','BEVEL');mod.width=b;mod.segments=2;o.modifiers.new('Surface normal','WEIGHTED_NORMAL')
 return o
def rod(n,a,b,r,m,vertices=12):
 a,b=Vector(a),Vector(b);bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=(b-a).length,location=(a+b)/2);o=bpy.context.object;o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();finish(o,n,m)
 for p in o.data.polygons:p.use_smooth=True
 return o
def tube(n,pts,r,m):
 cu=bpy.data.curves.new(n,'CURVE');cu.dimensions='3D';cu.bevel_depth=r;cu.bevel_resolution=1;sp=cu.splines.new('POLY');sp.points.add(len(pts)-1)
 for p,co in zip(sp.points,pts):p.co=(*co,1)
 o=bpy.data.objects.new(n,cu);bpy.context.collection.objects.link(o);finish(o,n,m);return o
def section(n,levels,m,N=20):
 vs=[]
 for z,x,y,w,d in levels:
  for k in range(N):a=k*2*math.pi/N;vs.append((x+w*math.cos(a),y+d*math.sin(a),z))
 fs=[tuple(range(N-1,-1,-1))]
 for j in range(len(levels)-1):
  for k in range(N):fs.append((j*N+k,j*N+(k+1)%N,(j+1)*N+(k+1)%N,(j+1)*N+k))
 fs.append(tuple(range((len(levels)-1)*N,len(levels)*N)));return mesh(n,vs,fs,m)
def limb(n,a,b,r1,r2):
 a,b=Vector(a),Vector(b);axis=(b-a).normalized();u=axis.cross(Vector((0,1,0))).normalized();v=axis.cross(u);vs=[];N=14
 # subtle controlled cloth folds instead of smooth toy capsules
 for t,scale in [(0,.83),(.08,1),(.25,1.04),(.5,.97),(.72,1.06),(.83,.96),(.9,1.05),(1,.82)]:
  r=(r1*(1-t)+r2*t)*scale;co=a.lerp(b,t)
  for k in range(N):ang=k*2*math.pi/N;vs.append(tuple(co+r*math.cos(ang)*u+r*.9*math.sin(ang)*v))
 fs=[tuple(range(N-1,-1,-1))]
 for j in range(7):
  for k in range(N):fs.append((j*N+k,j*N+(k+1)%N,(j+1)*N+(k+1)%N,(j+1)*N+k))
 fs.append(tuple(range(7*N,8*N)));mesh(n,vs,fs,suit)
 tube(n+' stitched outside seam',[tuple(a.lerp(b,t)+u*(r1*(1-t)+r2*t)*1.01) for t in [0,.25,.5,.75,1]],.0035,seam)
def glove(p):
 x,y,z=p;uv('Leather glove palm',p,(.048,.07,.032),black,16,8)
 for i in range(4):uv('Gloved finger',(x-.031+i*.021,y-.052,z-.006),(.011,.042,.016),black,12,6)
 uv('Glove thumb',(x+.049,y-.008,z-.008),(.021,.039,.02),black,12,6)
def head(z,y=0):
 # helmet shell follows anthropometric head rather than an oversized sphere
 uv('Balaclava neck',(0,y,z-.17),(.073,.07,.11),black)
 section('Sculpted full face helmet',[(z-.13,0,y-.008,.094,.10),(z-.09,0,y-.025,.119,.127),(z,0,y,.124,.128),(z+.1,0,y+.004,.107,.112),(z+.155,0,y+.009,.063,.071),(z+.17,0,y+.01,.012,.018)],helmet,32)
 # Curved wraparound visor patch on the forward -Y surface
 vs=[];fs=[];N=24
 for zz in [-.015,.061]:
  for k in range(N+1):a=-1.15+2.3*k/N;vs.append((.121*math.sin(a),y-.132*math.cos(a)-.009,z+zz))
 for k in range(N):fs.append((k,k+1,N+2+k,N+1+k))
 mesh('Curved smoked face visor',vs,fs,visor)
 for zz in [-.02,.065]:tube('Visor rubber edge',[(.123*math.sin(-1.15+2.3*k/N),y-.132*math.cos(-1.15+2.3*k/N)-.011,z+zz) for k in range(N+1)],.004,black)
 tube('Helmet yellow crown stripe',[(0,y-.12,z+.07),(0,y-.10,z+.12),(0,y-.05,z+.161),(0,y+.02,z+.174),(0,y+.095,z+.11)],.012,yellow)
 for side in [-1,1]:uv('Visor pivot',(side*.116,y-.047,z+.025),(.012,.016,.016),steel,12,8)
 box('Chin vent',(0,y-.148,z-.082),(.08,.008,.016),black,.003)
def torso(hip,shoulder):
 hy,hz=hip;sy,sz=shoulder
 section('Tailored fire suit torso',[(hz-.08,0,hy,.153,.105),(hz+.02,0,hy,.163,.111),(hz+.13,0,hy-.015,.15,.10),(sz-.16,0,sy,.191,.122),(sz-.045,0,sy,.219,.108),(sz+.015,0,sy,.16,.095)],suit)
 tube('Front zip',[(0,hy-.114,hz),(0,sy-.126,sz-.15),(0,sy-.101,sz)],.005,seam)
 for side in [-1,1]:
  tube('Red suit side piping',[(side*.155,hy-.04,hz),(side*.185,sy-.08,sz-.13),(side*.21,sy-.04,sz-.02)],.007,red)
  box('Yellow shoulder epaulette',(side*.17,sy-.01,sz+.018),(.08,.14,.018),yellow,.007)
  box('Chest pocket',(side*.105,sy-.12,sz-.16),(.105,.012,.072),suit,.008)
 box('Chest identity patch',(-.105,sy-.131,sz-.16),(.075,.006,.027),yellow,.003)
 tube('Waist suit belt',[(-.15,hy-.09,hz+.03),(0,hy-.118,hz+.03),(.15,hy-.09,hz+.03)],.017,black)
def person(n,pos,pose,turn=0):
 before=set(bpy.context.scene.objects)
 if pose=='crouch':
  hip=(.11,.69);shoulder=(-.04,1.10);legs=[((-.14,.10,.70),(-.22,-.26,.40),(-.25,-.15,.12)),((.14,.1,.70),(.21,.30,.38),(.25,.40,.12))];arms=[((-.21,-.04,1.08),(-.29,-.28,.88),(-.16,-.51,.85)),((.21,-.04,1.08),(.28,-.30,.90),(.12,-.52,.86))];hz=1.28;hy=-.09
 elif pose=='tyre':
  hip=(.02,.97);shoulder=(-.08,1.48);legs=[((-.13,.02,.97),(-.17,-.02,.57),(-.20,-.04,.12)),((.13,.02,.97),(.17,.13,.56),(.22,.17,.12))];arms=[((-.21,-.08,1.46),(-.31,-.23,1.20),(-.24,-.42,.88)),((.21,-.08,1.46),(.33,-.23,1.20),(.24,-.42,.88))];hz=1.65;hy=-.10
 else:
  hip=(.05,.97);shoulder=(-.03,1.48);legs=[((-.13,.05,.97),(-.18,-.10,.57),(-.22,-.22,.12)),((.13,.05,.97),(.17,.21,.57),(.20,.32,.12))];arms=[((-.21,-.03,1.46),(-.30,-.23,1.20),(-.15,-.48,1.13)),((.21,-.03,1.46),(.30,-.24,1.20),(.15,-.48,1.13))];hz=1.65;hy=-.06
 torso(hip,shoulder);head(hz,hy)
 for a,b,c in legs:
  limb('Trouser thigh',a,b,.105,.087);limb('Trouser calf',b,c,.086,.060)
  uv('Reinforced knee',(b[0],b[1]-.065,b[2]),(.077,.036,.08),seam,16,8)
  box('Racing boot',(c[0],c[1]-.065,.095),(.14,.27,.14),black,.035);box('Boot sole',(c[0],c[1]-.07,.035),(.145,.275,.032),black,.012)
 for a,b,c in arms:
  limb('Upper sleeve',a,b,.075,.061);limb('Forearm sleeve',b,c,.063,.043);glove(c)
 if pose=='crouch':
  rod('Wheelgun aluminium motor',(-.13,-.54,.87),(.16,-.54,.87),.051,steel,20);rod('Wheelgun socket',(.16,-.54,.87),(.26,-.54,.87),.024,steel);box('Wheelgun grip',(0,-.54,.80),(.05,.055,.13),carbon,.013)
  tube('Pneumatic hose',[(0,-.53,.74),(.12,-.6,.42),(.23,-.4,.20),(.40,-.15,.17),(.44,.4,.17),(.25,.65,.17)],.012,black)
 elif pose=='tyre':
  # tyre held upright, axle Y; diameter 0.67m
  prof=[(-.16,.205),(-.175,.25),(-.15,.315),(-.115,.335),(.115,.335),(.15,.315),(.175,.25),(.16,.205)];vs=[];fs=[];N=48
  for yy,r in prof:
   for k in range(N):a=k*2*math.pi/N;vs.append((r*math.sin(a),-.42+yy,.65+r*math.cos(a)))
  for j in range(8):
   for k in range(N):fs.append((j*N+k,j*N+(k+1)%N,((j+1)%8)*N+(k+1)%N,((j+1)%8)*N+k))
  mesh('Fresh slick tyre',vs,fs,black)
  tube('Tyre yellow sidewall ring',[(.278*math.sin(k*2*math.pi/48),-.589,.65+.278*math.cos(k*2*math.pi/48)) for k in range(49)],.004,yellow)
 else:
  rod('Front jack long handle',(0,-.48,1.13),(0,-1.04,.23),.022,steel)
  rod('Jack crossbar grip',(-.23,-.48,1.13),(.23,-.48,1.13),.025,black)
  box('Low profile racing jack',(0,-1.05,.22),(.36,.52,.09),carbon,.025)
  for side in [-1,1]:
   rod('Jack pivot wheel',(side*.18-.04,-1.15,.22),(side*.18+.04,-1.15,.22),.105,black,24)
   rod('Jack forward lifting fork',(side*.11,-1.05,.24),(side*.11,-1.50,.21),.025,steel)
  box('Jack padded lifting nose',(0,-1.50,.24),(.38,.08,.06),yellow,.014)
 # Everything built relative to each person's root, then positioned on the apron.
 for o in set(bpy.context.scene.objects)-before:
  o.name=n+' | '+o.name
  o.location.rotate(__import__('mathutils').Euler((0,0,turn)));o.location+=Vector(pos);o.rotation_euler.z+=turn
# Crew roots in Blender coordinates. All sit outside the entire open 0<X<3 corridor.
person('Jack operator',(-4.50,-2.55,.15),'jack',-.10)
person('Wheelgun technician',(-1.60,-2.65,.15),'crouch',.12)
person('Tyre handler',(4.48,-2.55,.15),'tyre',-.12)
# Save component-level editable source, then bake/merge export draw calls.
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/pit-crew-editable.blend')
for o in list(bpy.context.scene.objects):
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 if o.type=='CURVE':bpy.ops.object.convert(target='MESH')
 if o.type=='MESH':
  for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
for m in list(bpy.data.materials):
 obs=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.data.materials and o.data.materials[0]==m]
 if not obs:continue
 bpy.ops.object.select_all(action='DESELECT')
 for o in obs:o.select_set(True)
 bpy.context.view_layer.objects.active=obs[0];bpy.ops.object.join();obs[0].name='Crew | '+m.name;bpy.context.scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];coords=[o.matrix_world@v.co for o in meshes for v in o.data.vertices];clear=sum(1 for p in coords if 0<p.x<3);assert clear==0
tri=sum(len(p.vertices)-2 for o in meshes for p in o.data.polygons);assert tri<60000
bounds={'min':[min(p[i] for p in coords) for i in range(3)],'max':[max(p[i] for p in coords) for i in range(3)]}
bpy.ops.export_scene.gltf(filepath=OUT+'/pit-crew.glb',export_format='GLB',export_yup=True)
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/pit-crew.blend')
json.dump({'triangles':tri,'draw_calls':len(meshes),'bounds_blender':bounds,'clear_corridor_vertices':clear,'placement':{'world_position':[241,0,-75],'rotation_y':-math.pi/2},'blender_person_roots':[[-4.5,-2.55,.15],[-1.6,-2.65,.15],[4.48,-2.55,.15]],'clear_corridor':'Entire local X=0..3 (world Z=-75..-72), no crew or equipment'},open(OUT+'/verification.json','w'),indent=2)
# Preview only: floor and neutral backdrop excluded from delivered asset.
floor=mat('Preview asphalt',(.14,.16,.17),0,.9);box('RENDER ONLY ground',(0,-1,0),(13,10,.25),floor,.01)
bpy.ops.object.camera_add(location=(8,-11,4.7));o=bpy.context.object;o.rotation_euler=(Vector((0,-2.8,.9))-o.location).to_track_quat('-Z','Y').to_euler();o.data.type='ORTHO';o.data.ortho_scale=11.7;bpy.context.scene.camera=o
for pos,power,size in [((1,-7,7),1800,6),((-6,-2,5),1300,4),((3,3,5),1800,5)]:
 bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,-2.6,1))-o.location).to_track_quat('-Z','Y').to_euler()
sc=bpy.context.scene;sc.world.color=(.27,.27,.27);sc.render.engine='CYCLES';sc.cycles.samples=24;sc.cycles.use_denoising=False;sc.render.resolution_x=1300;sc.render.resolution_y=650;sc.render.resolution_percentage=100;sc.render.filepath=OUT+'/pit-crew-preview.png'
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/pit-crew-preview.blend');bpy.ops.render.render(write_still=True)
print('CREW VERIFIED',tri,len(meshes),bounds)
