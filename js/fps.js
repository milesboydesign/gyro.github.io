import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/controls/PointerLockControls.js';

const canvas = document.getElementById('three');
const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02030f);
scene.fog = new THREE.FogExp2(0x02030f, 0.01);

const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 2000);
const controls = new PointerLockControls(camera, canvas);
const holder = controls.getObject();
holder.position.set(0, 1.8, 0);
scene.add(holder);

const ambient = new THREE.AmbientLight(0x68758b, 0.75);
scene.add(ambient);

const directional = new THREE.DirectionalLight(0xa6c8ff, 1.2);
directional.position.set(10, 20, 10);
directional.castShadow = true;
directional.shadow.camera.left = -30;
directional.shadow.camera.right = 30;
directional.shadow.camera.top = 30;
directional.shadow.camera.bottom = -30;
directional.shadow.mapSize.set(2048, 2048);
scene.add(directional);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400),
  new THREE.MeshStandardMaterial({color: 0x090a18, roughness: 0.95, metalness: 0.05})
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(400, 40, 0x1f2e4a, 0x08101f);
grid.material.opacity = 0.35;
grid.material.transparent = true;
scene.add(grid);

const boxMaterial = new THREE.MeshStandardMaterial({color: 0x113a5b, roughness: 0.25, metalness: 0.4});
for (let i = 0; i < 28; i++) {
  const box = new THREE.Mesh(new THREE.BoxGeometry(2.2, 4 + Math.random() * 5, 2.2), boxMaterial);
  const angle = (i / 28) * Math.PI * 2;
  const radius = 22 + Math.sin(i * 0.4) * 4;
  box.position.set(Math.cos(angle) * radius, 2 + Math.random() * 3, Math.sin(angle) * radius);
  box.castShadow = true;
  box.receiveShadow = true;
  scene.add(box);
}

const neon = new THREE.Mesh(
  new THREE.TorusGeometry(15, 0.1, 8, 120),
  new THREE.MeshBasicMaterial({color: 0x4dd0ff, opacity: 0.25, transparent: true})
);
neon.rotation.x = Math.PI / 2;
neon.position.y = 0.06;
scene.add(neon);

const ring = new THREE.LineSegments(
  new THREE.WireframeGeometry(new THREE.TorusGeometry(25, 0.4, 4, 200)),
  new THREE.LineBasicMaterial({color: 0x1c7db9, transparent: true, opacity: 0.35})
);
ring.rotation.x = Math.PI / 2;
scene.add(ring);

const crosshair = document.getElementById('crosshair');
const info = document.getElementById('fps-info');
const status = document.getElementById('fps-status');
const startButton = document.getElementById('fps-start');

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let sprint = false;
let speed = 0;
let lastTime = performance.now();

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (canvas.width !== width || canvas.height !== height) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

function updateHud() {
  const velocity = Math.min(16, Math.max(0, speed * 18));
  info.textContent = `Speed: ${velocity.toFixed(0)} km/h · ${sprint ? 'Sprint' : 'Cruise'}`;
  status.textContent = controls.isLocked ? 'Mouse look active · WASD to move · Shift to sprint' : 'Click START to lock pointer and play';
  crosshair.style.display = controls.isLocked ? 'block' : 'none';
}

function onKeyDown(event) {
  switch (event.code) {
    case 'KeyW': moveForward = true; break;
    case 'KeyS': moveBackward = true; break;
    case 'KeyA': moveLeft = true; break;
    case 'KeyD': moveRight = true; break;
    case 'ShiftLeft': case 'ShiftRight': sprint = true; break;
  }
}

function onKeyUp(event) {
  switch (event.code) {
    case 'KeyW': moveForward = false; break;
    case 'KeyS': moveBackward = false; break;
    case 'KeyA': moveLeft = false; break;
    case 'KeyD': moveRight = false; break;
    case 'ShiftLeft': case 'ShiftRight': sprint = false; break;
  }
}

function animate(time) {
  const delta = Math.min(0.05, (time - lastTime) / 1000);
  lastTime = time;

  if (controls.isLocked) {
    const acceleration = sprint ? 34 : 20;
    const deceleration = 15;
    let direction = 0;
    if (moveForward) direction += 1;
    if (moveBackward) direction -= 0.65;

    speed += direction * acceleration * delta;
    if (direction === 0) speed -= Math.sign(speed) * deceleration * delta;
    speed = THREE.MathUtils.clamp(speed, -6, 16);

    const actualSpeed = speed * delta;
    if (moveForward || moveBackward) controls.moveForward(actualSpeed);
    if (moveLeft) controls.moveRight(-actualSpeed * 0.75);
    if (moveRight) controls.moveRight(actualSpeed * 0.75);
  } else {
    speed *= 0.9;
  }

  for (const child of scene.children) {
    if (child.isMesh && child.geometry.type === 'BoxGeometry') {
      child.rotation.y += 0.002;
    }
  }

  updateHud();
  resize();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

startButton.addEventListener('click', () => {
  controls.lock();
});
controls.addEventListener('lock', () => {
  info.textContent = 'Explore the arena. Move with WASD.';
});
controls.addEventListener('unlock', () => {
  status.textContent = 'Pointer unlocked. Click START to resume.';
});

window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);
window.addEventListener('resize', resize);

camera.position.set(0, 1.8, 8);
animate(performance.now());
