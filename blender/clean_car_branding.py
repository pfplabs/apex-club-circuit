"""Remove only specified old lettering from an editable car source copy.
Usage: blender -b --python clean_car_branding.py -- /path/to/base/car.blend [output_dir]
The source file is never overwritten. Output car.blend remains editable;
car.glb uses the repository's modifier-apply and parent-group batching procedure.
"""
import bpy,sys,re,json,hashlib
from pathlib import Path
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
if not args:raise SystemExit('Pass the source car.blend after --')
source=Path(args[0]).resolve();out=Path(args[1]).resolve() if len(args)>1 else Path(__file__).resolve().parent
out.mkdir(parents=True,exist_ok=True)
if source==out/'car.blend':raise RuntimeError('Source and destination must differ')
source_hash=hashlib.sha256(source.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(source))
pattern=re.compile(r'^(Team side lettering|Wing branding|Rear wing team)(?:\.\d+)?$')
def bounds():
 points=[];deps=bpy.context.evaluated_depsgraph_get()
 for obj in bpy.context.scene.objects:
  if obj.type!='MESH':continue
  ev=obj.evaluated_get(deps);mesh=ev.to_mesh()
  points.extend([tuple(obj.matrix_world@v.co) for v in mesh.vertices]);ev.to_mesh_clear()
 return {'min':[min(p[i] for p in points) for i in range(3)],'max':[max(p[i] for p in points) for i in range(3)]}
def wheel_info():
 return {o.name:{'matrix_world':[list(row) for row in o.matrix_world],'children':sorted(c.name for c in o.children)} for o in bpy.context.scene.objects if re.fullmatch(r'Wheel_(?:FL|FR|RL|RR)',o.name)}
def fingerprint(o):
 vals={'name':o.name,'type':o.type,'matrix':[list(r) for r in o.matrix_world],'parent':o.parent.name if o.parent else None,'materials':[m.name if m else None for m in o.data.materials] if o.type=='MESH' else []}
 if o.type=='MESH':vals['vertices']=[tuple(v.co) for v in o.data.vertices];vals['polygons']=[list(p.vertices) for p in o.data.polygons]
 return hashlib.sha256(json.dumps(vals,sort_keys=True).encode()).hexdigest()
before={'bounds':bounds(),'wheels':wheel_info(),'objects':len(bpy.context.scene.objects)}
remove=[o for o in bpy.context.scene.objects if pattern.fullmatch(o.name)]
if not remove:raise RuntimeError('No matching lettering objects; refusing an unverified cleanup')
removed=[{'name':o.name,'type':o.type,'vertices':len(o.data.vertices) if o.type=='MESH' else None} for o in remove]
retained={o.name:fingerprint(o) for o in bpy.context.scene.objects if o not in remove}
for o in remove:bpy.data.objects.remove(o,do_unlink=True)
bpy.context.view_layer.update()
after={'bounds':bounds(),'wheels':wheel_info(),'objects':len(bpy.context.scene.objects)}
assert all(fingerprint(bpy.data.objects[n])==h for n,h in retained.items()),'A retained object changed'
assert before['wheels']==after['wheels'],'Wheel hierarchy changed'
assert len(after['wheels'])==4
max_delta=max(abs(before['bounds'][k][i]-after['bounds'][k][i]) for k in ['min','max'] for i in range(3))
assert max_delta<1e-6, f'Bounds changed by {max_delta}'
plates=[o.name for o in bpy.context.scene.objects if o.name.startswith('Blue sidepod graphic')]
assert len(plates)==2,'Expected two untouched blue sidepod plates'
bpy.ops.wm.save_as_mainfile(filepath=str(out/'car.blend'),compress=True)
# Same batching as blender/optimize_exports.py; editable source already saved.
groups={}
for o in list(bpy.context.scene.objects):
 if o.type=='MESH':groups.setdefault(o.parent,[]).append(o)
for parent,objects in groups.items():
 bpy.ops.object.select_all(action='DESELECT')
 for obj in objects:obj.select_set(True)
 for obj in objects:
  bpy.context.view_layer.objects.active=obj
  for mod in list(obj.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();bpy.context.object.name=parent.name+'_Geometry' if parent else 'Static_Geometry'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(out/'car.glb'),export_format='GLB',export_yup=True,use_selection=True,export_apply=True)
assert hashlib.sha256(source.read_bytes()).hexdigest()==source_hash,'Source file changed'
report={'source':str(source),'source_sha256':source_hash,'removed':removed,'before':before,'after':after,'max_bounds_delta_m':max_delta,'unchanged_retained_objects':len(retained),'blue_sidepod_plates':plates,'source_unchanged':True,'glTF_forward':'-Z','glTF_up':'+Y'}
(out/'verification.json').write_text(json.dumps(report,indent=2))
print('CLEAN_CAR_READY',json.dumps({'removed':[x['name'] for x in removed],'unchanged_objects':len(retained),'bounds_delta':max_delta,'wheels':list(after['wheels']),'output':str(out)}),flush=True)
