# Marcos de estampilla de la dedicatoria: borde ondulado crema dibujado a alta resolución.
# Uso: python herramientas/marcos.py  (necesita Pillow y numpy; lee las fotos de img/new)
import sys, numpy as np
from PIL import Image, ImageOps, ImageDraw, ImageFilter
S="/tmp/"   # dónde dejar la vista previa
W,H=900,1060          # salida
SS=3                  # supersampling
CREMA=(246,240,226)
def contorno(w,h,margen,amp,lam,radio,fase=0.0,rng=None):
    # rectángulo redondeado recorrido por longitud de arco, desplazado sobre la normal
    x0,y0,x1,y1=margen,margen,w-margen,h-margen
    lados=[(x1-x0-2*radio),(y1-y0-2*radio)]
    per=2*sum(lados)+2*np.pi*radio
    n=round(per/lam)                            # números enteros de ondas: sin costura
    n2=round(n*1.9); n3=3
    f2,f3=rng.uniform(0,6.3,2)
    pts=[]; s=0.0
    N=6000
    for i in range(N):
        s=per*i/N; r=s
        segs=[("h",lados[0]),("c",np.pi*radio/2),("v",lados[1]),("c",np.pi*radio/2),
              ("h",lados[0]),("c",np.pi*radio/2),("v",lados[1]),("c",np.pi*radio/2)]
        # recorrido horario empezando arriba a la izquierda tras la esquina
        cx=[(x1-radio,y0+radio),(x1-radio,y1-radio),(x0+radio,y1-radio),(x0+radio,y0+radio)]
        k=0; ci=0
        for j,(t,L) in enumerate(segs):
            if r<=L: break
            r-=L
        if j==0: p=(x0+radio+r,y0); nrm=(0,-1)
        elif j==2: p=(x1,y0+radio+r); nrm=(1,0)
        elif j==4: p=(x1-radio-r,y1); nrm=(0,1)
        elif j==6: p=(x0,y1-radio-r); nrm=(-1,0)
        else:
            c=cx[(j-1)//2]; a0=[-np.pi/2,0,np.pi/2,np.pi][(j-1)//2]; a=a0+r/radio
            nrm=(np.cos(a),np.sin(a)); p=(c[0]+radio*nrm[0],c[1]+radio*nrm[1])
        u=2*np.pi*s/per                          # irregular a propósito, como papel cortado a mano
        d=amp*(np.sin(n*u+fase)+0.28*np.sin(n2*u+f2)+0.35*np.sin(n3*u+f3))
        pts.append((p[0]+nrm[0]*d,p[1]+nrm[1]*d))
    return pts
def marco(semilla):
    rng=np.random.default_rng(semilla)
    w,h=W*SS,H*SS
    forma=Image.new("L",(w,h),0)
    ImageDraw.Draw(forma).polygon(contorno(w,h,18*SS,8*SS,105*SS,26*SS,fase=rng.uniform(0,6),rng=rng),fill=255)
    forma=forma.resize((W,H),Image.LANCZOS)
    # papel: crema con grano muy suave
    grano=rng.normal(0,2.2,(H,W,1))
    papel=np.clip(np.array(CREMA,float)[None,None,:]+grano,0,255).astype(np.uint8)
    papel=Image.fromarray(papel).convert("RGBA"); papel.putalpha(forma)
    # filo: una línea tenue dentro del borde para que el papel tenga canto
    filo=forma.filter(ImageFilter.MinFilter(3)); borde=Image.fromarray(np.clip(np.array(forma,int)-np.array(filo,int),0,255).astype(np.uint8))
    sombra_filo=Image.new("RGBA",(W,H),(150,140,120,0)); sombra_filo.putalpha(borde.point(lambda v:v*0.35))
    papel.alpha_composite(sombra_filo)
    return papel
VENTANA=(58,60,W-58,H-110)   # izquierda, arriba, derecha, abajo: más papel abajo, como polaroid
def hacer(n,y0,semilla,out,giro=0.0):
    fr=marco(semilla)
    ph=ImageOps.exif_transpose(Image.open(f"img/new/IMG_{n}.JPG.jpeg")).convert("RGB")
    x0,y0w,x1,y1=VENTANA; w,h=x1-x0,y1-y0w; r=w/h
    if ph.width/ph.height>r:
        cw=round(ph.height*r); x=round((ph.width-cw)/2); ph=ph.crop((x,0,x+cw,ph.height))
    else:
        ch=round(ph.width/r); y=round((ph.height-ch)*y0); ph=ph.crop((0,y,ph.width,y+ch))
    ph=ph.resize((w,h),Image.LANCZOS).convert("RGBA")
    # foto "pegada": sombra interior finita en su orilla
    d=ImageDraw.Draw(ph,"RGBA")
    for i,al in enumerate((60,28,12)):
        d.rectangle((i,i,w-1-i,h-1-i),outline=(40,36,28,al))
    # un poquito chueca dentro del marco, como en las originales
    g=ph.resize((w*SS,h*SS),Image.LANCZOS).rotate(giro,Image.BICUBIC,expand=True)
    g=g.resize((round(g.width/SS),round(g.height/SS)),Image.LANCZOS)
    cx,cy=(x0+x1)/2,(y0w+y1)/2
    fr.alpha_composite(g,(round(cx-g.width/2),round(cy-g.height/2)))
    fr.save(out,"WEBP",quality=84,method=6); return fr
a=hacer("9654",0.25,3,"img/fotos/polaroid-1.webp",giro=1.2)
b=hacer("9681",0.0,8,"img/fotos/polaroid-2.webp",giro=-1.0)
v=Image.new("RGB",(W*2+30,H),(95,99,71)); v.paste(a,(0,0),a); v.paste(b,(W+30,0),b); v.thumbnail((1400,1400)); v.save(S+"sellos.jpg",quality=88)
