from PIL import Image,ImageDraw,ImageFilter
import numpy as np,random,math
from pathlib import Path
P=Path(__file__).parent;random.seed(71);N=1024
im=Image.new('RGBA',(N,N));d=ImageDraw.Draw(im)
# Original botanical branch atlas, 19 lobed oak leaves, independent alpha silhouettes.
d.line([(510,970),(490,750),(530,510),(480,260),(520,50)],fill=(81,76,38,255),width=10)
for i in range(19):
 y=110+i*43;side=(-1 if i%2 else 1);x=500+side*random.uniform(115,210);angle=side*random.uniform(.6,1.3);L=random.uniform(135,190);W=L*.38
 base=(500,y+65);tip=(x+side*L*.32,y-L*.38)
 dx,dy=tip[0]-base[0],tip[1]-base[1];le=math.hypot(dx,dy);ux,uy=dx/le,dy/le;vx,vy=-uy,ux
 pts=[]
 for j in range(65):
  t=j/64*math.pi*2;s=(1-math.cos(t))*.5;w=math.sin(t)*W*(.83+.17*math.cos(s*math.pi*10))
  pts.append((base[0]+ux*s*le+vx*w,base[1]+uy*s*le+vy*w))
 c=(random.randint(52,83),random.randint(87,122),random.randint(24,43),255);d.polygon(pts,fill=c)
 d.line([base,tip],fill=(125,143,64,255),width=3)
 for k in range(1,7):
  s=k/8;p=(base[0]+dx*s,base[1]+dy*s)
  for sign in [-1,1]:d.line([p,(p[0]+ux*le*.13+vx*W*.65*sign*math.sin(s*math.pi),p[1]+uy*le*.13+vy*W*.65*sign*math.sin(s*math.pi))],fill=(91,115,43,255),width=2)
a=np.array(im);noise=np.random.default_rng(14).normal(0,4,(N,N,1));a[:,:,:3]=np.clip(a[:,:,:3].astype(float)+noise,0,255);Image.fromarray(a).save(P/'oak-leaf-cluster.png')
rng=np.random.default_rng(23);x=np.arange(N)[None,:];y=np.arange(N)[:,None];v=np.zeros((N,N))
for freq,amp in [(11,19),(27,11),(64,6),(150,4)]:v+=amp*np.sin(x/N*math.pi*2*freq+np.sin(y/N*math.pi*2*(freq/9))*.8)
v+=rng.normal(0,5,(N,N));v=np.clip(v+110,30,180)
Image.fromarray(np.stack([v*.85,v*.78,v*.65],axis=-1).astype('uint8')).save(P/'oak-bark.jpg',quality=93)
dy,dx=np.gradient(v/255);normal=np.stack([-dx*3,-dy*3,np.ones_like(v)],axis=-1);normal/=np.linalg.norm(normal,axis=-1)[:,:,None];Image.fromarray(((normal*.5+.5)*255).astype('uint8')).save(P/'oak-bark-normal.png')
