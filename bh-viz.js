(function(){
const TAU=Math.PI*2;
const C={bg:'#060A12',cyan:'#55DDE0',green:'#38D996',amber:'#FFB547',red:'#FF5C64',text:'#E8F0FA',muted:'#8FA3B8'};
const COL={active:C.cyan,anchor:C.green,damaged:C.amber,lost:C.red,inactive:'#5B6B7E',marker:'#B7C3D1'};
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const MONO='IBM Plex Mono, ui-monospace, monospace';
function fit(cv){const d=Math.min(2,window.devicePixelRatio||1),w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return null;const W=Math.round(w*d),H=Math.round(h*d);if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}const ctx=cv.getContext('2d');ctx.setTransform(d,0,0,d,0,0);return{ctx,w,h};}
function grid(ctx,w,h,s){ctx.strokeStyle='rgba(85,221,224,0.045)';ctx.lineWidth=1;ctx.beginPath();for(let x=(w/2)%s;x<w;x+=s){ctx.moveTo(Math.round(x)+.5,0);ctx.lineTo(Math.round(x)+.5,h);}for(let y=(h/2)%s;y<h;y+=s){ctx.moveTo(0,Math.round(y)+.5);ctx.lineTo(w,Math.round(y)+.5);}ctx.stroke();}
function diskRGB(M){const t=clamp((Math.log10(M)-1)/9,0,1);const a=[205,225,255],b=[255,196,130],c=[255,118,58];const m=t<.5?[a,b,t*2]:[b,c,(t-.5)*2];return m[0].map((v,i)=>Math.round(v+(m[1][i]-v)*m[2]));}
const rgba=(c,a)=>`rgba(${c[0]},${c[1]},${c[2]},${a})`;
function label(ctx,t,x,y,col,align){ctx.font='10px '+MONO;ctx.textAlign=align||'left';const w=ctx.measureText(t).width;const x0=align==='center'?x-w/2:align==='right'?x-w:x;ctx.fillStyle='rgba(6,10,18,0.78)';ctx.fillRect(x0-3,y-9,w+6,13);ctx.fillStyle=col;ctx.fillText(t,x,y);}

function node(id,S){const A=160,H=S.markers,ext=5000-A-H;let cat,r;const a0=hash(id*1.7)*TAU;
 if(id>5000-A){cat='anchor';r=S.anchorR*(0.96+hash(id*3.1)*0.08);}
 else if(id>ext){cat='marker';r=0.2+hash(id*2.3)*0.65;}
 else{const q=hash(id*9.13),f=S.frac;cat=q<f.lost?'lost':q<f.lost+f.damaged?'damaged':q<f.lost+f.damaged+f.inactive?'inactive':'active';r=Math.max(1.15,S.r*(0.86+hash(id*5.7)*0.32));if(cat==='lost')r*=1+hash(id*4.4)*0.5;}
 return{id,cat,r,a0};}
function angle(n,vt){if(n.cat==='lost'||n.cat==='marker')return n.a0;return n.a0+vt*0.35*Math.pow(6/n.r,1.5);}

function drawBH(cv,S,mode){const f=fit(cv);if(!f)return;const{ctx,w,h}=f;
 ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);grid(ctx,w,h,28);
 const sim=mode==='sim',r=S.r,vt=S.vt;
 const viewRs=sim?S.anchorR*1.08:Math.max(7.5,r*1.3);
 const k=Math.min(w*0.47,h*0.92)/viewRs,cx=w/2,cy=h/2,inc=0.3,dc=diskRGB(S.mass);
 const P=(R,a)=>[cx+R*k*Math.cos(a),cy+R*k*Math.sin(a)*inc];
 const ell=(R,a0,a1,st,lw,dash)=>{ctx.beginPath();ctx.ellipse(cx,cy,R*k,R*k*inc,0,a0,a1);if(dash)ctx.setLineDash(dash);ctx.strokeStyle=st;ctx.lineWidth=lw||1;ctx.stroke();if(dash)ctx.setLineDash([]);};
 const sh=2.598*k;
 const g=ctx.createRadialGradient(cx,cy,sh,cx,cy,sh*1.9);g.addColorStop(0,rgba(dc,0.16));g.addColorStop(1,rgba(dc,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,sh*1.9,0,TAU);ctx.fill();
 const refs=[3,6,10,15,20,30].filter(x=>x<viewRs*0.98);
 refs.forEach(R=>ell(R,Math.PI,TAU,'rgba(143,163,184,0.22)',1,[3,4]));
 const disk=front=>{const segs=32,lw=Math.max(1.2,0.3*k*inc*1.6);for(let R=3;R<=11;R+=0.3){const fall=Math.pow(3/R,1.7);for(let i=0;i<segs;i++){const a0=(front?0:Math.PI)+i*Math.PI/segs,a1=a0+Math.PI/segs+0.02,am=(a0+a1)/2;const dop=1+0.6*(-Math.cos(am));const tur=0.78+0.22*Math.sin(am*7+R*2.1-vt*0.9*Math.pow(6/R,1.5));ell(R,a0,a1,rgba(dc,clamp(fall*dop*tur*0.6,0,1)),lw);}}};
 disk(false);
 for(let R=3;R<=9;R+=0.3){const rx=(2.72+(R-3)*0.42)*k;ctx.beginPath();ctx.ellipse(cx,cy,rx,rx*0.86,0,Math.PI*1.04,Math.PI*1.96);ctx.strokeStyle=rgba(dc,Math.pow(3/R,1.7)*0.3);ctx.lineWidth=Math.max(1,0.2*k);ctx.stroke();}
 ctx.fillStyle='#000';ctx.beginPath();ctx.arc(cx,cy,sh,0,TAU);ctx.fill();
 ctx.strokeStyle=rgba(dc,0.85);ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(cx,cy,sh*1.01,0,TAU);ctx.stroke();
 ctx.beginPath();ctx.ellipse(cx,cy,sh*1.07,sh*1.03,0,0.15,Math.PI-0.15);ctx.strokeStyle=rgba(dc,0.3);ctx.lineWidth=1.5;ctx.stroke();
 disk(true);
 refs.forEach(R=>ell(R,0,Math.PI,'rgba(143,163,184,0.22)',1,[3,4]));
 // scientific overlays
 ctx.setLineDash([4,3]);ctx.lineWidth=1;ctx.strokeStyle='rgba(255,92,100,0.9)';ctx.beginPath();ctx.arc(cx,cy,k,0,TAU);ctx.stroke();
 ctx.strokeStyle='rgba(232,240,250,0.5)';ctx.beginPath();ctx.arc(cx,cy,1.5*k,0,TAU);ctx.stroke();ctx.setLineDash([]);
 if(k>14){label(ctx,'Rs',cx,cy-k+12,'#FF8A90','center');label(ctx,'1.5 Rs',cx,cy-1.5*k-4,'#C9D4E0','center');}
 refs.forEach(R=>{const[x,y]=P(R,0);label(ctx,R===3?'3 Rs ISCO':R+' Rs',x+6,y+3,R===3?'#E8F0FA':C.muted);});
 // swarm
 if(!sim){for(let i=0;i<44;i++){const n=node(1+i*109,S);if(n.cat==='marker'||n.cat==='anchor')continue;const[x,y]=P(n.r,angle(n,vt));ctx.fillStyle=COL[n.cat];ctx.beginPath();ctx.arc(x,y,1.6,0,TAU);ctx.fill();}}
 else{
  ctx.lineWidth=1;ctx.strokeStyle='rgba(56,217,150,0.16)';ctx.beginPath();
  for(let j=0;j<32;j++){const an=node(4841+j*5,S);const[ax,ay]=P(an.r,angle(an,vt));for(let q=0;q<3;q++){const n=node(((j*151+q*977)%4000)+1,S);if(n.cat!=='active')continue;const[x,y]=P(n.r,angle(n,vt));ctx.moveTo(ax,ay);ctx.lineTo(x,y);}}
  ctx.stroke();
  for(let i=0;i<380;i++){const n=node(1+i*12,S);if(n.cat==='marker'||n.cat==='anchor')continue;const[x,y]=P(n.r,angle(n,vt));ctx.fillStyle=COL[n.cat];ctx.beginPath();ctx.arc(x,y,n.cat==='active'?1.3:1.8,0,TAU);ctx.fill();}
  for(let j=0;j<32;j++){const an=node(4841+j*5,S);const[x,y]=P(an.r,angle(an,vt));ctx.fillStyle=C.green;ctx.fillRect(x-2.5,y-2.5,5,5);}
  ell(S.anchorR,0,TAU,'rgba(56,217,150,0.3)',1,[2,5]);
 }
 // probe
 const pa=0.6+vt*0.35*Math.pow(6/r,1.5);const[px,py]=P(r,pa);
 if(r>=3)ell(r,0,TAU,'rgba(85,221,224,0.7)',1.2,[6,4]);
 else{ctx.beginPath();ctx.ellipse(cx,cy,r*k,r*k*inc,0,pa-0.5,pa+0.5);ctx.setLineDash([2,3]);ctx.strokeStyle='rgba(255,181,71,0.9)';ctx.stroke();ctx.setLineDash([]);}
 if(mode==='td'){ctx.strokeStyle='rgba(85,221,224,0.6)';ctx.setLineDash([2,3]);ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(px,py);ctx.stroke();ctx.setLineDash([]);}
 const behind=Math.sin(pa)<0&&Math.hypot(px-cx,py-cy)<sh;
 ctx.globalAlpha=behind?0.4:1;ctx.fillStyle=C.cyan;ctx.beginPath();ctx.moveTo(px,py-6);ctx.lineTo(px+6,py);ctx.lineTo(px,py+6);ctx.lineTo(px-6,py);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
 label(ctx,`PROBE · r = ${r.toFixed(2)} Rs`,px+10,py-8,C.cyan);
 if(r<3)label(ctx,'STATION-KEEPING · no stable circular orbit below 3 Rs',px+10,py+8,C.amber);
}

function drawSwarm(cv,S,U,out){const f=fit(cv);if(!f)return;const{ctx,w,h}=f;ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);
 const viewRs=(S.anchorR*1.15)/U.zoom,k=Math.min(w,h)/2/viewRs,cx=w/2,cy=h/2,vt=S.vt,dc=diskRGB(S.mass);
 const L=U.layers,F=U.filters;
 if(L.grid){grid(ctx,w,h,40);ctx.strokeStyle='rgba(143,163,184,0.14)';ctx.lineWidth=1;[3,6,10,15,20,30,40].forEach(R=>{if(R*k>Math.hypot(w,h)/2)return;ctx.beginPath();ctx.arc(cx,cy,R*k,0,TAU);ctx.stroke();label(ctx,R===3?'3 Rs ISCO':R+' Rs',cx+R*k*0.707+3,cy-R*k*0.707,R===3?C.text:C.muted);});}
 if(L.disk){const g=ctx.createRadialGradient(cx,cy,3*k,cx,cy,11*k);g.addColorStop(0,rgba(dc,0.42));g.addColorStop(0.4,rgba(dc,0.14));g.addColorStop(1,rgba(dc,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,11*k,0,TAU);ctx.arc(cx,cy,3*k,0,TAU,true);ctx.fill();}
 ctx.setLineDash([3,3]);ctx.strokeStyle='rgba(232,240,250,0.45)';ctx.beginPath();ctx.arc(cx,cy,1.5*k,0,TAU);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle='#000';ctx.beginPath();ctx.arc(cx,cy,k,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,92,100,0.85)';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(cx,cy,k,0,TAU);ctx.stroke();
 if(L.orbits){ctx.setLineDash([5,5]);ctx.lineWidth=1;if(S.r>=3){ctx.strokeStyle='rgba(85,221,224,0.35)';ctx.beginPath();ctx.arc(cx,cy,S.r*k,0,TAU);ctx.stroke();}else{ctx.strokeStyle='rgba(255,181,71,0.55)';ctx.beginPath();ctx.arc(cx,cy,3*k,0,TAU);ctx.stroke();label(ctx,'Swarm inside ISCO · powered station-keeping, no stable orbit',cx-3*k,cy+3*k+16,C.amber);}ctx.strokeStyle='rgba(56,217,150,0.35)';ctx.beginPath();ctx.arc(cx,cy,S.anchorR*k,0,TAU);ctx.stroke();ctx.setLineDash([]);}
 const pos=n=>{const a=angle(n,vt);return[cx+n.r*k*Math.cos(a),cy+n.r*k*Math.sin(a)];};
 if(L.links&&F.anchor){ctx.strokeStyle='rgba(56,217,150,0.14)';ctx.lineWidth=1;ctx.beginPath();for(let j=0;j<32;j++){const an=node(4841+j*5,S);const[ax,ay]=pos(an);for(let q=0;q<4;q++){const n=node(((j*151+q*977)%4000)+1,S);if(n.cat!=='active'||!F.active)continue;const[x,y]=pos(n);ctx.moveTo(ax,ay);ctx.lineTo(x,y);}}ctx.stroke();}
 const ids=[];for(let id=1;id<=5000;id+=5)ids.push(id);const ext=5000-160-S.markers;for(let id=ext+1;id<=4840;id++)if((id-1)%5)ids.push(id);if(U.sel)ids.push(U.sel);
 const pts=[];
 for(const id of ids){const n=node(id,S);if(!F[n.cat]&&id!==U.sel)continue;const[x,y]=pos(n);if(x<-5||y<-5||x>w+5||y>h+5)continue;pts.push({id,x,y});
  if(n.cat==='anchor'){ctx.fillStyle=C.green;ctx.fillRect(x-3,y-3,6,6);}
  else if(n.cat==='marker'){ctx.strokeStyle=COL.marker;ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,2.6,0,TAU);ctx.stroke();}
  else{ctx.fillStyle=COL[n.cat];ctx.beginPath();ctx.arc(x,y,n.cat==='active'?1.5:2,0,TAU);ctx.fill();}}
 out.pts=pts;
 if(U.sel){const n=node(U.sel,S);const[x,y]=pos(n);
  if(L.traj&&n.cat!=='marker'&&n.cat!=='lost'){if(n.r>=3){ctx.setLineDash([6,4]);ctx.strokeStyle='rgba(85,221,224,0.9)';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(cx,cy,n.r*k,0,TAU);ctx.stroke();ctx.setLineDash([]);}else{const a=angle(n,vt);ctx.setLineDash([2,3]);ctx.strokeStyle=C.amber;ctx.beginPath();ctx.arc(cx,cy,n.r*k,a-0.6,a+0.6);ctx.stroke();ctx.setLineDash([]);}}
  ctx.strokeStyle=C.text;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(x,y,8,0,TAU);ctx.stroke();ctx.beginPath();ctx.moveTo(x+8,y-8);ctx.lineTo(x+18,y-18);ctx.stroke();
  label(ctx,'BH-'+String(U.sel).padStart(4,'0'),x+20,y-18,C.text);}
}

const offs={};let gKey={};
function off(key,w,h){let o=offs[key];if(!o){o=document.createElement('canvas');offs[key]=o;}if(o.width!==w||o.height!==h){o.width=w;o.height=h;}return o;}
function scene(ctx,w,h,G,lensed){ctx.fillStyle='#03050A';ctx.fillRect(0,0,w,h);
 const cx=w/2,cy=h/2,k=Math.min(w,h)*3.0/G.dist,thE=2.85*k,sh=2.598*k,dc=diskRGB(G.mass);
 for(let i=0;i<320;i++){const sx=(hash(i*3.3)-.5)*w*1.3,sy=(hash(i*7.1)-.5)*h*1.3,br=0.25+hash(i*1.9)*0.75,sz=Math.max(0.6,w/900);
  const dot=(x,y,a)=>{ctx.fillStyle=`rgba(232,240,250,${a})`;ctx.fillRect(x,y,sz,sz);};
  if(!lensed){dot(cx+sx,cy+sy,br);}else{const b=Math.hypot(sx,sy)||1,q=Math.sqrt(b*b+4*thE*thE),tp=(b+q)/2,tm=(b-q)/2,ux=sx/b,uy=sy/b;dot(cx+ux*tp,cy+uy*tp,br);if(Math.abs(tm)>sh*1.02)dot(cx+ux*tm,cy+uy*tm,br*0.35);}}
 ctx.save();ctx.translate(cx,cy);ctx.rotate(G.cam);
 const iy=Math.max(0.03,Math.cos(G.inc*Math.PI/180)),dopA=Math.sin(G.inc*Math.PI/180)*0.6;
 const disk=front=>{const segs=36;for(let R=3;R<=10;R+=0.25){const fall=Math.pow(3/R,1.7);for(let i=0;i<segs;i++){const a0=(front?0:Math.PI)+i*Math.PI/segs,a1=a0+Math.PI/segs+0.02,am=(a0+a1)/2;const dop=1+dopA*(-Math.cos(am));const tur=0.8+0.2*Math.sin(am*9+R*3.1);ctx.beginPath();ctx.ellipse(0,0,R*k,R*k*iy,0,a0,a1);ctx.strokeStyle=rgba(dc,clamp(fall*dop*tur*0.65,0,1));ctx.lineWidth=Math.max(0.8,0.3*k*Math.max(iy,0.25));ctx.stroke();}}};
 disk(false);
 if(!lensed){ctx.fillStyle='#000';ctx.beginPath();ctx.arc(0,0,k,0,TAU);ctx.fill();}
 else{const ay=iy+(1-iy)*0.86;for(let R=3;R<=9;R+=0.3){const rx=(2.72+(R-3)*0.42)*k;ctx.beginPath();ctx.ellipse(0,0,rx,rx*ay,0,Math.PI*1.02,Math.PI*1.98);ctx.strokeStyle=rgba(dc,Math.pow(3/R,1.7)*0.34);ctx.lineWidth=Math.max(0.8,0.2*k);ctx.stroke();}
  const g=ctx.createRadialGradient(0,0,sh,0,0,sh*1.5);g.addColorStop(0,rgba(dc,0.22));g.addColorStop(1,rgba(dc,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,sh*1.5,0,TAU);ctx.fill();
  ctx.fillStyle='#000';ctx.beginPath();ctx.arc(0,0,sh,0,TAU);ctx.fill();ctx.strokeStyle=rgba(dc,0.9);ctx.lineWidth=Math.max(1,0.05*k);ctx.beginPath();ctx.arc(0,0,sh*1.01,0,TAU);ctx.stroke();
  ctx.beginPath();ctx.ellipse(0,0,sh*1.08,sh*1.08*Math.max(ay,0.6),0,0.1,Math.PI-0.1);ctx.strokeStyle=rgba(dc,0.3);ctx.lineWidth=Math.max(1,0.08*k);ctx.stroke();}
 disk(true);ctx.restore();}
function drawGRRT(cv,G,split,progress,key){const f=fit(cv);if(!f)return;const{ctx,w,h}=f;
 const scale={1:8,2:5,3:3,4:2,5:1}[G.res]||3,ow=Math.ceil(w/scale),oh=Math.ceil(h/scale);
 const A=off(key+'a',ow,oh),B=off(key+'b',ow,oh);const kk=JSON.stringify([G,ow,oh]);
 if(gKey[key]!==kk){scene(A.getContext('2d'),ow,oh,G,false);scene(B.getContext('2d'),ow,oh,G,true);gKey[key]=kk;}
 ctx.imageSmoothingEnabled=scale<=1;const sx=w*split;
 ctx.save();ctx.beginPath();ctx.rect(0,0,sx,h);ctx.clip();ctx.drawImage(A,0,0,w,h);ctx.restore();
 ctx.save();ctx.beginPath();ctx.rect(sx,0,w-sx,h);ctx.clip();ctx.drawImage(B,0,0,w,h);ctx.restore();
 if(progress<1){const yy=h*progress;ctx.fillStyle='rgba(6,10,18,0.94)';ctx.fillRect(0,yy,w,h-yy);ctx.fillStyle=C.cyan;ctx.fillRect(0,yy,w,1.5);ctx.strokeStyle='rgba(85,221,224,0.06)';ctx.beginPath();for(let y=yy+6;y<h;y+=6){ctx.moveTo(0,y);ctx.lineTo(w,y);}ctx.stroke();}
 if(split>0.001&&split<0.999){ctx.fillStyle=C.cyan;ctx.fillRect(sx-0.75,0,1.5,h);ctx.fillStyle='#0B1220';ctx.strokeStyle=C.cyan;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(sx,h/2,11,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle=C.cyan;ctx.beginPath();ctx.moveTo(sx-7,h/2);ctx.lineTo(sx-3,h/2-4);ctx.lineTo(sx-3,h/2+4);ctx.fill();ctx.beginPath();ctx.moveTo(sx+7,h/2);ctx.lineTo(sx+3,h/2-4);ctx.lineTo(sx+3,h/2+4);ctx.fill();}
}

let rayC={key:null,paths:null};
function geo(b){const r0=40,s=Math.abs(b),sg=Math.sign(b)||1;let phi=Math.asin(Math.min(1,s/r0)),u=1/r0,du=Math.sqrt(Math.max(0,1/(s*s)-u*u*(1-u)));const hS=0.004,fn=x=>-x+1.5*x*x,pts=[];let cap=false;
 for(let i=0;i<7000;i++){if(i%3===0){const rr=1/u;pts.push([-rr*Math.cos(phi),rr*Math.sin(phi)*sg]);}
  const k1u=du,k1v=fn(u),k2u=du+.5*hS*k1v,k2v=fn(u+.5*hS*k1u),k3u=du+.5*hS*k2v,k3v=fn(u+.5*hS*k2u),k4u=du+hS*k3v,k4v=fn(u+hS*k3u);
  u+=hS/6*(k1u+2*k2u+2*k3u+k4u);du+=hS/6*(k1v+2*k2v+2*k3v+k4v);phi+=hS;
  if(u>=1){cap=true;pts.push([-Math.cos(phi),Math.sin(phi)*sg]);break;}if(u<=1/r0&&du<0)break;}
 return{pts,cap,b};}
function drawRays(cv,N,dist){const f=fit(cv);if(!f)return;const{ctx,w,h}=f;ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);grid(ctx,w,h,24);
 const k=w/30,cx=w*0.55,cy=h/2,bmax=Math.min(8,h/2/k*0.92),key=N+'|'+bmax.toFixed(2);
 if(rayC.key!==key){const paths=[];for(let i=0;i<N;i++){const b=-bmax+2*bmax*(i+0.5)/N;paths.push(geo(b));}rayC={key,paths};}
 ctx.setLineDash([3,4]);ctx.strokeStyle='rgba(232,240,250,0.25)';ctx.lineWidth=1;[-1,1].forEach(sg=>{const y=cy+sg*2.598*k;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(cx,y);ctx.stroke();});ctx.setLineDash([]);
 for(const p of rayC.paths){ctx.beginPath();p.pts.forEach((q,i)=>{const x=cx+q[0]*k,y=cy-q[1]*k;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle=p.cap?'rgba(255,92,100,0.8)':Math.abs(p.b)<3.4?'rgba(255,181,71,0.75)':'rgba(85,221,224,0.55)';ctx.lineWidth=1.1;ctx.stroke();}
 ctx.setLineDash([3,3]);ctx.strokeStyle='rgba(232,240,250,0.55)';ctx.beginPath();ctx.arc(cx,cy,1.5*k,0,TAU);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle='#000';ctx.beginPath();ctx.arc(cx,cy,k,0,TAU);ctx.fill();ctx.strokeStyle=C.red;ctx.beginPath();ctx.arc(cx,cy,k,0,TAU);ctx.stroke();
 label(ctx,'b꜀ = (3√3/2) Rs',6,cy-2.598*k-6,C.muted);label(ctx,'1.5 Rs',cx+1.5*k+4,cy-4,C.text);
 ctx.fillStyle=C.cyan;ctx.fillRect(4,cy-10,3,20);label(ctx,`OBSERVER SIDE (r = ${dist} Rs, off-panel)`,12,h-8,C.cyan);
}

function fmtTick(v){const a=Math.abs(v);return a>=1000?(v/1000).toFixed(1)+'k':a<1.5&&a>0?v.toFixed(2):String(Math.round(v));}
function chart(cv,sp){const f=fit(cv);if(!f||!sp)return;const{ctx,w,h}=f;ctx.clearRect(0,0,w,h);
 const L=30,R=6,T=6,B=16,pw=w-L-R,ph=h-T-B,mn=sp.min??0,mx=sp.max??100,xm=Math.max(1,sp.xmax||1);
 const X=i=>L+pw*i/xm,Y=v=>T+ph*(1-(clamp(v,mn,mx)-mn)/((mx-mn)||1));
 ctx.font='9px '+MONO;ctx.lineWidth=1;
 for(let i=0;i<=4;i++){const v=mn+(mx-mn)*i/4,y=Math.round(Y(v))+.5;ctx.strokeStyle='rgba(143,163,184,0.12)';ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(w-R,y);ctx.stroke();if(i%2===0){ctx.fillStyle=C.muted;ctx.textAlign='right';ctx.fillText(fmtTick(v),L-4,y+3);}}
 ctx.fillStyle=C.muted;ctx.textAlign='left';ctx.fillText('T+0h',L,h-4);ctx.textAlign='right';ctx.fillText('T+'+xm+'h',w-R,h-4);
 (sp.th||[]).forEach(t=>{const y=Y(t.v);ctx.setLineDash([3,3]);ctx.strokeStyle=t.c;ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(w-R,y);ctx.stroke();ctx.setLineDash([]);});
 let any=false;sp.series.forEach(s=>{const d=s.d;if(d.length<2)return;any=true;ctx.beginPath();d.forEach((v,i)=>{const x=X(i),y=Y(v);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle=s.c;ctx.lineWidth=1.4;ctx.stroke();if(s.fill){ctx.lineTo(X(d.length-1),Y(mn));ctx.lineTo(X(0),Y(mn));ctx.closePath();ctx.fillStyle=s.fill;ctx.fill();}});
 if(!any){ctx.textAlign='center';ctx.fillStyle='#4E6177';ctx.fillText('AWAITING SIMULATION DATA',L+pw/2,T+ph/2+3);}}
function tdChart(cv,r,rmax){const f=fit(cv);if(!f)return;const{ctx,w,h}=f;ctx.clearRect(0,0,w,h);rmax=rmax||20;
 const L=34,R=8,T=10,B=18,pw=w-L-R,ph=h-T-B,X=x=>L+pw*(x-1)/(rmax-1),Y=v=>T+ph*(1-v);
 ctx.font='9px '+MONO;ctx.lineWidth=1;
 [0,0.25,0.5,0.75,1].forEach(v=>{const y=Math.round(Y(v))+.5;ctx.strokeStyle='rgba(143,163,184,0.12)';ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(w-R,y);ctx.stroke();ctx.fillStyle=C.muted;ctx.textAlign='right';ctx.fillText(v.toFixed(2),L-4,y+3);});
 [1,3,5,10,15,20].filter(x=>x<=rmax).forEach(x=>{ctx.textAlign='center';ctx.fillStyle=C.muted;ctx.fillText(String(x),X(x),h-5);});
 ctx.textAlign='right';ctx.fillText('r / Rs',w-R,h-5+0);
 [[1.5,'photon sphere'],[3,'ISCO']].forEach(([x,t])=>{ctx.setLineDash([2,3]);ctx.strokeStyle='rgba(232,240,250,0.28)';ctx.beginPath();ctx.moveTo(X(x),T);ctx.lineTo(X(x),T+ph);ctx.stroke();ctx.setLineDash([]);ctx.textAlign='left';ctx.fillStyle=C.muted;ctx.fillText(t,X(x)+3,T+ph-4);});
 ctx.beginPath();for(let x=1;x<=rmax;x+=0.02){const y=Y(Math.sqrt(1-1/x));x===1?ctx.moveTo(X(x),y):ctx.lineTo(X(x),y);}ctx.strokeStyle=C.cyan;ctx.lineWidth=1.6;ctx.stroke();ctx.lineTo(X(rmax),Y(0));ctx.lineTo(X(1),Y(0));ctx.closePath();ctx.fillStyle='rgba(85,221,224,0.06)';ctx.fill();
 const v=Math.sqrt(Math.max(0,1-1/r)),mx=X(r),my=Y(v);ctx.setLineDash([3,3]);ctx.strokeStyle='rgba(255,181,71,0.7)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(mx,T+ph);ctx.lineTo(mx,my);ctx.lineTo(L,my);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle=C.amber;ctx.beginPath();ctx.arc(mx,my,4,0,TAU);ctx.fill();label(ctx,`r=${r.toFixed(2)}  dτ/dt=${v.toFixed(4)}`,Math.min(mx+8,w-170),my-8,C.amber);}
function gauge(cv,frac,col,th){const f=fit(cv);if(!f)return;const{ctx,w,h}=f;ctx.clearRect(0,0,w,h);
 const cx=w/2,cy=h/2+4,R=Math.min(w,h)/2-8,a0=Math.PI*0.75,a1=Math.PI*2.25;ctx.lineWidth=7;ctx.lineCap='butt';
 ctx.strokeStyle='#1B283B';ctx.beginPath();ctx.arc(cx,cy,R,a0,a1);ctx.stroke();
 ctx.strokeStyle=col;ctx.beginPath();ctx.arc(cx,cy,R,a0,a0+(a1-a0)*clamp(frac,0,1));ctx.stroke();
 ctx.lineWidth=1;ctx.strokeStyle='rgba(143,163,184,0.35)';for(let i=0;i<=10;i++){const a=a0+(a1-a0)*i/10;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*(R+5),cy+Math.sin(a)*(R+5));ctx.lineTo(cx+Math.cos(a)*(R+8),cy+Math.sin(a)*(R+8));ctx.stroke();}
 if(th!=null){const a=a0+(a1-a0)*clamp(th,0,1);ctx.strokeStyle=C.red;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*(R-6),cy+Math.sin(a)*(R-6));ctx.lineTo(cx+Math.cos(a)*(R+8),cy+Math.sin(a)*(R+8));ctx.stroke();}}
window.BHViz={node,angle,drawBH,drawSwarm,drawGRRT,drawRays,chart,tdChart,gauge,COL};
})();
