import bpy,os
out=os.path.dirname(os.path.abspath(__file__))
for name in ['car','grandstand','pit-building']:
 bpy.ops.wm.open_mainfile(filepath=f'{out}/{name}.blend')
 groups={}
 for o in list(bpy.context.scene.objects):
  if o.type=='MESH':groups.setdefault(o.parent,[]).append(o)
 for parent,objs in groups.items():
  bpy.ops.object.select_all(action='DESELECT')
  for o in objs:o.select_set(True)
  bpy.context.view_layer.objects.active=objs[0]
  # Apply modifiers before joining so bevels/normals survive on each part.
  for o in objs:
   bpy.context.view_layer.objects.active=o
   for mod in list(o.modifiers):
    bpy.ops.object.modifier_apply(modifier=mod.name)
  bpy.context.view_layer.objects.active=objs[0];bpy.ops.object.join()
  bpy.context.object.name=parent.name+'_Geometry' if parent else 'Static_Geometry'
 bpy.ops.object.select_all(action='SELECT')
 bpy.ops.export_scene.gltf(filepath=f'{out}/{name}.glb',export_format='GLB',export_yup=True,use_selection=True,export_apply=True)
 print('Optimized',name)
