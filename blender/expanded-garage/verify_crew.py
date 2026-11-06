import bpy,json,os
from mathutils import Vector
OUT=os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.open_mainfile(filepath=OUT+'/pit-crew-editable.blend')
bpy.context.view_layer.update()
parking=[];piers=[];groups={}
for o in bpy.context.scene.objects:
 if o.type not in ['MESH','CURVE']:continue
 ps=[o.matrix_world@Vector(c) for c in o.bound_box];lo=[min(p[i] for p in ps) for i in range(3)];hi=[max(p[i] for p in ps) for i in range(3)]
 def overlaps(a,b):return all(hi[i]>a[i] and lo[i]<b[i] for i in range(3))
 if overlaps([1.9,-6.05,.14],[4.1,2.5,3.5]):parking.append(o.name)
 for x in [-6,0,6]:
  if overlaps([x-.12,-6,.14],[x+.12,-5.68,3.51]):piers.append([o.name,x])
 key=o.name.split(' | ')[0];g=groups.setdefault(key,{'min':[1e9]*3,'max':[-1e9]*3})
 for i in range(3):g['min'][i]=min(g['min'][i],lo[i]);g['max'][i]=max(g['max'][i],hi[i])
assert not parking and not piers,(parking,piers)
res={'method':'Individual component AABBs, not only vertex positions','parking_corridor_overlaps':parking,'pier_overlaps':piers,'crew_component_group_bounds_blender':groups,'approach_car_max_world_x':236.65,'minimum_crew_world_x':244.5+min(g['min'][1] for g in groups.values())}
res['approach_x_gap_m']=res['minimum_crew_world_x']-236.65
assert res['approach_x_gap_m']>0
json.dump(res,open(OUT+'/crew-clearance-verification.json','w'),indent=2);print(json.dumps(res))
