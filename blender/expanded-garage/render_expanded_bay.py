import bpy,math,os,json
from mathutils import Vector,Matrix
OUT=os.path.dirname(os.path.abspath(__file__))
ASSETS=os.path.abspath(os.path.join(OUT,'../../public/assets'))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def append_meshes(file):
 with bpy.data.libraries.load(file,link=False) as (src,dst):dst.objects=src.objects
 result=[]
 for o in dst.objects:
  if o and o.type=='MESH':bpy.context.collection.objects.link(o);result.append(o)
 return result
for name in ['pit-building','pit-props','pit-crew']:append_meshes(OUT+'/'+name+'.blend')
# Research-informed facade preview with project CC0 metric wood maps.
for ob in list(bpy.context.scene.objects):
 if ob.type != 'MESH' or not any('cedar' in m.name.lower() for m in ob.data.materials): continue
 uv=ob.data.uv_layers.active or ob.data.uv_layers.new(name='Metric 1.9m cedar UV')
 for poly in ob.data.polygons:
  n=poly.normal;axis=max(range(3),key=lambda i:abs(n[i]))
  for li in poly.loop_indices:
   p=ob.matrix_world@ob.data.vertices[ob.data.loops[li].vertex_index].co
   uv.data[li].uv=(p.y/1.9,p.z/1.9) if axis==0 else ((p.x/1.9,p.z/1.9) if axis==1 else (p.x/1.9,p.y/1.9))
 for m in ob.data.materials:
  if 'cedar' not in m.name.lower():continue
  nodes=m.node_tree.nodes;links=m.node_tree.links;bs=nodes.get('Principled BSDF')
  for suffix,input_name in [('diff','Base Color'),('rough','Roughness')]:
   tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(ASSETS+'/textures/wood-'+('albedo' if suffix=='diff' else 'roughness')+'.jpg',check_existing=True)
   if suffix!='diff':tex.image.colorspace_settings.name='Non-Color'
   links.new(tex.outputs['Color'],bs.inputs[input_name])
  tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(ASSETS+'/textures/wood-normal.jpg',check_existing=True);tex.image.colorspace_settings.name='Non-Color'
  normal=nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.25;links.new(tex.outputs['Color'],normal.inputs['Color']);links.new(normal.outputs['Normal'],bs.inputs['Normal'])

before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=ASSETS+'/car.glb')
new=set(bpy.context.scene.objects)-before
# Bake hierarchy to world transforms, then turn the original car to face out.
car=[o for o in new if o.type=='MESH']
for o in car:
 mw=o.matrix_world.copy();o.parent=None;o.matrix_world=mw
for o in new:
 if o.type!='MESH':bpy.data.objects.remove(o,do_unlink=True)
R=Matrix.Rotation(math.pi,4,'Z')
for o in car:o.matrix_world=R@o.matrix_world
bpy.context.view_layer.update()
pts=[o.matrix_world@Vector(c) for o in car for c in o.bound_box]
lo=[min(v[i] for v in pts) for i in range(3)];hi=[max(v[i] for v in pts) for i in range(3)]
offset=Vector((3-(lo[0]+hi[0])/2,-.5-(lo[1]+hi[1])/2,.16-lo[2]))
for o in car:o.location+=offset
json.dump({'car_local_bbox_before_alignment':{'min':lo,'max':hi},'car_aligned_center_xy':[3,-.5],'car_ground_z':.16,'car_dimensions':[hi[i]-lo[i] for i in range(3)]},open(OUT+'/render-car-scale.json','w'),indent=2)
# Neutral asphalt preview only; GLBs exclude all render staging.
m=bpy.data.materials.new('Preview asphalt');m.diffuse_color=(.095,.11,.12,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(.095,.11,.12,1);p.inputs['Roughness'].default_value=.88
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,-8,-.055));o=bpy.context.object;o.name='RENDER ONLY approach pavement';o.dimensions=(32,32,.10);o.data.materials.append(m)
# Practical illumination behind the front soffit and inside each service area.
for x in [-3,3]:
 for y in [-3.8,.3,3.8]:
  bpy.ops.object.light_add(type='AREA',location=(x,y,3.28));o=bpy.context.object;o.data.energy=160;o.data.shape='RECTANGLE';o.data.size=3.6;o.data.size_y=2.4
bpy.ops.object.light_add(type='AREA',location=(-5,-12,10));o=bpy.context.object;o.data.energy=2400;o.data.size=9;o.rotation_euler=(Vector((1,-1,2))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.light_add(type='SUN',location=(-8,-8,12));o=bpy.context.object;o.data.energy=2;o.data.angle=.12;o.rotation_euler=(math.radians(30),math.radians(-23),math.radians(-25))
bpy.ops.object.camera_add(location=(1.5,-17,3.1));o=bpy.context.object;o.rotation_euler=(Vector((0,0,2.0))-o.location).to_track_quat('-Z','Y').to_euler();o.data.lens=31;bpy.context.scene.camera=o
sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.samples=24;sc.cycles.use_denoising=False;sc.world.color=(.24,.28,.34);sc.render.resolution_x=1440;sc.render.resolution_y=960;sc.render.resolution_percentage=100;sc.render.filepath=OUT+'/expanded-bay-progress.png'
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/expanded-bay-preview.blend');bpy.ops.render.render(write_still=True)
