const canvas = document.getElementById('s'); const ctx = canvas.getContext('2d');
const size = 16; const cols = canvas.width / size; const rows = canvas.height / size;
let snake = [{x:8,y:8}]; let dir = {x:0,y:0}; let food = null; let running = false; let gameOver=false; let tick=0; let speed=8; let score=0;
function placeFood(){ while(true){ const x = Math.floor(Math.random()*cols); const y = Math.floor(Math.random()*rows); if (!snake.some(s=>s.x===x && s.y===y)){ food={x,y}; break; } } }
function reset(){ snake=[{x:8,y:8}]; dir={x:0,y:0}; food=null; running=false; gameOver=false; tick=0; score=0; placeFood(); draw(); document.getElementById('snake-status').textContent = 'Controls: Arrow keys to move.'; loadSnakeLeaderboard(); }
function step(){ if(!running) return; tick++; if (tick%speed!==0) return; const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y}; if (head.x<0||head.x>=cols||head.y<0||head.y>=rows || snake.some(s=>s.x===head.x && s.y===head.y)){ running=false; gameOver=true; document.getElementById('snake-status').textContent = 'Game over. Press Start to play again.'; saveSnakeScore(score); return; } snake.unshift(head); if (food && head.x===food.x && head.y===food.y){ score++; placeFood(); } else snake.pop(); }
function draw(){ ctx.clearRect(0,0,canvas.width,canvas.height); // grid
 ctx.fillStyle='#071026'; ctx.fillRect(0,0,canvas.width,canvas.height);
 // food
 if (food){ ctx.fillStyle='#ff4d9d'; ctx.fillRect(food.x*size+2, food.y*size+2, size-4, size-4); }
 // snake
 ctx.fillStyle='#4dd0ff'; for(const s of snake){ ctx.fillRect(s.x*size+1, s.y*size+1, size-2, size-2); }
 // score
 ctx.fillStyle='#9aa0b4'; ctx.font='14px sans-serif'; ctx.fillText('Score: '+score,8,16);
}
function loop(){ step(); draw(); requestAnimationFrame(loop); }
window.addEventListener('keydown', e=>{ if(e.key.startsWith('Arrow')){ const dirs={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0}}; const d=dirs[e.key]; if(d){dir=d;} }});
document.getElementById('start').addEventListener('click', ()=>{ if(gameOver) reset(); running=true; if (!food) placeFood(); document.getElementById('snake-status').textContent = 'Game running.'; });
document.getElementById('pause').addEventListener('click', ()=>{ if (!gameOver){ running=!running; document.getElementById('snake-status').textContent = running ? 'Game running.' : 'Paused.'; }});
document.getElementById('reset').addEventListener('click', reset);
function saveSnakeScore(score){ const scores = JSON.parse(localStorage.getItem('snake.scores')||'[]'); scores.push({ username:(JSON.parse(localStorage.getItem('ng.session')||'null')||{email:'guest'}).email, score, t: Date.now() }); localStorage.setItem('snake.scores', JSON.stringify(scores)); loadSnakeLeaderboard(); }
function loadSnakeLeaderboard(){ const list=document.getElementById('snake-leaderboard'); if(!list) return; const scores = JSON.parse(localStorage.getItem('snake.scores')||'[]'); if(!scores.length){ list.innerHTML='<div class="small">No high scores yet.</div>'; return; } scores.sort((a,b)=>b.score-a.score); list.innerHTML=scores.slice(0,5).map((row,i)=>`<div style="display:flex;justify-content:space-between;font-size:14px;"><span>#${i+1} ${row.username}</span><strong>${row.score}</strong></div>`).join(''); }
reset(); requestAnimationFrame(loop);
