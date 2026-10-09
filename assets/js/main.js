(function(){
"use strict";
var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var fine = window.matchMedia('(pointer: fine)').matches;
var G = window.gsap, ST = window.ScrollTrigger, T = window.THREE;
var hasG = !!G;
if (hasG && ST) G.registerPlugin(ST);
var $ = function(s, r){ return (r || document).querySelector(s); };
var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var TEAL = 0x2ED8DC, ORANGE = 0xE2764E, STONE = 0xE9D3AE, BLUSH = 0xEBC9C4, OLIVE = 0x9A954F;

var STAGES = ['Problem','Requirements','Architecture','Software','Intelligence','Validation','Product'];
var IND = [
 {k:'Healthcare', s:['Clinic staff retype patient intake forms by hand.','Accurate fields, privacy rules, and a person who signs off.','A forms service, an extraction step and a review queue.','An intake portal, a records sync and an audit log.','AI reads documents into structured fields. It never decides alone.','Low-confidence fields go to a person; results are checked against known records.','Faster intake, with a person approving every record.']},
 {k:'Logistics', s:['Dispatchers juggle orders across email, calls and spreadsheets.','One source of truth, live status, no lost orders.','An order service, an event pipeline and a dispatcher view.','A unified order inbox, routing rules and live tracking.','AI turns free-text requests into structured orders.','Rules in code check every order; edge cases are flagged.','One inbox where every order is tracked end to end.']},
 {k:'Finance', s:['Analysts spend days pulling figures out of long reports.','Traceable numbers, strict data boundaries, an audit trail.','A document store, a retrieval layer, calculations in code.','A report workspace with permissions and export.','AI finds and cites the passages. The maths stays deterministic.','Every figure links to its source; every calculation is tested.','Answers an analyst can verify in one click.']},
 {k:'Education', s:['Teachers rewrite feedback for every assignment from scratch.','Feedback tied to the rubric, with the teacher in control.','A rubric model, a submission pipeline and a review screen.','A class dashboard, submissions and gradebook sync.','AI drafts rubric-based feedback for the teacher to edit.','Drafts are compared with feedback teachers wrote themselves.','Feedback that is quicker to give and still the teacher\u2019s own.']},
 {k:'Retail', s:['Shoppers can\u2019t find the right product in a large catalogue.','Relevant results, real stock levels, fast responses.','A catalogue index, a retrieval layer and a search service.','Search, filters and analytics in the storefront.','AI understands what shoppers mean, not only their keywords.','Tested on real queries; stock is always checked in code.','Search that answers the question the shopper actually asked.']},
 {k:'Media', s:['Teams lose hours rewatching long videos for key moments.','Works with or without captions, grounded in the source.','A media pipeline with a transcript path and a visual path.','An upload flow, a library and sharing.','AI analyses speech and visuals into summaries and timestamps.','Every summary point links back to a moment in the video.','Long video, understood without watching all of it.']}
];
var THINK = [
 {n:'Understand', f:'Users · Workflows · Friction', l:'Before any solution, the real situation and the people in it.', q:['What is actually happening?','Who is experiencing the problem?','Where does the friction exist?']},
 {n:'Define', f:'Requirements · Constraints · Success criteria', l:'Turning a situation into requirements and constraints a system can meet.', q:['What does the system actually need to accomplish?','What are the requirements and constraints?']},
 {n:'Design', f:'Architecture · Data flow · Software, AI or deterministic logic', l:'Designing the architecture and data flow, and deciding the role of each part. AI is one option here, not the default.', q:['What should the solution look like?','What belongs in software, and what belongs in AI?','What should remain deterministic?']},
 {n:'Build', f:'Frontend · Backend · APIs · Data · Deployment', l:'Turning the design into working software, with any intelligent parts built into it.', q:['What is the smallest version that proves the design?','How do the software and the intelligence fit together?']},
 {n:'Validate', f:'Behaviour · Reliability · Edge cases · AI output checks', l:'Making sure the whole system works for real, not just once.', q:['Does it behave as intended, reliably?','Are the outputs right, and what happens at the edges?','Which assumptions turned out to be wrong?']},
 {n:'Improve', f:'Observation · Performance · Iteration', l:'Observing what happens in reality, then iterating. This leads back to Understand.', q:['What are people actually doing with it?','What should change next, and why?']}
];
var CONS = [
 ['Security','Who can access what, and what happens when input is hostile?'],
 ['Reliability','What breaks, how will I know, and what does the system do next?'],
 ['Cost','What does it cost at ten users, and at ten thousand?'],
 ['Latency','What must feel instant, and what can wait?'],
 ['Scalability','Which parts grow with use, and which can stay simple?'],
 ['Data Boundaries','Where can data travel, and where must it stop?'],
 ['Failure Modes','Models fail differently from code. Is there a plan for both?'],
 ['Usability','Can the people it\u2019s for actually use it?']
];

/* ---------- header & menu ---------- */
var hdr = $('#hdr'), menuBtn = $('#menuBtn'), lastY = window.scrollY;
window.addEventListener('scroll', function(){
  var y = window.scrollY;
  hdr.classList.toggle('scrolled', y > 20);
  if (!document.body.classList.contains('menu-open')) hdr.classList.toggle('hide', y > lastY && y > 400);
  lastY = y;
}, {passive:true});
function setMenu(open){
  document.body.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.body.style.overflow = open ? 'hidden' : '';
  if (open && hasG && !reduce) G.fromTo('#sheet a', {y:24, autoAlpha:0}, {y:0, autoAlpha:1, duration:.6, stagger:.06, ease:'power3.out'});
}
menuBtn.addEventListener('click', function(){ setMenu(!document.body.classList.contains('menu-open')); });
$$('#sheet a').forEach(function(a){ a.addEventListener('click', function(){ setMenu(false); }); });
document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); } });

/* ---------- shared 3D helpers ---------- */
function glowTexture(){
  var c = document.createElement('canvas'); c.width = c.height = 64;
  var g = c.getContext('2d'), gr = g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.25,'rgba(255,255,255,.8)'); gr.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0,0,64,64);
  var t = new T.CanvasTexture(c); return t;
}
function makeRenderer(canvas){
  try {
    var r = new T.WebGLRenderer({canvas:canvas, alpha:true, antialias:true, powerPreference:'high-performance'});
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    r.setClearColor(0x000000, 0);
    return r;
  } catch(e){ return null; }
}
function whenVisible(el, cb){
  if (!('IntersectionObserver' in window)) { cb(true); return; }
  new IntersectionObserver(function(es){ cb(es[0].isIntersecting); }, {rootMargin:'100px'}).observe(el);
}
var mouse = {x:0, y:0};
window.addEventListener('pointermove', function(e){ mouse.x = e.clientX / window.innerWidth * 2 - 1; mouse.y = -(e.clientY / window.innerHeight * 2 - 1); }, {passive:true});

/* ---------- 1b. Hero portrait: 2.5D tilt on hover ---------- */
(function portrait(){
  var stage = $('#meStage'), card = $('#meCard'), sway = $('#meSway'), sheen = $('#meSheen'), hero = $('#top');
  if (!stage || !hasG || reduce) return;
  var ry = G.quickTo(card, 'rotationY', {duration:.6, ease:'power3.out'});
  var rx = G.quickTo(card, 'rotationX', {duration:.6, ease:'power3.out'});
  var tx = G.quickTo(card, 'x', {duration:.8, ease:'power3.out'});
  var sx = {v:50}, sxTo = G.quickTo(sx, 'v', {duration:.6, ease:'power3.out', onUpdate:function(){ sheen.style.setProperty('--sx', sx.v + '%'); }});
  var inside = false;
  var idle = G.to(sway, {rotationY:3, duration:3.2, ease:'sine.inOut', yoyo:true, repeat:-1, paused:true});
  G.set(sway, {rotationY:-3}); idle.play();
  hero.addEventListener('pointermove', function(e){
    var r = stage.getBoundingClientRect(), pad = 40;
    var hit = e.clientX > r.left - pad && e.clientX < r.right + pad && e.clientY > r.top && e.clientY < r.bottom;
    if (hit){
      if (!inside){ inside = true; idle.pause(); G.to(sway, {rotationY:0, duration:.5, ease:'power2.out'}); }
      var nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width/2)) / (r.width/2)));
      var ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height*.35)) / (r.height/2)));
      ry(nx*14); rx(-ny*4); tx(nx*8); sxTo(50 + nx*45);
    } else if (inside){ leave(); }
  });
  function leave(){
    inside = false;
    G.to(card, {rotationY:0, rotationX:0, x:0, duration:1.2, ease:'elastic.out(1,.5)', overwrite:'auto'});
    sxTo(50);
    G.delayedCall(.8, function(){ if (!inside) idle.play(); });
  }
  hero.addEventListener('pointerleave', function(){ if (inside) leave(); });
})();

/* ---------- 2. Process engine: braided helix with seven rings ---------- */
var helix = (function(){
  if (!T) return null;
  var wrap = $('#helixWrap'), canvas = $('#helix'), r = makeRenderer(canvas); if (!r) return null;
  var scene = new T.Scene(), cam = new T.PerspectiveCamera(30, 1, .1, 100);
  scene.add(new T.AmbientLight(0xEADBC2, .55));
  var dl = new T.DirectionalLight(0xffffff, .7); dl.position.set(2,4,6); scene.add(dl);
  var pT = new T.PointLight(TEAL, 1.4, 20); pT.position.set(-4,2,3); scene.add(pT);
  var pO = new T.PointLight(ORANGE, 1.2, 20); pO.position.set(4,-1,3); scene.add(pO);
  var braid = new T.Group(); scene.add(braid);
  var L = 12, R = .42, K = Math.PI*2/3.2;
  [0,1].forEach(function(s){
    var phase = s*Math.PI, color = s ? ORANGE : TEAL;
    var mat = new T.MeshStandardMaterial({color:color, emissive:color, emissiveIntensity:.28, roughness:.45, metalness:.25});
    for (var f=0; f<7; f++){
      var fr = .03 + (f%3)*.035, fp = f/7*Math.PI*2, pts = [];
      for (var i=0;i<=220;i++){
        var x = -L/2 + L*i/220, ang = K*x + phase;
        var cy = Math.cos(ang)*R, cz = Math.sin(ang)*R;
        var tw = x*5 + fp;
        pts.push(new T.Vector3(x, cy + Math.cos(tw)*fr, cz + Math.sin(tw)*fr));
      }
      var tube = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 260, .011, 5, false), mat);
      braid.add(tube);
    }
  });
  var tex = glowTexture(), rings = [], glows = [], ringX = [];
  for (var i=0;i<7;i++){
    var x = -4.5 + i*1.5; ringX.push(x);
    var g = new T.Group(); g.position.x = x;
    var rm = new T.MeshStandardMaterial({color:0xEFDDBF, emissive: i===4?ORANGE:TEAL, emissiveIntensity:.15, roughness:.15, metalness:.6, transparent:true, opacity:.8});
    var torus = new T.Mesh(new T.TorusGeometry(.78, .018, 16, 120), rm); torus.rotation.y = Math.PI/2; g.add(torus);
    var disc = new T.Mesh(new T.CircleGeometry(.77, 64), new T.MeshBasicMaterial({color: i===4?ORANGE:TEAL, transparent:true, opacity:.035, side:T.DoubleSide, depthWrite:false}));
    disc.rotation.y = Math.PI/2; g.add(disc);
    var sp = new T.Sprite(new T.SpriteMaterial({map:tex, color: i===4?ORANGE:TEAL, transparent:true, opacity:0, blending:T.AdditiveBlending, depthWrite:false}));
    sp.scale.set(3.2,3.2,1); g.add(sp);
    scene.add(g); rings.push({g:g, m:rm, d:disc}); glows.push(sp);
  }
  var dust = new T.BufferGeometry(), DN = 500, dp = new Float32Array(DN*3);
  for (var d=0; d<DN; d++){ dp[d*3]=(Math.random()-.5)*14; dp[d*3+1]=(Math.random()-.5)*4; dp[d*3+2]=(Math.random()-.5)*4; }
  dust.setAttribute('position', new T.BufferAttribute(dp,3));
  scene.add(new T.Points(dust, new T.PointsMaterial({size:.04, color:0xE9D3AE, transparent:true, opacity:.5, map:tex, blending:T.AdditiveBlending, depthWrite:false})));

  var labelsEl = $('#labels'), labelBtns = [];
  function size(){
    var w = wrap.clientWidth, h = wrap.clientHeight;
    r.setSize(w, h, false); cam.aspect = w/h;
    var fitW = 11.2, fov = cam.fov*Math.PI/180;
    var dist = (fitW/2) / Math.tan(fov/2) / cam.aspect;
    cam.position.set(0, .9, Math.max(7, dist)); cam.lookAt(0, -.15, 0); cam.updateProjectionMatrix();
  }
  size(); window.addEventListener('resize', size);
  var v = new T.Vector3(), active = 0;
  function placeLabels(){
    if (!labelBtns.length) return;
    var w = wrap.clientWidth, h = wrap.clientHeight;
    for (var i=0;i<7;i++){
      v.set(ringX[i], (i%2 ? -1.15 : 1.15), 0).project(cam);
      labelBtns[i].style.transform = 'translate(' + ((v.x*.5+.5)*w) + 'px,' + ((-v.y*.5+.5)*h) + 'px) translate(-50%,-50%)';
    }
  }
  function setActive(k){
    active = k;
    rings.forEach(function(o,i){
      var on = i === k, done = i <= k;
      var ei = on ? 1.4 : (done ? .5 : .12), sc = on ? 1.14 : 1;
      if (hasG && !reduce){ G.to(o.m, {emissiveIntensity:ei, duration:.7}); G.to(o.g.scale, {x:sc, y:sc, z:sc, duration:.8, ease:'power3.out'}); G.to(glows[i].material, {opacity: on ? .75 : (done ? .14 : 0), duration:.7}); G.to(o.d.material, {opacity: on?.12:.035, duration:.7}); }
      else { o.m.emissiveIntensity = ei; o.g.scale.setScalar(sc); glows[i].material.opacity = on?.75:(done?.14:0); }
    });
    if (hasG && !reduce) G.to(cam.position, {x: ringX[k]*.12, duration:1.4, ease:'power3.inOut'});
  }
  var vis = true, raf = 0, t0 = performance.now();
  function loop(now){
    raf = 0; if (!vis) return;
    var t = (now - t0)/1000;
    if (!reduce){ braid.rotation.x = t*.35; scene.rotation.y = mouse.x*.06; scene.rotation.x = -mouse.y*.04; }
    cam.lookAt(cam.position.x*0.6, -.15, 0);
    placeLabels();
    r.render(scene, cam);
    if (!reduce) raf = requestAnimationFrame(loop);
  }
  whenVisible(wrap, function(on){ vis = on; if (on && !raf) raf = requestAnimationFrame(loop); });
  raf = requestAnimationFrame(loop);
  return {setActive:setActive, attach:function(btns){ labelBtns = btns; placeLabels(); }, redraw:function(){ if(!raf) raf = requestAnimationFrame(loop); }};
})();

/* ---------- engine UI ---------- */
var indWrap = $('#industries'), labels = $('#labels'), listStages = $('#listStages');
var roInd = $('#roInd'), roStage = $('#roStage'), roText = $('#roText'), personal = $('#personal');
var cur = {ind:0, st:0, playing:!reduce, chosen:false};
IND.forEach(function(d, idx){
  var b = document.createElement('button'); b.type='button'; b.setAttribute('role','tab'); b.textContent = d.k;
  b.addEventListener('click', function(){ cur.chosen = true; pause(); setInd(idx); });
  indWrap.appendChild(b);
});
var other = document.createElement('a'); other.href = '#contact'; other.textContent = 'Not listed? Same process →'; indWrap.appendChild(other);
var stageBtns = [], listBtns = [];
STAGES.forEach(function(name, idx){
  var b = document.createElement('button'); b.type='button'; b.className = 'stage' + (idx===4?' ai':''); b.setAttribute('role','tab');
  b.innerHTML = '<span class="k">0'+(idx+1)+'</span><span class="l">'+name+'</span>';
  b.addEventListener('click', function(){ pause(); setStage(idx); });
  labels.appendChild(b); stageBtns.push(b);
  var lb = document.createElement('button'); lb.type='button'; lb.className = idx===4?'ai':''; lb.setAttribute('role','tab'); lb.textContent = '0'+(idx+1)+' '+name;
  lb.addEventListener('click', function(){ pause(); setStage(idx); });
  listStages.appendChild(lb); listBtns.push(lb);
});
if (helix) helix.attach(stageBtns);
else { labels.style.display = 'none'; listStages.style.display = 'grid'; }
var indBtns = $$('button', indWrap);
function render(anim){
  indBtns.forEach(function(b,k){ b.setAttribute('aria-selected', k===cur.ind?'true':'false'); });
  [stageBtns, listBtns].forEach(function(set){ set.forEach(function(b,k){ b.classList.toggle('on', k===cur.st); b.setAttribute('aria-selected', k===cur.st?'true':'false'); }); });
  roInd.textContent = IND[cur.ind].k; roStage.textContent = STAGES[cur.st]; roText.textContent = IND[cur.ind].s[cur.st];
  if (anim && hasG && !reduce) G.fromTo([roStage, roText], {y:10, autoAlpha:0}, {y:0, autoAlpha:1, duration:.55, stagger:.05, ease:'power3.out'});
  if (helix) helix.setActive(cur.st);
  if (helix && reduce) helix.redraw();
  if (cur.chosen) personal.textContent = 'Working on something in ' + IND[cur.ind].k.toLowerCase() + '? Let\u2019s start with the problem.';
}
function setStage(s){ cur.st = s; render(true); }
function setInd(k){ cur.ind = k; cur.st = 0; render(true); }
var timer = null;
function tick(){
  if (!cur.playing) return;
  if (cur.st < 6){ setStage(cur.st+1); timer = setTimeout(tick, cur.st===6 ? 3200 : 1800); }
  else { setInd((cur.ind+1) % IND.length); timer = setTimeout(tick, 2000); }
}
var playBtn = $('#playBtn'), playIcon = $('#playIcon');
function pause(){ cur.playing = false; clearTimeout(timer); playBtn.setAttribute('aria-label','Play walkthrough'); playIcon.setAttribute('d','M3 1.5l9 5.5-9 5.5z'); }
function play(){ cur.playing = true; playBtn.setAttribute('aria-label','Pause walkthrough'); playIcon.setAttribute('d','M3 2h3v10H3zM8 2h3v10H8z'); clearTimeout(timer); timer = setTimeout(tick, 900); }
playBtn.addEventListener('click', function(){ cur.playing ? pause() : play(); });
if (reduce) pause();
render(false);
if ('IntersectionObserver' in window){ new IntersectionObserver(function(es){ clearTimeout(timer); if (es[0].isIntersecting && cur.playing) timer = setTimeout(tick, 1400); }).observe($('.stagebox')); }

/* ---------- 3. Philosophy: the core inside the constraints ---------- */
(function cage(){
  var host = $('#cage');
  if (!T){ host.classList.add('no3d'); return; }
  var canvas = $('#cageCanvas'), r = makeRenderer(canvas); if (!r){ host.classList.add('no3d'); return; }
  var scene = new T.Scene(), cam = new T.PerspectiveCamera(34, 1, .1, 100); cam.position.set(0, .4, 8.2); cam.lookAt(0,0,0);
  scene.add(new T.AmbientLight(0xE9D3AE, .6));
  var dl = new T.DirectionalLight(0xffffff, .9); dl.position.set(3,5,6); scene.add(dl);
  var pl = new T.PointLight(ORANGE, 2, 8); scene.add(pl);
  var root = new T.Group(); scene.add(root);
  var S = 1.45, verts = [];
  for (var i=0;i<8;i++) verts.push(new T.Vector3(i&1?S:-S, i&2?S:-S, i&4?S:-S));
  var frameMat = new T.MeshStandardMaterial({color:0x8A8540, emissive:0x2C2A12, emissiveIntensity:.6, roughness:.32, metalness:.8});
  var up = new T.Vector3(0,1,0);
  for (var a=0;a<8;a++) for (var b=a+1;b<8;b++){
    var d = verts[a].clone().sub(verts[b]); if (Math.abs(d.length() - 2*S) > .01) continue;
    var len = d.length(), cyl = new T.Mesh(new T.CylinderGeometry(.03,.03,len,12), frameMat);
    cyl.position.copy(verts[a]).add(verts[b]).multiplyScalar(.5);
    cyl.quaternion.setFromUnitVectors(up, d.normalize()); root.add(cyl);
  }
  verts.forEach(function(p){ var s = new T.Mesh(new T.SphereGeometry(.13, 24, 16), frameMat); s.position.copy(p); root.add(s); });
  var tex = glowTexture();
  var N = window.innerWidth < 720 ? 2600 : 4200, pos = new Float32Array(N*3), col = new Float32Array(N*3);
  var cT = new T.Color(TEAL), cO = new T.Color(ORANGE), cW = new T.Color(STONE), cB = new T.Color(BLUSH);
  for (var n=0;n<N;n++){
    var side = n%2 ? 1 : -1, u = Math.random()*Math.PI*2, w = Math.acos(2*Math.random()-1);
    var shell = Math.random() < .7 ? 1 : Math.cbrt(Math.random());
    var g = 1 + .07*Math.sin(u*9)*Math.sin(w*7);
    var x = side*.33 + Math.sin(w)*Math.cos(u)*.5*g*shell, y = Math.cos(w)*.56*g*shell, z = Math.sin(w)*Math.sin(u)*.82*g*shell;
    pos[n*3]=x; pos[n*3+1]=y; pos[n*3+2]=z;
    var mix = Math.sin(u*3 + w*4) > .25 ? cO : (Math.random() < .18 ? cW : (Math.random() < .2 ? cB : cT));
    col[n*3]=mix.r; col[n*3+1]=mix.g; col[n*3+2]=mix.b;
  }
  var cg = new T.BufferGeometry(); cg.setAttribute('position', new T.BufferAttribute(pos,3)); cg.setAttribute('color', new T.BufferAttribute(col,3));
  var core = new T.Points(cg, new T.PointsMaterial({size:.05, map:tex, vertexColors:true, transparent:true, opacity:.9, blending:T.AdditiveBlending, depthWrite:false}));
  root.add(core);
  var halo = new T.Sprite(new T.SpriteMaterial({map:tex, color:BLUSH, transparent:true, opacity:.22, blending:T.AdditiveBlending, depthWrite:false})); halo.scale.set(4,4,1); root.add(halo);
  verts.forEach(function(p, vi){
    for (var q=0;q<3;q++){
      var target = new T.Vector3((Math.random()-.5)*.9, (Math.random()-.5)*.9, (Math.random()-.5)*1.1);
      var mid = p.clone().multiplyScalar(.5).add(new T.Vector3((Math.random()-.5)*.6,(Math.random()-.5)*.6,(Math.random()-.5)*.6));
      var cv = new T.QuadraticBezierCurve3(p, mid, target);
      root.add(new T.Line(new T.BufferGeometry().setFromPoints(cv.getPoints(40)), new T.LineBasicMaterial({color: (vi+q)%3 ? ORANGE : TEAL, transparent:true, opacity:.42, blending:T.AdditiveBlending, depthWrite:false})));
    }
  });
  var labelEl = $('#vlabels'), names = CONS.map(function(c){ return c[0]; }), vl = [];
  names.forEach(function(n){ var s = document.createElement('span'); s.className = 'vlabel'; s.textContent = n; labelEl.appendChild(s); vl.push(s); });
  function size(){ var w = host.clientWidth, h = host.clientHeight; r.setSize(w, h, false); cam.aspect = w/h; cam.updateProjectionMatrix(); }
  size(); window.addEventListener('resize', size);
  var rot = {x:-.35, y:.6}, vel = {x:0, y:.0035}, drag = null;
  canvas.addEventListener('pointerdown', function(e){ drag = {x:e.clientX, y:e.clientY}; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', function(e){ if (!drag) return; var dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag = {x:e.clientX, y:e.clientY}; vel.y = dx*.006; vel.x = dy*.004; rot.y += vel.y; rot.x = Math.max(-1, Math.min(1, rot.x + vel.x)); });
  function end(){ drag = null; }
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  var v = new T.Vector3(), vis = true, raf = 0, t0 = performance.now();
  function loop(now){
    raf = 0; if (!vis) return;
    var t = (now - t0)/1000;
    if (!drag && !reduce){ vel.y += (.0035 - vel.y)*.02; vel.x *= .92; rot.y += vel.y; rot.x += vel.x; }
    root.rotation.set(rot.x, rot.y, 0);
    var pulse = reduce ? 1 : 1 + Math.sin(t*1.6)*.03; core.scale.setScalar(pulse); halo.material.opacity = .18 + (pulse-1)*2;
    root.updateMatrixWorld();
    var w = host.clientWidth, h = host.clientHeight;
    verts.forEach(function(p,i){
      v.copy(p).applyMatrix4(root.matrixWorld); var depth = v.z; v.project(cam);
      vl[i].style.transform = 'translate(' + ((v.x*.5+.5)*w) + 'px,' + ((-v.y*.5+.5)*h - 22) + 'px) translate(-50%,-50%)';
      vl[i].style.opacity = depth > -.5 ? 1 : .35;
    });
    r.render(scene, cam);
    if (!reduce || drag) raf = requestAnimationFrame(loop);
  }
  whenVisible(host, function(on){ vis = on; if (on && !raf) raf = requestAnimationFrame(loop); });
  if (reduce) canvas.addEventListener('pointermove', function(){ if (drag && !raf) raf = requestAnimationFrame(loop); });
  raf = requestAnimationFrame(loop);
})();

/* ---------- work accordion ---------- */
var projs = $$('.proj');
function openProj(idx, mode){
  projs.forEach(function(p, k){
    var btn = $('.proj-btn', p), panel = $('.proj-panel', p);
    var isOpen = p.classList.contains('open');
    var willOpen = k === idx && !(isOpen && mode === 'toggle');
    if (willOpen === isOpen) return;
    p.classList.toggle('open', willOpen);
    btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    btn.setAttribute('data-cursor', willOpen ? 'Close' : 'Open');
    if (willOpen){
      panel.hidden = false;
      if (hasG && !reduce){
        G.fromTo(panel, {height:0}, {height:'auto', duration:.85, ease:'power3.inOut', onComplete:function(){ if (ST) ST.refresh(); }});
        G.fromTo($$('.proj-visual,.desc,.plain,.rolebox,.dia .n,.dia .c,.dia-note,.pts li', panel), {y:18, autoAlpha:0}, {y:0, autoAlpha:1, duration:.7, stagger:.035, delay:.15, ease:'power3.out'});
      }
    } else {
      if (hasG && !reduce) G.to(panel, {height:0, duration:.55, ease:'power3.inOut', onComplete:function(){ panel.hidden = true; panel.style.height = ''; if (ST) ST.refresh(); }});
      else panel.hidden = true;
    }
  });
}
projs.forEach(function(p, k){ $('.proj-btn', p).addEventListener('click', function(){ openProj(k, 'toggle'); }); });
$$('[data-open]').forEach(function(a){ a.addEventListener('click', function(){ openProj(parseInt(a.getAttribute('data-open'),10)); }); });

/* ---------- How I Think ---------- */
var tp = $('#tpanels'), dialRot = $('#dialRot'), bars = $('#thinkBars');
THINK.forEach(function(t, k){
  var d = document.createElement('div'); d.className = 'tpanel panel brk'; d.setAttribute('role','group'); d.setAttribute('aria-label','Stage '+(k+1)+': '+t.n);
  d.innerHTML = '<span class="mono">Stage 0'+(k+1)+' / 06</span><h3>'+t.n+'</h3><p class="tl">'+t.l+'</p><p class="tf mono">'+t.f+'</p><ul>'+t.q.map(function(q){ return '<li>'+q+'</li>'; }).join('')+'</ul>';
  tp.appendChild(d);
  var ang = -Math.PI/2 + k*Math.PI/3, x = 50 + 38*Math.cos(ang), y = 50 + 38*Math.sin(ang);
  var b = document.createElement('button'); b.type = 'button'; b.className = 'dnode' + (k===0?' on':''); b.style.left = x+'%'; b.style.top = y+'%';
  b.innerHTML = '<small>0'+(k+1)+'</small><span>'+t.n+'</span>'; b.setAttribute('aria-label','Go to '+t.n);
  dialRot.appendChild(b);
  var bar = document.createElement('i'); bar.innerHTML = '<b></b>'; bars.appendChild(bar);
});
var tpanels = $$('.tpanel', tp), dnodes = $$('.dnode', dialRot), barFills = $$('b', bars);
var thinkIdx = -1, thinkST = null;
function setThink(k){
  if (k === thinkIdx) return; thinkIdx = k;
  dnodes.forEach(function(n,j){ n.classList.toggle('on', j===k); });
  $('#dialName').textContent = THINK[k].n; $('#dialN').textContent = 'Stage '+(k+1)+' / 6';
  if (!hasG || reduce){ tpanels.forEach(function(p,j){ p.style.visibility = j===k ? 'visible' : 'hidden'; }); dialRot.style.transform = 'rotate('+(-k*60)+'deg)'; dnodes.forEach(function(n){ n.style.transform = 'translate(-50%,-50%) rotate('+(k*60)+'deg)'; }); return; }
  G.to(dialRot, {rotation:-k*60, duration:.9, ease:'power3.inOut', overwrite:'auto'});
  G.to(dnodes, {rotation:k*60, duration:.9, ease:'power3.inOut', overwrite:'auto'});
  tpanels.forEach(function(p,j){
    if (j===k) G.fromTo(p, {autoAlpha:0, y:24}, {autoAlpha:1, y:0, duration:.6, ease:'power3.out', overwrite:'auto'});
    else G.to(p, {autoAlpha:0, y:-16, duration:.35, ease:'power2.in', overwrite:'auto'});
  });
  G.fromTo($$('li', tpanels[k]), {autoAlpha:0, x:-12}, {autoAlpha:1, x:0, duration:.5, stagger:.07, delay:.15, ease:'power3.out'});
}
dnodes.forEach(function(n,k){ n.addEventListener('click', function(){
  if (thinkST){ window.scrollTo({top: thinkST.start + (thinkST.end - thinkST.start)*(k/5) + 2, behavior: reduce?'auto':'smooth'}); }
  else setThink(k);
}); });

/* ---------- constraints ---------- */
var checks = $('#checks');
CONS.forEach(function(c, i){
  var d = document.createElement('div'); d.className = 'check panel';
  d.innerHTML = '<div class="top"><span class="mono">C.0'+(i+1)+'</span><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="11" stroke-width="1"/><path d="M7 12.5l3.2 3.2L17 9" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div><h3>'+c[0]+'</h3><p>'+c[1]+'</p><div class="bar"><i></i></div>';
  checks.appendChild(d);
});

/* ---------- cursor, magnetic, spotlight ---------- */
if (fine && !reduce && hasG){
  document.documentElement.classList.add('has-cursor');
  var cEl = $('#cursor'), lab = $('#cursorLabel');
  var qx = G.quickTo(cEl, 'x', {duration:.35, ease:'power3'}), qy = G.quickTo(cEl, 'y', {duration:.35, ease:'power3'});
  window.addEventListener('pointermove', function(e){ qx(e.clientX); qy(e.clientY); }, {passive:true});
  document.addEventListener('pointerover', function(e){ var t = e.target.closest('[data-cursor]'); if (t){ lab.textContent = t.getAttribute('data-cursor'); cEl.classList.add('big'); } });
  document.addEventListener('pointerout', function(e){ var t = e.target.closest('[data-cursor]'); if (t && !t.contains(e.relatedTarget)) cEl.classList.remove('big'); });
  $$('.magnetic').forEach(function(m){
    var mx = G.quickTo(m, 'x', {duration:.5, ease:'power3'}), my = G.quickTo(m, 'y', {duration:.5, ease:'power3'});
    m.addEventListener('pointermove', function(e){ var b = m.getBoundingClientRect(); mx((e.clientX-b.left-b.width/2)*.28); my((e.clientY-b.top-b.height/2)*.35); });
    m.addEventListener('pointerleave', function(){ G.to(m, {x:0, y:0, duration:.8, ease:'elastic.out(1,.45)'}); });
  });
}
$$('.cap').forEach(function(c){ c.addEventListener('pointermove', function(e){ var b = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX-b.left)+'px'); c.style.setProperty('--my', (e.clientY-b.top)+'px'); }); });

function runCounters(){
  $$('[data-count]').forEach(function(el){
    var to = parseInt(el.getAttribute('data-count'),10), pre = el.getAttribute('data-prefix') || '', o = {v:0};
    if (!hasG || reduce){ el.textContent = pre + to; return; }
    G.to(o, {v:to, duration:1.8, ease:'power2.out', delay:1, onUpdate:function(){ el.textContent = pre + Math.round(o.v); }});
  });
}
function splitWords(el){
  var words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map(function(w){ return '<span class="mask"><span>'+w+'</span></span>'; }).join(' ');
  return $$('.mask>span', el);
}

/* ---------- choreography ---------- */
if (hasG && !reduce){
  G.context(function(){
    var nameWords = [];
    $$('#heroName [data-split]').forEach(function(el){ nameWords = nameWords.concat(splitWords(el)); });
    var tl = G.timeline({defaults:{ease:'power4.out'}});
    tl.from(nameWords, {yPercent:115, duration:1.3, stagger:.1}, .25)
      .from('[data-intro]', {y:28, autoAlpha:0, duration:1, stagger:.08}, .7)
      .from('#meStage', {autoAlpha:0, y:60, duration:1.6, ease:'power3.out'}, .35);
    runCounters();
    if (ST){
      G.from('#judgLine', {scaleX:0, duration:1.6, ease:'power3.inOut', scrollTrigger:{trigger:'#engine', start:'top 70%'}});
      G.from('.stagebox', {y:60, autoAlpha:0, duration:1.2, ease:'power3.out', scrollTrigger:{trigger:'#engine', start:'top 80%'}});
      $$('[data-reveal]').forEach(function(el){ G.from(el, {y:40, autoAlpha:0, duration:1.1, ease:'power3.out', scrollTrigger:{trigger:el, start:'top 86%'}}); });
      $$('[data-stagger]').forEach(function(el){ G.from(el.children, {y:28, autoAlpha:0, duration:.9, stagger:.1, ease:'power3.out', scrollTrigger:{trigger:el, start:'top 86%'}}); });
      G.from('.proj', {y:40, autoAlpha:0, duration:.9, stagger:.08, ease:'power3.out', scrollTrigger:{trigger:'#workList', start:'top 86%'}});
      G.from('.cap', {y:60, autoAlpha:0, duration:1, stagger:.08, ease:'power3.out', scrollTrigger:{trigger:'#caps', start:'top 82%'}});
      $$('[data-scrub]').forEach(function(el){
        var targets = el.children.length ? $$('p', el) : [el], ws = [];
        targets.forEach(function(t){ ws = ws.concat(splitWords(t)); });
        G.fromTo(ws, {opacity:.15}, {opacity:1, stagger:.05, ease:'none', scrollTrigger:{trigger:el, start:'top 80%', end:'bottom 50%', scrub:true}});
      });
      G.from('#cage', {scale:.85, autoAlpha:0, duration:1.4, ease:'power3.out', scrollTrigger:{trigger:'#cage', start:'top 80%'}});
      var ctl = G.timeline({scrollTrigger:{trigger:'#checks', start:'top 78%'}});
      ctl.from('.check', {y:30, autoAlpha:0, duration:.6, stagger:.08, ease:'power3.out'})
         .from('.check path', {strokeDashoffset:24, duration:.45, stagger:.1, ease:'power2.out'}, .3)
         .from('.check .bar i', {scaleX:0, duration:.8, stagger:.1, ease:'power3.inOut'}, .3);
      G.fromTo('#aboutImg', {scale:1.15, yPercent:-4}, {scale:1, yPercent:4, ease:'none', scrollTrigger:{trigger:'.about-visual', start:'top bottom', end:'bottom top', scrub:true}});
      var cw = splitWords($('#contactTitle'));
      G.from(cw, {yPercent:115, duration:1.1, stagger:.05, ease:'power4.out', scrollTrigger:{trigger:'#contactTitle', start:'top 84%'}});
      G.fromTo('.contact-glow', {scale:.6, autoAlpha:0}, {scale:1, autoAlpha:1, ease:'none', scrollTrigger:{trigger:'#contact', start:'top bottom', end:'center center', scrub:true}});
      G.from('.wordmark', {yPercent:30, autoAlpha:0, duration:1.4, ease:'power3.out', scrollTrigger:{trigger:'.ftr', start:'top 92%'}});
      G.to('.hero .wrap', {yPercent:-10, autoAlpha:.2, ease:'none', scrollTrigger:{trigger:'.hero', start:'top top', end:'bottom top', scrub:true}});
      var mm = G.matchMedia();
      mm.add('(min-width: 1061px)', function(){
        var sec = document.getElementById('thinking');
        sec.classList.add('pinmode');
        G.set(tpanels, {autoAlpha:0}); thinkIdx = -1; setThink(0);
        thinkST = ST.create({
          trigger:'#thinkPin', start:'center center', end:'+=' + (window.innerHeight*2.6), pin:true, scrub:true,
          snap:{snapTo:1/5, duration:{min:.2, max:.6}, ease:'power2.inOut'},
          onUpdate:function(self){
            setThink(Math.min(5, Math.round(self.progress*5)));
            G.set('#dialArc', {strokeDashoffset: 238.76*(1-self.progress)});
            barFills.forEach(function(b,j){ G.set(b, {scaleX: G.utils.clamp(0,1, self.progress*6-j)}); });
          }
        });
        return function(){ sec.classList.remove('pinmode'); thinkST = null; G.set(tpanels, {clearProps:'all'}); G.set([dialRot].concat(dnodes), {clearProps:'transform'}); thinkIdx = -1; };
      });
    }
  });
} else {
  runCounters();
}
})();
