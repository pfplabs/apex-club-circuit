import bpy,json,os
from mathutils import Vector
OUT=os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.open_mainfile(filepath=OUT+'/pit-props-editable.blend');bpy.context.view_layer.update()
allowed=('Satin epoxy','Service area','Recessed entrance drain','Stainless drain grate','LED service','Long diffuse','LED overhead','Overhead cross','Cable tray','Overhead service','Rear wall bay title')
hits=[];checked=0
for o in bpy.context.scene.objects:
 if o.type not in ['MESH','CURVE'] or o.name.startswith(allowed):continue
 checked+=1;ps=[o.matrix_world@Vector(c) for c in o.bound_box];lo=[min(p[i] for p in ps) for i in range(3)];hi=[max(p[i] for p in ps) for i in range(3)]
 if hi[0]>1.9 and lo[0]<4.1 and hi[1]>-6.05 and lo[1]<2.5:hits.append(o.name)
assert not hits,hits
json.dump({'method':'Individual editable furnishing object AABB intersections at every height; only floor/markings/drain/ceiling utility meshes excluded','furnishing_objects_checked':checked,'overlaps':hits,'local_blender_xy_corridor':[[1.9,4.1],[-6.05,2.5]],'world_xz_corridor':[[238.45,247],[-74.6,-72.4]]},open(OUT+'/props-clearance-verification.json','w'),indent=2)
print('STRICT FULL HEIGHT FURNISHING CHECK PASSED',checked)
