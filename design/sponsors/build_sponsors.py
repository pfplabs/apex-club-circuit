from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from pathlib import Path
import html,json
OUT=Path(__file__).resolve().parents[2]/'public/assets/sponsors'
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
f=TTFont(FONT); gs=f.getGlyphSet(); cmap=f.getBestCmap(); up=f['head'].unitsPerEm

def lettering(s,x,y,size,maxwidth,color='#F7F8FA',italic=0):
 names=[cmap[ord(c)] for c in s]; w=sum(gs[n].width for n in names)*size/up
 scale=min(1,maxwidth/w); cursor=0; parts=[]
 for n in names:
  pen=SVGPathPen(gs);gs[n].draw(pen)
  parts.append(f'<path d="{pen.getCommands()}" transform="translate({cursor},0)"/>'); cursor+=gs[n].width
 return f'<g fill="{color}" transform="translate({x},{y}) scale({size/up*scale},{-size/up}) skewX({italic})">'+''.join(parts)+'</g>'
brands=[
 dict(id='torqen',name='TORQEN',category='PERFORMANCE FUELS + LUBRICANTS',accent='#FF8C28',bg='#111D2B',mark='<path d="M66 54h142l-17 35h-53l-52 113H47L99 89H50z" fill="#FF8C28"/><path d="M174 109h32l-42 93h-33z" fill="#F7F8FA"/>'),
 dict(id='relayon',name='RELAYON',category='GLOBAL MEDIA NETWORK',accent='#36D6BE',bg='#102B31',mark='<path d="M52 52h118l43 43-43 43H90v63H52zm38 37v14h64l7-7-7-7z" fill="#36D6BE"/><path d="M125 155h45l45 46h-51z" fill="#F7F8FA"/>'),
 dict(id='hexlume',name='HEXLUME',category='COMPUTE WITHOUT LIMITS',accent='#9FADFF',bg='#1B2140',mark='<path d="M120 41l82 47v94l-82 47-82-47V88zm0 41L74 108v53l46 26 46-26v-53z" fill="#9FADFF"/><path d="M105 112h30v46h-30z" fill="#F7F8FA"/>'),
 dict(id='stratum',name='STRATUM',category='RACEWORKS',accent='#FFCF51',bg='#172126',mark='<path d="M54 56h151l-20 37H34zm0 55h127l-20 37H34zm0 55h103l-20 37H34z" fill="#FFCF51"/>')]
rows=[]
for b in brands:
 content=f'<rect width="1024" height="256" fill="{b["bg"]}"/><rect x="0" y="0" width="12" height="256" fill="{b["accent"]}"/>'+b['mark']+lettering(b['name'],242,148,100,722,italic=7 if b['id'] in ['torqen','stratum'] else 0)+lettering(b['category'],248,198,25,700,b['accent'])
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="256" viewBox="0 0 1024 256"><title>{b["name"]} fictional racing sponsor</title>{content}</svg>'
 (OUT/(b['id']+'.svg')).write_text(svg)
 rows.append(content)
(OUT/'sponsor-atlas.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">'+''.join(f'<g transform="translate(0,{i*256})">{s}</g>' for i,s in enumerate(rows))+'</svg>')
(OUT/'brands.json').write_text(json.dumps([{k:v for k,v in b.items() if k!='mark'} for b in brands],indent=2))
