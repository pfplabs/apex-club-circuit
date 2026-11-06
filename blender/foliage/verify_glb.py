from pathlib import Path
import json,struct,hashlib
p=Path(__file__).parent;f=p/'oak-realistic.glb';b=f.read_bytes();ln,typ=struct.unpack_from('<II',b,12);j=json.loads(b[20:20+ln]);tail=b[20+ln:]
for m in j['materials']:
 if 'leaf' in m['name'].lower():m['alphaMode']='MASK';m['alphaCutoff']=.45;m['doubleSided']=True
s=json.dumps(j,separators=(',',':')).encode();s+=b' '*((-len(s))%4);f.write_bytes(struct.pack('<III',0x46546c67,2,20+len(s)+len(tail))+struct.pack('<II',len(s),0x4e4f534a)+s+tail)
count=0;bounds=[]
for m in j['meshes']:
 for v in m['primitives']:
  count+=j['accessors'][v['indices']]['count']//3;a=j['accessors'][v['attributes']['POSITION']];bounds.append({'mesh':m['name'],'min':a['min'],'max':a['max']})
r={'triangles':count,'materials':len(j['materials']),'meshes':len(j['meshes']),'bounds_gltf_Y_up':bounds,'embedded_textures':len(j.get('images',[])),'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()};(p/'validation.json').write_text(json.dumps(r,indent=2));print(json.dumps(r,indent=2))
