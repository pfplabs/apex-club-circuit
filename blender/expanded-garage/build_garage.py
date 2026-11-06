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
# Expanded 12m module: two 6m bays, 12m nominal structural depth.
wood=mat('Warm cedar',(.95,.95,.95),0,.72)
wood2=mat('Cedar alternating boards',(.90,.90,.90),0,.73)
wood3=mat('Cedar pale grain boards',(.98,.98,.98),0,.77)
glass=mat('Office blue grey glazing',(.042,.087,.11),.67,.19)
roof=mat('Light silver roof',(.55,.59,.6),.52,.49)
bluefascia=mat('Midnight blue team fascia',(.008,.065,.14),.25,.38)
concrete=mat('Smooth concrete architecture',(.5,.52,.50),0,.85)

def label(n,s,loc,size,m):
 bpy.ops.object.text_add(location=loc,rotation=(math.pi/2,0,0));o=bpy.context.object;o.name=n;o.data.body=s;o.data.align_x='CENTER';o.data.size=size;o.data.extrude=.0007;o.data.materials.append(m);bpy.ops.object.convert(target='MESH');return bpy.context.object

def clear():
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)

def batch_save(name):
 # Editable component scene with original object names and modifiers.
 bpy.ops.wm.save_as_mainfile(filepath=OUT+'/'+name+'-editable.blend')
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
  bpy.context.view_layer.objects.active=obs[0];bpy.ops.object.join();obs[0].name=name+' | '+m.name
  bpy.context.scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];tri=sum(len(p.vertices)-2 for o in meshes for p in o.data.polygons)
 vs=[o.matrix_world@v.co for o in meshes for v in o.data.vertices]
 result={'triangles':tri,'draw_calls':len(meshes),'blender_bounds':{'min':[min(p[i] for p in vs) for i in range(3)],'max':[max(p[i] for p in vs) for i in range(3)]}}
 bpy.ops.export_scene.gltf(filepath=OUT+'/'+name+'.glb',export_format='GLB',export_yup=True)
 bpy.ops.wm.save_as_mainfile(filepath=OUT+'/'+name+'.blend')
 return result

# ARCHITECTURE -----------------------------------------------------------
box('Continuous garage floor slab',(0,0,.07),(12,12,.14),concrete)
box('Apron extension',(0,-6.8,.07),(12,1.6,.14),concrete)
# Structural front plane exactly Blender Y=-6 -> world X=238.5.
for x in [-6,0,6]:
 box('Six metre bay structural pier',(x,-5.84,1.825),(.24,.32,3.37),white,.018)
 box('Pier impact plinth',(x,-5.82,.40),(.26,.33,.52),dark,.012)
for x in [-5.91,5.91]:box('Full depth exterior wall',(x,0,3.13),(.18,12,6.0),wood)
box('Rear external wall',(0,5.9,3.13),(12,.20,6.0),wood)
box('Upper office floor and garage ceiling',(0,0,3.60),(12,12,.2),white)
# Interior washable wall lining, with no center divider stealing working space.
for x in [-5.805,5.805]:
 box('Interior side wall lining',(x,.02,1.845),(.028,11.93,3.39),white)
 box('Stainless wall skirting',(x-.015*(1 if x>0 else -1),.02,.25),(.025,11.93,.20),silver)
box('Rear interior white lining',(0,5.775,1.845),(11.62,.03,3.39),white)
box('Rear stainless skirting',(0,5.75,.25),(11.62,.035,.20),silver)
# Pale soffit and cedar office facade retain the supplied trackside look.
box('Wide front lintel',(0,-5.89,3.60),(12,.22,.30),wood,.014)
for row in range(4):
 box('Cedar lower office plank',(0,-6.025,3.63+row*.13),(12,.11,.115),[wood,wood2,wood3][row%3],.008)
for row in range(3):box('Cedar upper office plank',(0,-6.025,5.76+row*.13),(12,.11,.115),[wood3,wood,wood2][row%3],.008)
for i in range(6):
 x=-5+i*2
 box('Large upper office glazing',(x,-6.005,4.86),(1.93,.055,1.49),glass,.005)
 for dx in [-.98,.98]:box('Slim glazing mullion',(x+dx,-6.045,4.86),(.035,.055,1.53),silver,.004)
box('Window continuous sill',(0,-6.06,4.10),(12,.12,.07),silver,.006)
box('Window continuous head',(0,-6.06,5.62),(12,.12,.07),silver,.006)
box('Flat overhanging roof',(0,-.10,6.23),(12.48,12.75,.20),roof,.025)
box('Dark roof fascia',(0,-6.47,6.21),(12.5,.055,.24),dark,.006)
# Roof service rail set back from facade, subtle technical silhouette.
for x in [-5.5,0,5.5]:rod('Roof parapet stanchion',(x,5.25,6.32),(x,5.25,6.94),.026,silver)
rod('Roof service safety top rail',(-5.5,5.25,6.94),(5.5,5.25,6.94),.026,silver)
rod('Roof service mid rail',(-5.5,5.25,6.64),(5.5,5.25,6.64),.02,silver)
# Front number plates and understated fictional team signage.
for x,num in [(-3,'01'),(3,'02')]:
 box('Garage team fascia',(x,-6.082,3.80),(5.6,.035,.32),bluefascia,.006)
 label('Team name','APEX MOTORSPORT',(x,-6.108,3.72),.18,white)
 box('Yellow garage identifier',(x,-6.062,3.53),(.48,.025,.19),yellow,.005)
 label('Garage bay number',num,(x,-6.081,3.47),.14,dark)
 # Roller shutter track channels visible at sides, no closed shutter geometry.
 for xx in [x-2.79,x+2.79]:box('Roller shutter side rail',(xx,-5.79,1.74),(.055,.055,3.12),silver,.006)
 box('Roller shutter cassette',(x,-5.75,3.49),(5.55,.27,.22),roof,.018)
# Ground-level non-overlap safety test against driving corridor.
arch_obstructions=[]
for o in bpy.context.scene.objects:
 if o.type!='MESH':continue
 pts=[o.matrix_world@Vector(c) for c in o.bound_box]
 lo=[min(p[i] for p in pts) for i in range(3)];hi=[max(p[i] for p in pts) for i in range(3)]
 if hi[0]>1.9 and lo[0]<4.1 and hi[1]>-6.05 and lo[1]<2.5 and hi[2]>.20 and lo[2]<2.2:arch_obstructions.append(o.name)
assert not arch_obstructions,arch_obstructions
building_stats=batch_save('pit-building')
clear()

# PROPS / GARAGE WORK AREA -----------------------------------------------
# Designates only furnishing meshes for collision-volume assertions; floor,
# ceiling utilities, markings and architectural wall panels are excluded.
furnishing_objects=[]
def remember(before):furnishing_objects.extend([o for o in bpy.context.scene.objects if o not in before])
for bay,x in enumerate([-3,3]):
 box('Satin epoxy bay flooring',(x,0,.15),(5.71,11.5,.018),floor)
 # Long parking guides create a clear center service area without filling it.
 for xx in [x-1.37,x+1.37]:box('Service area white guide',(xx,-.95,.163),(.055,8.75,.004),paint)
 for yy in [-5.28,3.35]:box('Service area end guide',(x,yy,.163),(2.79,.055,.004),paint)
 label('Rear wall bay title','SERVICE '+str(bay+1).zfill(2),(x,5.735,2.92),.25,dark)
 # Recessed entrance channel, top at floor level.
 box('Recessed entrance drain',(x,-5.65,.149),(5.55,.16,.022),dark,.004)
 for i in range(68):box('Stainless drain grate',(x-2.70+i*.0805,-5.65,.164),(.022,.14,.008),silver)
 # Twin linear lights plus crossbars form a practical bright work gantry.
 for xx in [x-1.75,x+1.75]:
  box('LED service gantry side',(xx,-.3,3.42),(.10,9.3,.10),silver,.012)
  box('Long diffuse LED strip',(xx,-.3,3.362),(.075,9.23,.014),led,.004)
 for yy in [-4.90,-.30,4.30]:
  box('LED overhead cross rail',(x,yy,3.42),(3.6,.10,.10),silver,.010)
  box('Overhead cross light',(x,yy,3.362),(3.5,.07,.014),led,.004)
 # Overhead cable tray beside each bay and its tiny metal rungs.
 tx=x+2.45
 for dx in [-.13,.13]:box('Cable tray channel',(tx+dx,-.05,3.35),(.025,10.7,.12),dark,.003)
 for j in range(28):box('Cable tray rung',(tx,-5.20+j*.38,3.31),(.28,.025,.025),silver,.004)
 for xx in [tx-.06,tx+.025]:rod('Overhead service cable',(xx,-5.25,3.35),(xx,5.25,3.35),.014,dark)
 # Rear wall workbench island: front edge beyond world X249.
 before=set(bpy.context.scene.objects)
 for dx in [-1.38,0,1.38]:
  old=set(bpy.context.scene.objects);chest(x+dx,5.10,1.30)
  for o in set(bpy.context.scene.objects)-old:o.location.z+=.09
 box('Continuous stainless workbench top',(x,5.10,1.33),(4.23,.75,.055),silver,.012)
 box('Rear overhead cabinet',(x,5.53,2.25),(4.2,.37,.60),red,.020)
 for dx in [-1.58,-.53,.53,1.58]:
  box('Overhead cupboard door',(x+dx,5.33,2.25),(1.01,.025,.55),red,.007)
  box('Cupboard pull',(x+dx+.36,5.30,2.23),(.018,.035,.21),silver,.004)
 box('Under cabinet task light',(x,5.47,1.93),(4.10,.14,.018),led,.004)
 # Laptop and small sockets on the rear workbench.
 box('Diagnostic computer base',(x-.65,4.98,1.39),(.42,.31,.025),dark,.009)
 box('Diagnostic display surround',(x-.65,5.10,1.57),(.43,.027,.32),dark,.009)
 box('Diagnostic display',(x-.65,5.083,1.57),(.38,.006,.27),blue,.002)
 for k in range(4):box('Diagnostic trace',(x-.68,5.078,1.49+k*.043),(.28-k*.015,.002,.007),led)
 for k in range(6):rod('Tool socket',(x+.3+k*.11,4.94,1.38),(x+.3+k*.11,4.94,1.45),.025,silver)
 remember(before)
 # Side telemetry console and wheel racks stay on outer wall strip.
 before=set(bpy.context.scene.objects)
 side_x=x+(-2.12 if x<0 else 2.12)
 box('Side telemetry counter',(side_x,2.15,1.10),(.90,2.0,.075),silver,.018)
 for yy in [1.32,2.98]:box('Telemetry desk pedestal',(side_x,yy,.60),(.74,.32,.96),dark,.02)
 # Monitors face toward garage opening, with stands and graphite surrounds.
 for yy in [1.65,2.65]:
  rod('Telemetry monitor stand',(side_x,yy,1.15),(side_x,yy,1.43),.026,silver)
  box('Telemetry monitor surround',(side_x,yy,1.60),(.70,.055,.40),dark,.014)
  box('Telemetry blue screen',(side_x,yy-.032,1.60),(.63,.007,.33),blue,.003)
  for k in range(5):box('Telemetry data line',(side_x-.05,yy-.038,1.49+k*.046),(.44-(k%3)*.045,.003,.009),led)
 # Mobile wheel rack with four slicks, tucked behind side telemetry station.
 rx=side_x;ry=4.02
 for xx in [rx-.43,rx+.43]:
  for yy in [ry-.34,ry+.34]:box('Wheel rack vertical',(xx,yy,1.04),(.035,.035,1.78),dark,.006)
 for zz in [.45,1.23]:
  for yy in [ry-.31,ry+.31]:rod('Wheel support rail',(rx-.44,yy,zz),(rx+.44,yy,zz),.023,silver)
  for xx in [rx-.22,rx+.20]:tyre(xx,ry,zz+.315)
 for xx in [rx-.36,rx+.36]:
  for yy in [ry-.26,ry+.26]:rod('Rack caster',(xx-.025,yy,.23),(xx+.025,yy,.23),.065,rubber,12)
 # Side-mounted service boom, hose hangs over equipment side, not car path.
 bx=x+(-2.36 if x<0 else 2.36)
 rod('Service boom wall mount',(bx,3.9,2.5),(bx,3.9,3.10),.04,silver)
 rod('Service boom horizontal arm',(bx,3.9,3.10),(bx,-1.4,3.10),.04,silver)
 rod('Service boom diagonal brace',(bx,3.9,2.6),(bx,2.7,3.10),.021,silver)
 pts=[]
 for k in range(121):
  t=k/120;pts.append((bx+.055*math.sin(t*math.pi*24),-1.4+.055*math.cos(t*math.pi*24),3.03-t*1.6))
 path('Coiled air hose',pts,.01,dark)
 box('Air gun body',(bx,-1.4,1.34),(.15,.08,.11),silver,.019)
 rod('Air gun hanging grip',(bx,-1.4,1.20),(bx,-1.4,1.32),.021,dark)
 remember(before)
# Strict full-object AABB overlap check, not merely vertex testing.
furnishing_overlap=[]
for o in furnishing_objects:
 bpy.context.view_layer.update()
 pts=[o.matrix_world@Vector(c) for c in o.bound_box];lo=[min(p[i] for p in pts) for i in range(3)];hi=[max(p[i] for p in pts) for i in range(3)]
 # active root (244.5,0,-76.5): local Blender X 1.9..4.1, Y -6.05..2.5
 if hi[0]>1.9 and lo[0]<4.1 and hi[1]>-6.05 and lo[1]<2.5:furnishing_overlap.append(o.name)
assert not furnishing_overlap,furnishing_overlap
props_stats=batch_save('pit-props')
json.dump({'building':building_stats,'props':props_stats,'world_root':[244.5,0,-76.5],'rotation_y':-math.pi/2,'front_plane_world_x':238.5,'nominal_bay_width_m':6,'nominal_depth_m':12,'nominal_clear_height_m':3.2,'floor_finish_top_m':.159,'ceiling_clear_above_floor_m':3.341,'lowest_car_corridor_fixture_clearance_m':3.196,'bay_centres_world_z':[-79.5,-73.5],'parking_car_world_center':[244,0,-73.5],'requested_clear_corridor':{'world_x':[238.45,247],'world_z':[-74.6,-72.4],'furnishing_aabb_overlaps':furnishing_overlap,'architecture_ground_level_overlaps':arch_obstructions},'note':'Design dimensions based on existing car and working clearances, not claimed FIA minima. Front pier widths reduce nominal six metre bay openings to about 5.76m.'},open(OUT+'/garage-verification.json','w'),indent=2)
print('GARAGE_V2_READY',building_stats,props_stats)
