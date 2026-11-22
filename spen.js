/* S Pen Icons section (2026-11-08): a to-scale phone with a movable S Pen, six NMS icons for Samsung Good Lock Pentastic.
   Nothing is stored or sent: it all runs on the visitor's device. Text is plain English in the page, translated by lang.js. */
(function(){
var root=document.getElementById('spen'); if(!root) return;
var q=function(i){return document.getElementById(i)};
var D=[["ATLAS","The heart of the game.","#ff5a4a","assets/spen/1-atlas.webp","assets/spen/nms-spen-1-atlas.png"],
["PORTAL","The real glyph ring, Sunset at the top.","#00e5ff","assets/spen/2-portal.webp","assets/spen/nms-spen-2-portal.png"],
["ANOMALY","Home of every Traveller.","#c8d4e0","assets/spen/3-anomaly.webp","assets/spen/nms-spen-3-anomaly.png"],
["EXOTIC","A shuttle with a story.","#ffb36a","assets/spen/4-exotic.webp","assets/spen/nms-spen-4-exotic.png"],
["HELMET","Suit up, Traveller.","#ff4a3a","assets/spen/5-helmet.webp","assets/spen/nms-spen-5-helmet.png"],
["DRONE","Always watching. Reads clearly even tiny.","#00e5ff","assets/spen/6-drone.webp","assets/spen/nms-spen-6-drone.png"]];
var BG=["assets/spen/bg-1.webp","assets/spen/bg-2.webp","assets/spen/bg-3.webp","assets/spen/bg-4.webp"],bi=0;
var g=q('spGrid'),sc=q('spSc'),wrap=root.querySelector('.sp-phone'),tw=q('spTw'),pen=root.querySelector('.sp-pen'),fl=q('spFl'),ac=q('spAc');
var fi=5,pi=5,tgt='b',last=5;
D.forEach(function(d,i){var b=document.createElement('button');b.type='button';b.innerHTML='<img src="'+d[3]+'" alt="'+d[0]+'" loading="lazy" width="256" height="256">';b.onclick=function(){sel(i)};g.appendChild(b)});
function sel(i){var d=D[i];last=i;
 if(tgt!='p'){fi=i;q('spFlImg').src=d[3];q('spR1').src=d[3];fl.style.setProperty('--g',d[2]);q('spBigImg').src=d[3];q('spBigImg').style.setProperty('--g',d[2])}
 if(tgt!='f'){pi=i;q('spPtImg').src=d[3];q('spR2').src=d[3];q('spPt').style.setProperty('--g',d[2])}
 q('spNm').textContent=fi==pi?D[fi][0]:D[fi][0]+' + '+D[pi][0]+' pointer';
 q('spLn').textContent=fi==pi?D[fi][1]:'Different picture for the pen tip.';
 q('spDl').href=D[last][4];
 [].forEach.call(g.children,function(c,k){c.className=(k==fi?'on':'')+(k==pi&&pi!=fi?' on2':'')})}
[].forEach.call(q('spTg').querySelectorAll('button'),function(b){b.onclick=function(){tgt=b.getAttribute('data-t');[].forEach.call(q('spTg').querySelectorAll('button'),function(x){x.className=x===b?'on':''})}});
function setBg(){sc.style.backgroundImage='url('+BG[bi]+')';q('spBgn').textContent='WALLPAPER '+(bi+1)}
q('spBgn').onclick=function(e){e.preventDefault();bi=(bi+1)%BG.length;setBg()};
/* the pen: the whole phone is the drag surface, a tap anywhere is the pen tapping at its tip */
var tx=96,ty=170,pend=null,down=false,ox=0,oy=0,gx=0,gy=0,moved=false,onicon=false,lt=0,lx=0,ly=0;
function paint(){pend=null;tw.style.transform='translate3d('+tx+'px,'+ty+'px,0)';var L=110,ln=Math.max(-1,Math.min(1,(100-tx)/90)),dy=Math.max(L*.5,Math.min(L*.87,(sc.clientHeight||404)-ty-6)),dx=ln*Math.sqrt(Math.max(L*L-dy*dy,0));pen.style.transform='rotate('+(-Math.atan2(dx,dy)*180/Math.PI).toFixed(1)+'deg)'}
function mv(e){var r=sc.getBoundingClientRect();tx=Math.max(10,Math.min(r.width-10,e.clientX-r.left+ox));ty=Math.max(22,Math.min(r.height-50,e.clientY-r.top+oy));if(!pend)pend=requestAnimationFrame(paint)}
function inIcon(e){var b=fl.getBoundingClientRect();return e.clientX>=b.left-16&&e.clientX<=b.right+16&&e.clientY>=b.top-16&&e.clientY<=b.bottom+16}
function grab(e){var r=sc.getBoundingClientRect();ox=tx-(e.clientX-r.left);oy=ty-(e.clientY-r.top)}
function togAc(){ac.className=ac.className.indexOf('open')>-1?'sp-ac':'sp-ac open'}
function closeAc(){if(ac.className.indexOf('open')>-1)ac.className='sp-ac'}
function tapIcon(x,y){var n=Date.now();fl.classList.remove('tap');void fl.offsetWidth;fl.classList.add('tap');
 if(n-lt<600&&Math.abs(x-lx)<70&&Math.abs(y-ly)<70){togAc();lt=0}else{lt=n;lx=x;ly=y}}
wrap.addEventListener('pointerdown',function(e){down=true;moved=false;gx=e.clientX;gy=e.clientY;onicon=inIcon(e);try{wrap.setPointerCapture(e.pointerId)}catch(_){}grab(e);e.preventDefault()});
wrap.addEventListener('pointermove',function(e){if(!down)return;if(!moved){if(Math.abs(e.clientX-gx)+Math.abs(e.clientY-gy)<8)return;moved=true;closeAc();grab(e)}mv(e)});
wrap.addEventListener('pointerup',function(e){if(down&&!moved){var r=sc.getBoundingClientRect(),b=fl.getBoundingClientRect(),px=r.left+tx,py=r.top+ty;
  if(onicon)tapIcon(e.clientX,e.clientY);else if(px>=b.left-16&&px<=b.right+16&&py>=b.top-16&&py<=b.bottom+16)tapIcon(px,py)}down=false});
wrap.addEventListener('pointercancel',function(){down=false});
root.querySelector('details').addEventListener('toggle',paint);
/* "see it on a real Galaxy" pop-up */
var lb=q('spLb'),vid=q('spVid');
function tab(k){if(k=='v'){if(!vid.getAttribute('src'))vid.src='assets/spen/demo.mp4';try{vid.play()}catch(_){}}else{vid.pause()}
 q('spLp').style.display=k=='p'?'':'none';q('spLv').style.display=k=='v'?'':'none';q('spTp').className=k=='p'?'on':'';q('spTv').className=k=='v'?'on':''}
q('spSee').onclick=function(){if(window.nmsEv)nmsEv('spen/see-on-galaxy');var im=q('spReal');if(!im.getAttribute('src'))im.src='assets/spen/real.webp';lb.className='sp-lb on'};
function close(){lb.className='sp-lb';vid.pause();tab('p')}
q('spTp').onclick=function(){tab('p')};q('spTv').onclick=function(){tab('v')};q('spX').onclick=close;
lb.addEventListener('click',function(e){if(e.target===lb)close()});
document.addEventListener('keydown',function(e){if(e.key=='Escape')close()});
var au=null,cur=null,vol='';document.querySelectorAll('#spen .sp-sndp').forEach(function(b){b.addEventListener('click',function(){try{if(au)au.pause();if(cur===b){b.classList.remove('on');cur=null;return}if(cur)cur.classList.remove('on');au=new Audio(b.getAttribute('data-s').replace('.mp3',vol+'.mp3'));cur=b;b.classList.add('on');if(window.nmsEv)nmsEv('spen/sound-'+(b.getAttribute('data-s').indexOf('-out-')>-1?'out':'in')+(vol?'-quiet':'-normal'));au.onended=function(){b.classList.remove('on');cur=null};au.play()}catch(e){}})});
[].forEach.call(document.querySelectorAll('#spen .sp-vol button'),function(b){b.addEventListener('click',function(){vol=b.getAttribute('data-v');try{if(au)au.pause()}catch(_){}if(cur)cur.classList.remove('on');cur=null;[].forEach.call(b.parentNode.children,function(x){x.className=x===b?'on':''});[].forEach.call(document.querySelectorAll('#spen .sp-snd a[data-b]'),function(a){a.href=a.getAttribute('data-b')+vol+'.mp3'})})});
setBg();paint();sel(0);
})();
