const canvas = document.getElementById('pacman'); const ctx = canvas.getContext('2d');
const tile = 18; const cols = 20; const rows = 20;
const map = [
  '####################',
  '#........##........#',
  '#.####.#.##.#.####.#',
  '#..................#',
  '#.####.######.####.#',
  '#..................#',
  '#.####.#.##.#.####.#',
  '#......#....#......#',
  '######.#.##.#.######',
  '     #.#.##.#.#     ',
  '######.#.##.#.######',
  '#......#....#......#',
  '#.####.######.####.#',
  '#..................#',
  '#.####.#.##.#.####.#',
  '#..................#',
  '#.####.#.##.#.####.#',
  '#........##........#',
  '#..................#',
  '####################'
];
let player = {x:1,y:1,dx:1,dy:0};
let ghost = {x:18,y:18,dx:-1,dy:0};
let pellets = new Set(); let score = 0; let running=false; let paused=false; let gameOver=false;
function inBounds(x,y){return x>=0 && x<cols && y>=0 && y<rows;}
function tileAt(x,y){return map[y] ? map[y][x] : '#';}
function passable(x,y){return inBounds(x,y) && tileAt(x,y) !== '#';}
function buildPellets(){pellets.clear(); for(let y=0;y<rows;y++){for(let x=0;x<cols;x++){if(tileAt(x,y) === '.' ) pellets.add(`${x},${y}`);}}}
function reset(){player={x:1,y:1,dx:1,dy:0}; ghost={x:18,y:18,dx:-1,dy:0}; score=0; running=false; paused=false; gameOver=false; buildPellets(); draw();}
function draw(){ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#020214'; ctx.fillRect(0,0,canvas.width,canvas.height);
  for(let y=0;y<rows;y++){for(let x=0;x<cols;x++){const ch = tileAt(x,y); const px=x*tile, py=y*tile; if(ch === '#'){ctx.fillStyle='#20204a'; ctx.fillRect(px,py,tile,tile); ctx.fillStyle='#4d4d92'; ctx.fillRect(px+3,py+3,tile-6,tile-6);} else {if(pellets.has(`${x},${y}`)){ctx.fillStyle='#ffdd4d'; ctx.beginPath(); ctx.arc(px+tile/2,py+tile/2,3,0,Math.PI*2); ctx.fill();}}}}
  const drawCircle=(obj,color)=>{ctx.fillStyle=color; ctx.beginPath(); ctx.arc(obj.x*tile+tile/2, obj.y*tile+tile/2, tile*0.4, 0, Math.PI*2); ctx.fill();};
  drawCircle(ghost,'#ff4d9d'); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(player.x*tile+tile/2, player.y*tile+tile/2, tile*0.45, 0.25*Math.PI, 1.75*Math.PI); ctx.lineTo(player.x*tile+tile/2, player.y*tile+tile/2); ctx.fill();
  ctx.fillStyle='#9aa0b4'; ctx.font='16px sans-serif'; ctx.fillText('Score: '+score,10,18);
  if(gameOver){ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(20,150,320,80); ctx.fillStyle='#fff'; ctx.font='22px sans-serif'; ctx.fillText('GAME OVER',110,185); ctx.font='14px sans-serif'; ctx.fillText('Press Start to play again',85,210);} }
function movePlayer(){const nx = player.x + player.dx, ny = player.y + player.dy; if(passable(nx,ny)){player.x=nx; player.y=ny; const key=`${player.x},${player.y}`; if(pellets.has(key)){pellets.delete(key); score += 10;}}}
function moveGhost(){const choices=[]; const directions=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]; for(const d of directions){const nx=ghost.x+d.x, ny=ghost.y+d.y; if(passable(nx,ny) && !(nx===ghost.x-ghost.dx && ny===ghost.y-ghost.dy)) choices.push(d);} if(choices.length) ghost = {...ghost, ...choices[Math.floor(Math.random()*choices.length)]}; ghost.x += ghost.dx; ghost.y += ghost.dy;}
function update(){if(!running || paused || gameOver) return; movePlayer(); moveGhost(); if(player.x===ghost.x && player.y===ghost.y){gameOver=true; running=false; submitScore(score);} if(pellets.size===0){gameOver=true; running=false; submitScore(score);} }
function loop(){update(); draw(); requestAnimationFrame(loop);} 
window.addEventListener('keydown', e=>{ if(e.key.startsWith('Arrow')){ const dirs={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0}}; const d=dirs[e.key]; if(d){player.dx=d.x; player.dy=d.y;} }});
document.getElementById('start').addEventListener('click', ()=>{ if(gameOver) reset(); running=true; paused=false; });
document.getElementById('pause').addEventListener('click', ()=>{ paused=!paused; });
document.getElementById('reset').addEventListener('click', () => { reset(); loadLeaderboard(); });
async function submitScore(score){ try{ if(window.SUPABASE_ENABLED && window.SUPABASE_CLIENT){ const user = (await window.SUPABASE_CLIENT.auth.getUser()).data.user; let username='guest'; let user_id=null; if(user){ user_id=user.id; username=user.email; const { data:profile } = await window.SUPABASE_CLIENT.from('user_profiles').select('username').eq('id', user.id).maybeSingle(); if(profile) username = profile.username || username; } await window.SUPABASE_CLIENT.from('pacman_scores').insert([{ user_id, username, score }]); } else { const scores = JSON.parse(localStorage.getItem('pacman.scores')||'[]'); scores.push({ username:(JSON.parse(localStorage.getItem('ng.session')||'null')||{email:'guest'}).email, score, t: Date.now()}); localStorage.setItem('pacman.scores', JSON.stringify(scores)); }}catch(e){console.warn('submit pacman score failed', e);} finally{ loadLeaderboard(); }}
async function loadLeaderboard(){ const list=document.getElementById('pacman-leaderboard'); if(!list) return; list.innerHTML='Loading top scores...'; if(window.SUPABASE_ENABLED && window.SUPABASE_CLIENT){ try{ const { data } = await window.SUPABASE_CLIENT.from('pacman_scores').select('username,score').order('score',{ascending:false}).limit(5); if(!data || !data.length){ list.innerHTML='<div class="small">No scores yet.</div>'; return; } list.innerHTML=data.map((row,i)=>`<div style="display:flex;justify-content:space-between;font-size:14px;"><span>#${i+1} ${row.username}</span><strong>${row.score}</strong></div>`).join(''); return; }catch(e){console.warn(e);} } const s=JSON.parse(localStorage.getItem('pacman.scores')||'[]'); if(!s.length){ list.innerHTML='<div class="small">No local scores yet.</div>'; return; } s.sort((a,b)=>b.score-a.score); list.innerHTML=s.slice(0,5).map((row,i)=>`<div style="display:flex;justify-content:space-between;font-size:14px;"><span>#${i+1} ${row.username}</span><strong>${row.score}</strong></div>`).join(''); }
reset(); loadLeaderboard(); requestAnimationFrame(loop);
