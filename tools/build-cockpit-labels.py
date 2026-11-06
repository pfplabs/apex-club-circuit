"""Reproducible fictional wheel face; no copied reference branding."""
from pathlib import Path
s=['<svg xmlns="http://www.w3.org/2000/svg" width="900" height="690" viewBox="0 0 900 690"><defs><pattern id="weave" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#24292e"/><path d="M0 0h9v9H0zM9 9h9v9H9z" fill="#30373d"/><path d="M1 2h7M10 11h7" stroke="#454c51" stroke-width="2"/></pattern></defs><rect width="900" height="690" fill="url(#weave)"/>']
def point(x,y):return ((x+.15)*3000,(.115-y)*3000)
for x,y,label,color in [(-.058,.025,'TRQ','#39a4fa'),(.058,.025,'BOOST','#29c890'),(0,-.018,'MODE','#f7d84b'),(-.055,-.063,'DIFF','#d9dfe4'),(.055,-.063,'FUEL','#ea469f')]:
 a,b=point(x,y);s.append(f'<circle cx="{a}" cy="{b}" r="83" fill="none" stroke="{color}" stroke-width="5"/>')
 for i in range(12):
  import math
  angle=i*math.pi/6;u=a+96*math.sin(angle);v=b-96*math.cos(angle);s.append(f'<text x="{u:.1f}" y="{v+5:.1f}" text-anchor="middle" fill="#e8edf1" font-family="sans-serif" font-size="13">{i+1}</text>')
 s.append(f'<text x="{a}" y="{b-111}" text-anchor="middle" fill="white" font-family="sans-serif" font-size="20" font-weight="bold">{label}</text>')
for side,labels in [(-1,['N','RAD','PIT','LIM']),(1,['ACK','BAL','OK','REV'])]:
 for row,label in enumerate(labels):
  a,b=point(side*.105,.072-row*.035);s.append(f'<text x="{a-side*47}" y="{b+5}" text-anchor="middle" fill="white" font-family="sans-serif" font-size="17">{label}</text>')
s.append('<text x="450" y="83" text-anchor="middle" fill="#e7e9ed" font-family="sans-serif" font-size="23" letter-spacing="4">APEX / CONTROL</text></svg>')
Path('public/assets/cockpit-controls.svg').write_text(''.join(s))
