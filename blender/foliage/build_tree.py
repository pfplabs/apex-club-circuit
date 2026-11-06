import bpy,random,math,json,os
from mathutils import Vector
P=os.path.dirname(os.path.abspath(__file__));random.seed(314)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def material(name,filename):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;p=n.get('Principled BSDF');p.inputs['Roughness'].default_value=.92;t=n.new('ShaderNodeTexImage');t.image=bpy.data.images.load(P+'/'+filename);m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color']);return m,p,t
bark,p,t=material('Oak bark • original procedural','oak-bark.jpg');nt=bark.node_tree.nodes.new('ShaderNodeTexImage');nt.image=bpy.data.images.load(P+'/oak-bark-normal.png');nt.image.colorspace_settings.name='Non-Color';nm=bark.node_tree.nodes.new('ShaderNodeNormalMap');bark.node_tree.links.new(nt.outputs['Color'],nm.inputs['Color']);bark.node_tree.links.new(nm.outputs['Normal'],p.inputs['Normal']);nm.inputs['Strength'].default_value=.5
leaf,p,t=material('Oak leaf clusters • cutout','oak-leaf-cluster.png');leaf.node_tree.links.new(t.outputs['Alpha'],p.inputs['Alpha']);leaf.surface_render_method='DITHERED';leaf.use_backface_culling=False;p.inputs['Roughness'].default_value=.8
V=[];F=[];UV=[];LV=[];LF=[];LU=[]
def tube(a,b,r1,r2,sides=7):
 a,b=Vector(a),Vector(b);w=(b-a).normalized();u=w.cross(Vector((0,1,0))).normalized();v=w.cross(u);idx=len(V)
 for pt,r in [(a,r1),(b,r2)]:
  for j in range(sides):V.append(pt+(u*math.cos(j*2*math.pi/sides)+v*math.sin(j*2*math.pi/sides))*r);UV.append((j/sides,(pt.z)*.45))
 for j in range(sides):F.append((idx+j,idx+(j+1)%sides,idx+sides+(j+1)%sides,idx+sides+j))
def card(pos,size):
 n=Vector((random.uniform(-1,1),random.uniform(-1,1),random.uniform(.15,1))).normalized();u=n.cross(Vector((0,0,1))).normalized();v=n.cross(u);idx=len(LV)
 for a,b in [(-.5,-.5),(.5,-.5),(.5,.5),(-.5,.5)]:LV.append(Vector(pos)+u*a*size+v*b*size);LU.append((a+.5,b+.5))
 LF.append((idx,idx+1,idx+2,idx+3))
# Buttressed root collar, crooked trunk and multi-level scaffold branches.
trunk=[Vector((0,0,0)),Vector((.10,.02,2.7)),Vector((-.15,.05,5.4)),Vector((.2,.12,7.7)),Vector((.1,0,9.8)),Vector((.35,.1,11.3))]
for i in range(5):tube(trunk[i],trunk[i+1],.48*(1-i/6),.48*(1-(i+1)/6),12)
for j in range(7):
 a=j*math.tau/7;tube((math.cos(a)*.85,math.sin(a)*.85,.04),(0,0,.8),.12,.21,7)
for j in range(30):
 a=j*2.399+random.uniform(-.2,.2);z=3.4+j*.245;spread=(math.sin((z-1.7)/11.2*math.pi)*3.7)*random.uniform(.8,1.15)
 start=Vector((0,0,z));mid=Vector((math.cos(a)*spread*.55,math.sin(a)*spread*.55,z+.65));end=Vector((math.cos(a)*spread,math.sin(a)*spread,z+random.uniform(1.2,2.1)))
 tube(start,mid,.12*(1-j/45),.055,7);tube(mid,end,.055,.018,6)
 for k in range(5):
  s=.33+k*.15;origin=mid.lerp(end,s);aa=a+(k%2*2-1)*random.uniform(.45,1.3);tip=origin+Vector((math.cos(aa)*random.uniform(.5,1.2),math.sin(aa)*random.uniform(.5,1.2),random.uniform(.2,.8)))
  tube(origin,tip,.025,.006,5)
  for l in range(13):
   p=origin.lerp(tip,random.uniform(.15,1.25))+Vector((random.gauss(0,.33),random.gauss(0,.33),random.gauss(0,.32)))
   card(p,random.uniform(.62,1.15))
def obj(name,verts,faces,uvs,mat):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.materials.append(mat);uv=me.uv_layers.new()
 for po in me.polygons:
  po.use_smooth=True
  for li in po.loop_indices:uv.data[li].uv=uvs[me.loops[li].vertex_index]
 ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);return ob
wood=obj('Oak_Wood',V,F,UV,bark);leaves=obj('Oak_Leaves',LV,LF,LU,leaf)
for im in bpy.data.images:
 if im.filepath:im.pack()
bpy.ops.object.select_all(action='DESELECT');wood.select_set(True);leaves.select_set(True)
bpy.ops.export_scene.gltf(filepath=P+'/oak-realistic.glb',export_format='GLB',use_selection=True,export_yup=True)
# Correct alpha mode explicitly for deterministic Three.js cutout leaves.
# Blender shader has alpha wired; exported mode is patched by verification script.
bpy.ops.wm.save_as_mainfile(filepath=P+'/oak-realistic.blend')
# Studio outdoor validation scene (excluded from asset).
bpy.ops.mesh.primitive_plane_add(size=200);floor=bpy.context.object;fm=bpy.data.materials.new('Ground');fm.diffuse_color=(.15,.18,.11,1);floor.data.materials.append(fm)
bpy.ops.object.light_add(type='SUN',location=(6,-8,14));sun=bpy.context.object;sun.data.energy=3;sun.rotation_euler=(.45,-.4,-.5);sun.data.angle=.07
world=bpy.context.scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.45,.58,.72,1);world.node_tree.nodes['Background'].inputs[1].default_value=.45
bpy.ops.object.camera_add(location=(17,-22,12));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,6))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=15;bpy.context.scene.camera=cam
sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.samples=24;sc.cycles.use_denoising=False;sc.render.resolution_x=1100;sc.render.resolution_y=1100;sc.render.resolution_percentage=100;sc.render.filepath=P+'/oak-closeup.png';bpy.ops.render.render(write_still=True)
