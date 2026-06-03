const canvas = document.getElementById('pacman');
const ctx = canvas.getContext('2d');
const tile = 18;
const cols = 20;
const rows = 20;
const map = [
  '####################',
  '#........##........#',
  '#.####.#.##.#.####.#',
  '#o....#......#....o#',
  '#.####.######.####.#',
  '#..................#',
  '#.####.##..##.####.#',
  '#......#....#......#',
  '######.#.##.#.######',
  '     #.#.##.#.#     ',
  '######.#.##.#.######',
  '#......#....#......#',
  '#.####.######.####.#',
  '#o.......##........#',
  '####.#.##..##.#.####',
  '#....#......#....#.#',
  '#.##.######.####.#.#',
  '#..................#',
  '#.################.#',
  '####################'
];

const home = {x:9, y:9};
const ghosts = [
  {x:9, y:8, dx:0, dy:1, color:'#ff4d9d'},
  {x:9, y:10, dx:0, dy:-1, color:'#4dff8a'},
  {x:8, y:9, dx:1, dy:0, color:'#ffd54d'}
];
let player = {x:1, y:1, dx:1, dy:0, next: {x:1, y:0}};
let pellets = new Set();
let powerPellets = new Set();
let score = 0;
let lives = 3;
let running = false;
let paused = false;
let gameOver = false;
let levelComplete = false;
let frame = 0;

function tileAt(x, y) {
  if (y < 0 || y >= rows || x < 0 || x >= cols) return '#';
  return map[y][x] || '#';
}

function passable(x, y) {
  return tileAt(x, y) !== '#';
}

function buildPellets() {
  pellets.clear();
  powerPellets.clear();
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const ch = tileAt(x, y);
      if (ch === '.') pellets.add(`${x},${y}`);
      if (ch === 'o') powerPellets.add(`${x},${y}`);
    }
  }
}

function resetGame() {
  player = {x:1, y:1, dx:1, dy:0, next: {x:1, y:0}};
  ghosts[0] = {x:9, y:8, dx:0, dy:1, color:'#ff4d9d'};
  ghosts[1] = {x:9, y:10, dx:0, dy:-1, color:'#4dff8a'};
  ghosts[2] = {x:8, y:9, dx:1, dy:0, color:'#ffd54d'};
  score = 0;
  lives = 3;
  running = false;
  paused = false;
  gameOver = false;
  levelComplete = false;
  buildPellets();
  draw();
}

function drawMaze() {
  ctx.fillStyle = '#020214';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const ch = tileAt(x, y);
      const px = x * tile;
      const py = y * tile;
      if (ch === '#') {
        ctx.fillStyle = '#20204a';
        ctx.fillRect(px, py, tile, tile);
        ctx.strokeStyle = '#4d4d92';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 2, py + 2, tile - 4, tile - 4);
      }
      if (pellets.has(`${x},${y}`)) {
        ctx.fillStyle = '#ffdd4d';
        ctx.beginPath();
        ctx.arc(px + tile / 2, py + tile / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      if (powerPellets.has(`${x},${y}`)) {
        ctx.fillStyle = '#4dd0ff';
        ctx.beginPath();
        ctx.arc(px + tile / 2, py + tile / 2, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawPlayer() {
  const cx = player.x * tile + tile / 2;
  const cy = player.y * tile + tile / 2;
  const mouthAngle = 0.25 * Math.PI;
  let start = 0.25 * Math.PI;
  let end = 1.75 * Math.PI;
  if (player.dx === -1) { start = 1.25 * Math.PI; end = 0.75 * Math.PI; }
  else if (player.dy === -1) { start = 1.75 * Math.PI; end = 1.25 * Math.PI; }
  else if (player.dy === 1) { start = 0.75 * Math.PI; end = 0.25 * Math.PI; }
  ctx.fillStyle = '#ffeb3b';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, tile * 0.42, start + mouthAngle, end - mouthAngle, false);
  ctx.closePath();
  ctx.fill();
}

function drawGhost(ghost) {
  const x = ghost.x * tile + tile / 2;
  const y = ghost.y * tile + tile / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = ghost.frightened ? '#8ab6ff' : ghost.color;
  ctx.beginPath();
  ctx.arc(0, 0, tile * 0.4, Math.PI, 0, false);
  ctx.lineTo(tile * 0.4, tile * 0.45);
  for (let i = 0; i < 4; i++) {
    ctx.quadraticCurveTo(tile * (0.25 - i * 0.12), tile * 0.8, tile * (0.15 - i * 0.2), tile * 0.45);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-6, -3, 5, 0, Math.PI * 2);
  ctx.arc(6, -3, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(-6, -3, 2, 0, Math.PI * 2);
  ctx.arc(6, -3, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function draw() {
  drawMaze();
  drawPlayer();
  ghosts.forEach(drawGhost);
  ctx.fillStyle = '#9aa0b4';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Score: ${score}`, 10, 18);
  ctx.fillText(`Lives: ${lives}`, 260, 18);
  if (paused && running && !gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(50, 150, 260, 60);
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText('PAUSED', 145, 190);
  }
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(40, 140, 280, 80);
    ctx.fillStyle = '#ff4d9d';
    ctx.font = '22px sans-serif';
    ctx.fillText('GAME OVER', 95, 175);
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText('Press Start to play again', 70, 200);
  }
  if (levelComplete) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(40, 140, 280, 80);
    ctx.fillStyle = '#4dd0ff';
    ctx.font = '22px sans-serif';
    ctx.fillText('LEVEL COMPLETE', 68, 175);
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText('Press Start to continue', 85, 200);
  }
}

function tryTurn() {
  const nx = player.x + player.next.x;
  const ny = player.y + player.next.y;
  if (passable(nx, ny)) {
    player.dx = player.next.x;
    player.dy = player.next.y;
  }
}

function movePlayer() {
  if (player.next.x !== player.dx || player.next.y !== player.dy) {
    tryTurn();
  }
  const nx = player.x + player.dx;
  const ny = player.y + player.dy;
  if (passable(nx, ny)) {
    player.x = nx;
    player.y = ny;
  }
  const pos = `${player.x},${player.y}`;
  if (pellets.has(pos)) {
    pellets.delete(pos);
    score += 10;
  }
  if (powerPellets.has(pos)) {
    powerPellets.delete(pos);
    score += 50;
    ghosts.forEach(g => g.frightened = true);
    setTimeout(() => ghosts.forEach(g => g.frightened = false), 4000);
  }
}

function getPossibleDirections(ghost) {
  const dirs = [
    {x:1, y:0},
    {x:-1, y:0},
    {x:0, y:1},
    {x:0, y:-1}
  ];
  return dirs.filter(d => passable(ghost.x + d.x, ghost.y + d.y) && !(ghost.x + d.x === ghost.x - ghost.dx && ghost.y + d.y === ghost.y - ghost.dy));
}

function moveGhost(ghost) {
  const options = getPossibleDirections(ghost);
  if (options.length > 0) {
    if (options.some(d => d.x === ghost.dx && d.y === ghost.dy) && Math.random() > 0.4) {
      // keep same direction most of the time
    } else {
      ghost.dx = options[Math.floor(Math.random() * options.length)].x;
      ghost.dy = options[Math.floor(Math.random() * options.length)].y;
    }
  }
  ghost.x += ghost.dx;
  ghost.y += ghost.dy;
}

function update() {
  if (!running || paused || gameOver || levelComplete) return;
  frame += 1;
  if (frame % 8 === 0) movePlayer();
  if (frame % 12 === 0) ghosts.forEach(moveGhost);
  ghosts.forEach(ghost => {
    if (ghost.x === player.x && ghost.y === player.y) {
      if (ghost.frightened) {
        score += 100;
        ghost.x = home.x;
        ghost.y = home.y;
        ghost.frightened = false;
      } else {
        lives -= 1;
        if (lives <= 0) {
          gameOver = true;
          running = false;
          submitScore(score);
        } else {
          player.x = 1;
          player.y = 1;
          player.dx = 1;
          player.dy = 0;
          ghosts.forEach((g, index) => {
            g.x = [9, 9, 8][index];
            g.y = [8, 10, 9][index];
            g.dx = 0;
            g.dy = index === 1 ? -1 : 1;
            g.frightened = false;
          });
          paused = true;
          setTimeout(() => paused = false, 800);
        }
      }
    }
  });
  if (!pellets.size && !powerPellets.size) {
    levelComplete = true;
    running = false;
    submitScore(score);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', e => {
  const dirs = {
    ArrowUp: {x:0, y:-1},
    ArrowDown: {x:0, y:1},
    ArrowLeft: {x:-1, y:0},
    ArrowRight: {x:1, y:0}
  };
  if (dirs[e.key]) {
    player.next = dirs[e.key];
  }
});

document.getElementById('start').addEventListener('click', () => {
  if (gameOver || levelComplete) {
    levelComplete = false;
    resetGame();
  }
  running = true;
  paused = false;
});

document.getElementById('pause').addEventListener('click', () => {
  if (!gameOver) paused = !paused;
});

document.getElementById('reset').addEventListener('click', () => {
  resetGame();
  loadLeaderboard();
});

async function submitScore(score) {
  try {
    if (window.SUPABASE_ENABLED && window.SUPABASE_CLIENT) {
      const response = await window.SUPABASE_CLIENT.auth.getUser();
      const user = response.data?.user;
      let username = 'guest';
      let user_id = null;
      if (user) {
        user_id = user.id;
        username = user.email || username;
        const { data: profile } = await window.SUPABASE_CLIENT.from('user_profiles').select('username').eq('id', user.id).maybeSingle();
        if (profile) username = profile.username || username;
      }
      await window.SUPABASE_CLIENT.from('pacman_scores').insert([{ user_id, username, score }]);
    } else {
      const scores = JSON.parse(localStorage.getItem('pacman.scores') || '[]');
      const session = JSON.parse(localStorage.getItem('ng.session') || 'null') || { email: 'guest' };
      scores.push({ username: session.email, score, t: Date.now() });
      localStorage.setItem('pacman.scores', JSON.stringify(scores));
    }
  } catch (e) {
    console.warn('submit pacman score failed', e);
  } finally {
    loadLeaderboard();
  }
}

async function loadLeaderboard() {
  const list = document.getElementById('pacman-leaderboard');
  if (!list) return;
  list.innerHTML = 'Loading top scores...';
  if (window.SUPABASE_ENABLED && window.SUPABASE_CLIENT) {
    try {
      const { data } = await window.SUPABASE_CLIENT.from('pacman_scores').select('username,score').order('score', { ascending: false }).limit(5);
      if (!data || !data.length) {
        list.innerHTML = '<div class="small">No scores yet.</div>';
        return;
      }
      list.innerHTML = data.map((row, i) => `<div style="display:flex;justify-content:space-between;font-size:14px;"><span>#${i+1} ${row.username}</span><strong>${row.score}</strong></div>`).join('');
      return;
    } catch (e) {
      console.warn(e);
    }
  }
  const s = JSON.parse(localStorage.getItem('pacman.scores') || '[]');
  if (!s.length) {
    list.innerHTML = '<div class="small">No local scores yet.</div>';
    return;
  }
  s.sort((a, b) => b.score - a.score);
  list.innerHTML = s.slice(0, 5).map((row, i) => `<div style="display:flex;justify-content:space-between;font-size:14px;"><span>#${i+1} ${row.username}</span><strong>${row.score}</strong></div>`).join('');
}

resetGame();
loadLeaderboard();
requestAnimationFrame(loop);

