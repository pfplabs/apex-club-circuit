import bpy, math, os, json
from mathutils import Vector
OUT=os.path.dirname(os.path.abspath(__file__))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(n,c,metal=0,rough=.4,emit=0):
 m=bpy.data.materials.new(n);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if emit:p.inputs['Emission Color'].default_value=(*c,1);p.inputs['Emission Strength'].default_value=emit
 return m
red=mat('Baked crimson cabinet enamel',(.48,.012,.018),.45,.27);dark=mat('Powder coated graphite',(.036,.043,.047),.55,.4);rubber=mat('Satin slick rubber',(.016,.018,.020),.0,.72);silver=mat('Brushed aluminium',(.54,.60,.64),.86,.27);white=mat('Warm porcelain wall',(.77,.75,.69),.04,.6);floor=mat('Grey epoxy floor',(.24,.26,.26),.12,.42);paint=mat('Ivory floor marking',(.79,.77,.66),.02,.65);yellow=mat('Safety ochre',(.8,.48,.025),.15,.45);led=mat('Warm white LED diffuser',(1,.88,.69),0,.26,4);blue=mat('Screen blue',(.015,.10,.17),.35,.22,1)
def finish(o,n,m):
 o.name=n;o.data.materials.append(m);return o
def box(n,loc,dim,m,b=.0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.dimensions=dim;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);finish(o,n,m)
 if b:
  mod=o.modifiers.new('Rounded manufactured edges','BEVEL');mod.width=b;mod.segments=1
  o.modifiers.new('Weighted face normals','WEIGHTED_NORMAL')
 return o
def rod(n,a,b,r,m,v=12):
 a,b=Vector(a),Vector(b);bpy.ops.mesh.primitive_cylinder_add(vertices=v,radius=r,depth=(b-a).length,location=(a+b)/2);o=bpy.context.object;o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();finish(o,n,m)
 for p in o.data.polygons:p.use_smooth=True
 return o
def path(n,pts,r,m):
 cu=bpy.data.curves.new(n,'CURVE');cu.dimensions='3D';cu.bevel_depth=r;cu.bevel_resolution=1;sp=cu.splines.new('POLY');sp.points.add(len(pts)-1)
 for p,co in zip(sp.points,pts):p.co=(*co,1)
 o=bpy.data.objects.new(n,cu);bpy.context.collection.objects.link(o);finish(o,n,m);return o
def tyre(x,y,z):
 # Revolved rounded shoulder slick with hollow centre, upright axle along X.
 prof=[(-.16,.205),(-.175,.25),(-.155,.315),(-.12,.335),(.12,.335),(.155,.315),(.175,.25),(.16,.205)]
 vs=[];fs=[];N=24
 for a,r in prof:
  for k in range(N):t=k*2*math.pi/N;vs.append((x+a,y+r*math.sin(t),z+r*math.cos(t)))
 for j in range(len(prof)):
  for k in range(N):fs.append((j*N+k,j*N+(k+1)%N,((j+1)%len(prof))*N+(k+1)%N,((j+1)%len(prof))*N+k))
 me=bpy.data.meshes.new('Slick carcass');me.from_pydata(vs,[],fs);me.update();o=bpy.data.objects.new('Slick tyre',me);bpy.context.collection.objects.link(o);finish(o,o.name,rubber)
 for p in me.polygons:p.use_smooth=True
 # Thin sidewall identification stripe, physically sized.
 for side in [-1,1]:
  pts=[(x+side*.168,y+.275*math.sin(k*2*math.pi/32),z+.275*math.cos(k*2*math.pi/32)) for k in range(33)];path('Sidewall ring',pts,.004,yellow)
def chest(x,y,w=1.2):
 box('Rolling tool chest carcass',(x,y,.68),(w,.55,.94),dark,.022)
 box('Red side shell',(x,y,.69),(w+.025,.52,.9),red,.018)
 for i in range(6):
  z=.315+i*.132;box('Individual drawer face',(x,y-.274,z),(w-.07,.032,.113),red,.008);box('Drawer handle',(x,y-.299,z+.023),(w-.15,.036,.017),silver,.005)
 box('Black rubber worktop',(x,y,1.185),(w+.05,.61,.055),rubber,.015)
 for xx in [x-w*.39,x+w*.39]:
  for yy in [y-.18,y+.18]:
   rod('Caster chrome fork',(xx,yy,.14),(xx,yy,.23),.026,silver);rod('Caster rubber wheel',(xx-.035,yy,.14),(xx+.035,yy,.14),.078,rubber,16)
 rod('Side push handle',(x+w*.52,y-.16,1.03),(x+w*.52,y+.16,1.03),.019,silver)
 box('Drawer identification label',(x-w*.32,y-.297,.98),(.10,.005,.025),paint)
# Existing module front Blender Y=-2.4, back +2.4. glTF front +Z.
for ix,x in enumerate([-4.5,-1.5,1.5,4.5]):
 box('Epoxy bay floor',(x,-.05,.151),(2.76,4.42,.022),floor)
 box('Warm white rear liner',(x,2.195,1.46),(2.74,.04,2.60),white)
 box('Dark stainless skirting',(x,2.16,.26),(2.74,.04,.18),silver)
 for xx in [x-1.22,x+1.22]:box('Painted bay guide',(xx,-.25,.166),(.045,3.9,.005),paint)
 box('Drain channel',(x,-2.13,.17),(2.65,.15,.025),dark,.005)
 for i in range(41):box('Drain grate crossbar',(x-1.28+i*.064,-2.13,.188),(.018,.13,.008),silver)
 for xx in [x-.85,x+.85]:
  box('Ceiling LED housing',(xx,-.05,2.73),(.11,3.8,.06),silver,.012);box('LED diffuser',(xx,-.05,2.694),(.075,3.73,.016),led,.005)
 # Wall seam and protected conduit
 rod('Wall service conduit',(x-1.28,2.13,.4),(x-1.28,2.13,2.5),.016,silver)
 box('Wall service panel',(x-1.14,2.12,1.45),(.20,.06,.3),dark,.015)
 if ix==2:continue # Leave local X=+1.5 bay clear: world Z=-73.5 after rotation Y=-PI/2
 chest(x-.61,1.82,1.18)
 box('Wall cabinet shell',(x-.60,2.02,2.02),(1.22,.28,.50),red,.018)
 for off in [-.30,.30]:
  box('Wall cupboard door',(x-.60+off,1.866,2.02),(.58,.025,.46),red,.008);box('Cupboard pull',(x-.60+off+.18,1.841,1.99),(.018,.023,.19),silver,.005)
 # Side wheel rack, two shelves, four spare tyres, open support structure
 rx=x+.73
 for xx in [rx-.42,rx+.42]:
  for yy in [1.42,2.02]:box('Rack upright',(xx,yy,.95),(.035,.035,1.6),dark,.006)
 for zz in [.39,1.18]:
  for yy in [1.43,2.01]:rod('Wheel rack crossrail',(rx-.43,yy,zz),(rx+.43,yy,zz),.023,silver)
  for xx in [rx-.22,rx+.20]:tyre(xx,1.72,zz+.315)
 # Worktop equipment: laptop, charger, sockets
 box('Diagnostic laptop keyboard',(x-.63,1.68,1.23),(.36,.26,.025),silver,.01)
 box('Diagnostic screen shell',(x-.63,1.80,1.39),(.36,.025,.28),dark,.008)
 box('Diagnostic blue display',(x-.63,1.784,1.39),(.32,.003,.235),blue)
 for k in range(3):box('Screen telemetry trace',(x-.64,1.780,1.34+k*.047),(.25-k*.035,.002,.006),led)
 for k in range(3):rod('Machined socket',(x-.99+k*.09,1.62,1.22),(x-.99+k*.09,1.62,1.28),.023,silver)
 # Overhead swinging service boom and coiled air line at side, not driving space
 bx=x+1.18
 rod('Boom vertical mount',(bx,2.08,1.9),(bx,2.08,2.6),.035,silver)
 rod('Boom arm',(bx,2.08,2.58),(bx,-.65,2.58),.036,silver)
 rod('Boom diagonal brace',(bx,2.08,2.2),(bx,1.2,2.58),.018,silver)
 pts=[]
 for k in range(121):
  t=k/120;pts.append((bx+.055*math.sin(t*math.pi*24),-.65+.055*math.cos(t*math.pi*24),2.53-t*1.33))
 path('Coiled pneumatic hose',pts,.009,dark);rod('Air gun steel coupler',(bx,-.65,1.09),(bx,-.65,1.2),.022,silver);box('Pneumatic wrench body',(bx,-.65,1.04),(.13,.07,.11),silver,.02)
# Export baked geometry batched into a single object per material.
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
 bpy.context.view_layer.objects.active=obs[0];bpy.ops.object.join();obs[0].name='Pit detail | '+m.name
 bpy.context.scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];tris=sum(len(p.vertices)-2 for o in meshes for p in o.data.polygons)
coords=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box];mins=[min(v[i] for v in coords) for i in range(3)];maxs=[max(v[i] for v in coords) for i in range(3)]
clear_count=sum(1 for o in meshes if o.data.materials[0] in [red,rubber,blue] for v in o.data.vertices if 0.13 < (o.matrix_world@v.co).x < 2.87)
assert clear_count == 0, 'Equipment blocks clear parking bay'
bpy.ops.export_scene.gltf(filepath=OUT+'/pit-props.glb',export_format='GLB',export_yup=True,export_materials='EXPORT')
with open(OUT+'/verification.json','w') as f:json.dump({'triangles':tris,'draw_calls':len(meshes),'blender_bounds':{'min':mins,'max':maxs},'clear_bay_center_x':1.5,'clear_bay_world_z':-73.5,'equipment_vertices_in_clear_bay':clear_count,'gltf_front':'+Z','placement':'Same origin and rotation as pit-building. Rotation Y=-PI/2 at world x241 z-75. Clear bay x=+1.5 (world z=-73.5); no equipment there. Floor front glTF z2.26, back -2.22. A 5.1m car must extend onto apron because existing interior is only 4.6m deep.'},f,indent=2)
# Close-up render, no scene lights or cameras included in GLB.
sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.samples=24;sc.cycles.use_denoising=False;sc.world.color=(.24,.24,.24)
# Render-only roof produces credible garage shadowing.
box('RENDER ONLY ceiling',(0,0,2.86),(12,4.5,.16),white)
for x in [-4.5,-1.5,1.5,4.5]:
 bpy.ops.object.light_add(type='AREA',location=(x,0,2.66));o=bpy.context.object;o.data.energy=150;o.data.shape='RECTANGLE';o.data.size=2;o.data.size_y=3.5
bpy.ops.object.light_add(type='AREA',location=(0,-5,6));o=bpy.context.object;o.data.energy=1700;o.data.size=7;o.rotation_euler=(Vector((0,1,1))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(-1.9,-5.1,2.3));o=bpy.context.object;o.rotation_euler=(Vector((1.5,.7,1.2))-o.location).to_track_quat('-Z','Y').to_euler();o.data.lens=36;sc.camera=o
sc.render.resolution_x=1000;sc.render.resolution_y=680;sc.render.resolution_percentage=100;sc.render.filepath=OUT+'/pit-props-closeup.png'
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/pit-props.blend')
if os.environ.get('SKIP_RENDER') != '1': bpy.ops.render.render(write_still=True)
print('VERIFIED',tris,'triangles',len(meshes),'draw calls',mins,maxs)
