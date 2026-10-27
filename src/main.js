import './style.css';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const $ = (s) => document.querySelector(s);
const W = 960, H = 600;
const state = {
  running: false, over: false, last: 0, elapsed: 0, toastTimer: 0, attackTimer: 0,
  keys: new Set(), move: { x: 0, y: 0 }, enemies: [], particles: [],
  player: { x: 470, y: 315, r: 16, speed: 205, hp: 100, maxHp: 100, xp: 0, level: 1, coins: 0, facing: { x: 1, y: 0 }, invuln: 0 },
  questKills: 0, shrineAwake: false, sound: false, audio: null
};
const rand = (a,b) => a + Math.random()*(b-a);
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
const player = state.player;

function toast(message) {
  const el = $('#toast'); el.textContent = message; el.classList.add('show');
  state.toastTimer = 2.3;
}
function updateHud() {
  $('#level').textContent = 'LV ' + player.level;
  $('#hp').textContent = Math.ceil(player.hp) + '/' + player.maxHp;
  $('#xp').textContent = player.xp + '/' + (player.level * 30) + ' XP';
  $('#xp-fill').style.width = (player.xp / (player.level * 30) * 100) + '%';
  $('#coins').textContent = player.coins;
  $('#quest-count').textContent = Math.min(3,state.questKills) + '/3';
  $('#quest-text').textContent = state.shrineAwake ? 'The shrine is awake. Keep exploring, Wanderer.' : 'Defeat 3 forest slimes to awaken the shrine.';
}
function spawnSlime(x, y) {
  state.enemies.push({x,y,r:15,hp:2,maxHp:2,speed:rand(27,42),phase:rand(0,6.28),hit:0});
}
function resetGame() {
  state.running = true; state.over = false; state.elapsed = 0; state.attackTimer = 0;
  state.enemies = []; state.particles = []; state.questKills = 0; state.shrineAwake = false;
  Object.assign(player,{x:470,y:315,hp:100,maxHp:100,xp:0,level:1,coins:0,invuln:0,facing:{x:1,y:0}});
  for(let i=0;i<7;i++) spawnSlime(rand(90,870),rand(90,520));
  $('#start-screen').classList.add('hidden'); $('#game-over').classList.add('hidden');
  updateHud(); toast('Find the forest slimes. Stay close to the light.');
}
function playTone(freq=440,duration=.07) {
  if(!state.sound) return;
  try {
    state.audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const osc=state.audio.createOscillator(), gain=state.audio.createGain();
    osc.type='sine'; osc.frequency.value=freq; gain.gain.value=.035;
    osc.connect(gain); gain.connect(state.audio.destination); osc.start();
    gain.gain.exponentialRampToValueAtTime(.001,state.audio.currentTime+duration);
    osc.stop(state.audio.currentTime+duration);
  } catch {}
}
function burst(x,y,color,count=8) {
  for(let i=0;i<count;i++){const a=rand(0,Math.PI*2),s=rand(25,130);state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.25,.6),max:.6,color,r:rand(2,4)});}
}
function attack() {
  if(!state.running || state.over || state.attackTimer>0) return;
  state.attackTimer=.38; playTone(610,.09);
  const px=player.x+player.facing.x*25, py=player.y+player.facing.y*25;
  burst(px,py,'#d8c7ff',13);
  let hitCount=0;
  for(const e of state.enemies){
    if(e.hp<=0) continue;
    const dx=e.x-player.x,dy=e.y-player.y,dist=Math.hypot(dx,dy);
    const dot=(dx*player.facing.x+dy*player.facing.y)/(dist||1);
    if(dist<78 && dot>-.1){e.hp--;e.hit=.18;burst(e.x,e.y,'#f4d4ff',5);hitCount++;}
  }
  if(hitCount) toast('Moonlight strike!'); else toast('A silver arc cuts through the air.');
}
function defeat(e) {
  e.hp=0; state.questKills++; player.coins+=3; player.xp+=10; burst(e.x,e.y,'#b4f4e8',15); playTone(300,.14);
  if(player.xp>=player.level*30){player.xp-=player.level*30;player.level++;player.maxHp+=12;player.hp=player.maxHp;player.speed+=4;toast('Level up! LV '+player.level);}
  else toast('+10 XP  ·  +3 moon coins');
  if(state.questKills>=3&&!state.shrineAwake){state.shrineAwake=true;toast('The shrine awakens. The moon remembers you.');burst(480,120,'#c8b7ff',28);}
  updateHud();
  if(state.enemies.filter(x=>x.hp>0).length<4) spawnSlime(rand(80,880),rand(90,530));
}
function update(dt) {
  if(!state.running||state.over)return;
  state.elapsed+=dt;state.attackTimer=Math.max(0,state.attackTimer-dt);player.invuln=Math.max(0,player.invuln-dt);
  if(state.toastTimer>0&&(state.toastTimer-=dt)<=0)$('#toast').classList.remove('show');
  let dx=0,dy=0;
  if(state.keys.has('left')||state.keys.has('ArrowLeft')||state.keys.has('a'))dx--;
  if(state.keys.has('right')||state.keys.has('ArrowRight')||state.keys.has('d'))dx++;
  if(state.keys.has('up')||state.keys.has('ArrowUp')||state.keys.has('w'))dy--;
  if(state.keys.has('down')||state.keys.has('ArrowDown')||state.keys.has('s'))dy++;
  const mag=Math.hypot(dx,dy)||1;
  if(dx||dy){dx/=mag;dy/=mag;player.facing={x:dx,y:dy};}
  player.x=clamp(player.x+dx*player.speed*dt,35,W-35);player.y=clamp(player.y+dy*player.speed*dt,50,H-35);
  for(const e of state.enemies){
    if(e.hp<=0)continue;e.phase+=dt*3;e.hit=Math.max(0,e.hit-dt);
    const ex=player.x-e.x,ey=player.y-e.y,d=Math.hypot(ex,ey)||1;
    if(d>31){e.x+=ex/d*e.speed*dt;e.y+=ey/d*e.speed*dt;}
    else if(player.invuln<=0){player.hp-=12;player.invuln=.7;burst(player.x,player.y,'#ff9ba9',7);playTone(140,.1);updateHud();if(player.hp<=0){player.hp=0;state.over=true;$('#game-over').classList.remove('hidden');}}
  }
  for(const e of state.enemies)if(e.hp===1&&e.maxHp===2&&e.hit>0)e.hit=0;
  state.enemies=state.enemies.filter(e=>{if(e.hp<=0)return false;if(e.hp<0){defeat(e);return false;}return true;});
  // A second pass keeps defeat rewards deterministic.
  for(const e of state.enemies) if(e.hp<=0) defeat(e);
  state.enemies=state.enemies.filter(e=>e.hp>0);
  for(const p of state.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.vx*=.96;p.vy*=.96;}
  state.particles=state.particles.filter(p=>p.life>0);
}
function drawTree(x,y,s=1) {
  ctx.fillStyle='#131f2c';ctx.beginPath();ctx.ellipse(x+4*s,y+16*s,20*s,8*s,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#513d55';ctx.fillRect(x-4*s,y-4*s,8*s,24*s);
  for(let i=0;i<3;i++){ctx.fillStyle=['#263d48','#29454c','#31524f'][i];ctx.beginPath();ctx.arc(x,y-8*s-i*10*s,17*s-i*2*s,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#7f9a91';ctx.globalAlpha=.45;ctx.beginPath();ctx.arc(x-7*s,y-22*s,4*s,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
}
function drawWorld() {
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#293c4b');g.addColorStop(.55,'#34534f');g.addColorStop(1,'#182d38');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // Soft moonlit fog bands
  for(let i=0;i<7;i++){ctx.fillStyle=i%2?'#a6c5cb':'#8c9dc8';ctx.globalAlpha=.025;ctx.beginPath();ctx.ellipse((i*173+state.elapsed*5)%(W+180)-90,90+i*69,190,35,0,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
  // Winding path
  ctx.fillStyle='#6a655f';ctx.globalAlpha=.72;ctx.beginPath();ctx.moveTo(360,600);ctx.bezierCurveTo(405,470,500,450,455,350);ctx.bezierCurveTo(400,245,500,210,480,130);ctx.lineTo(570,110);ctx.bezierCurveTo(580,230,490,280,530,350);ctx.bezierCurveTo(590,470,490,510,470,600);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
  ctx.strokeStyle='#9e9a91';ctx.globalAlpha=.28;ctx.lineWidth=3;ctx.setLineDash([8,13]);ctx.beginPath();ctx.moveTo(418,600);ctx.bezierCurveTo(460,470,540,450,490,350);ctx.bezierCurveTo(445,250,525,205,525,125);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
  // Flowers, stones, fireflies are deterministic so the offline world is repeatable
  for(let i=0;i<95;i++){const x=(i*137+31)%W,y=(i*83+19)%H;if((x>350&&x<590&&y>100))continue;ctx.fillStyle=i%3?'#d3d5a0':'#b9a7e8';ctx.globalAlpha=.3+(i%4)*.1;ctx.beginPath();ctx.arc(x,y,1.5+i%2,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
  drawTree(70,95,1.5);drawTree(155,55,1.15);drawTree(285,85,1.3);drawTree(760,72,1.45);drawTree(890,140,1.35);drawTree(90,290,1.35);drawTree(865,330,1.4);drawTree(155,510,1.5);drawTree(790,520,1.45);drawTree(660,85,1.1);drawTree(330,500,1.1);
  // Ancient moon shrine
  ctx.save();ctx.translate(485,115);ctx.shadowColor='#c6b6ff';ctx.shadowBlur=state.shrineAwake?34:10;
  ctx.fillStyle='#24223c';ctx.fillRect(-38,-6,76,8);ctx.fillRect(-29,-43,8,39);ctx.fillRect(21,-43,8,39);ctx.fillRect(-38,-49,76,8);
  ctx.strokeStyle=state.shrineAwake?'#d8c6ff':'#77758e';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-50,15,0,Math.PI*2);ctx.stroke();ctx.fillStyle=state.shrineAwake?'#c9b7ff':'#64627c';ctx.beginPath();ctx.arc(0,-50,6,0,Math.PI*2);ctx.fill();ctx.restore();
  ctx.fillStyle='#d8d2ef';ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillText('MOON SHRINE',485,56);
}
function drawPlayer() {
  const p=player;ctx.save();ctx.translate(p.x,p.y);
  ctx.fillStyle='#10192366';ctx.beginPath();ctx.ellipse(0,14,15,7,0,0,Math.PI*2);ctx.fill();
  if(p.invuln>0&&Math.floor(state.elapsed*18)%2===0)ctx.globalAlpha=.45;
  // anime-style silver hair silhouette, cloak, face and eyes
  ctx.fillStyle='#342b4d';ctx.beginPath();ctx.moveTo(-12,-3);ctx.quadraticCurveTo(-24,-22,-5,-26);ctx.quadraticCurveTo(12,-31,17,-10);ctx.lineTo(12,12);ctx.lineTo(6,5);ctx.lineTo(-7,15);ctx.closePath();ctx.fill();
  ctx.fillStyle='#bfc7e6';ctx.beginPath();ctx.moveTo(-10,-9);ctx.quadraticCurveTo(-20,-28,-4,-28);ctx.lineTo(1,-19);ctx.lineTo(8,-28);ctx.lineTo(15,-13);ctx.lineTo(8,-3);ctx.lineTo(4,-12);ctx.lineTo(-2,-5);ctx.lineTo(-5,-13);ctx.closePath();ctx.fill();
  ctx.fillStyle='#f1d6dc';ctx.beginPath();ctx.ellipse(0,-8,8,10,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#6c8fba';ctx.fillRect(-5,-8,3,2);ctx.fillRect(3,-8,3,2);
  ctx.fillStyle='#7562b3';ctx.beginPath();ctx.moveTo(-10,1);ctx.lineTo(0,4);ctx.lineTo(11,0);ctx.lineTo(13,14);ctx.lineTo(0,20);ctx.lineTo(-13,14);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#d9c9ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(10,2);ctx.lineTo(18,15);ctx.stroke();
  if(state.attackTimer>0){ctx.strokeStyle='#e2d5ff';ctx.lineWidth=5;ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(0,0,37,-.9,.9);ctx.stroke();}
  ctx.restore();
}
function drawEnemy(e) {
  ctx.save();ctx.translate(e.x,e.y+Math.sin(e.phase)*2);
  ctx.fillStyle='#111b2366';ctx.beginPath();ctx.ellipse(0,10,17,7,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=e.hit>0?'#fff0ff':'#7bcbb8';ctx.beginPath();ctx.moveTo(-15,2);ctx.quadraticCurveTo(-18,-15,-6,-18);ctx.quadraticCurveTo(0,-25,8,-16);ctx.quadraticCurveTo(18,-12,15,2);ctx.quadraticCurveTo(0,13,-15,2);ctx.fill();
  ctx.fillStyle='#2e5562';ctx.fillRect(-7,-7,3,5);ctx.fillRect(5,-7,3,5);
  ctx.fillStyle='#f0d6ff';ctx.fillRect(-7,-7,1,2);ctx.fillRect(5,-7,1,2);
  ctx.fillStyle='#17262f';ctx.fillRect(-15,-27,30,4);ctx.fillStyle='#f28fae';ctx.fillRect(-14,-26,28*(e.hp/e.maxHp),2);
  ctx.restore();
}
function render() {
  ctx.clearRect(0,0,W,H);drawWorld();
  for(const e of state.enemies)if(e.hp>0)drawEnemy(e);
  drawPlayer();
  for(const p of state.particles){ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
  // tiny moon in the sky
  ctx.fillStyle='#e1dcff';ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(850,70,16,0,Math.PI*2);ctx.fill();ctx.fillStyle='#293c4b';ctx.beginPath();ctx.arc(858,64,14,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
}
function loop(t) {
  const dt=Math.min((t-state.last)/1000||0,.04);state.last=t;update(dt);render();requestAnimationFrame(loop);
}
function holdButton(button, key) {
  const down=e=>{e.preventDefault();state.keys.add(key);button.classList.add('active');};
  const up=e=>{e.preventDefault();state.keys.delete(key);button.classList.remove('active');};
  button.addEventListener('pointerdown',down);['pointerup','pointercancel','pointerleave','lostpointercapture'].forEach(n=>button.addEventListener(n,up));
}
document.querySelectorAll('[data-move]').forEach(b=>holdButton(b,b.dataset.move));
$('#attack-button').addEventListener('pointerdown',e=>{e.preventDefault();attack();});
$('#start-button').addEventListener('click',resetGame);
$('#retry-button').addEventListener('click',resetGame);
$('#sound-toggle').addEventListener('click',()=>{state.sound=!state.sound;$('#sound-toggle').style.color=state.sound?'#d5c8ff':'#88839f';toast(state.sound?'Sound effects enabled':'Sound effects muted');});
window.addEventListener('keydown',e=>{const key=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();state.keys.add(key);if(e.key===' '||e.key==='j')attack();});
window.addEventListener('keyup',e=>{state.keys.delete(e.key);state.keys.delete(e.key.toLowerCase());});
window.addEventListener('blur',()=>state.keys.clear());
document.addEventListener('visibilitychange',()=>{if(document.hidden)state.keys.clear();});
updateHud();render();requestAnimationFrame(loop);