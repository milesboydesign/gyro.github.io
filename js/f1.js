import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';

const canvas = document.getElementById('f1canvas');
const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050710);
scene.fog = new THREE.FogExp2(0x050710, 0.0025);

const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1000);
scene.add(camera);

const ambient = new THREE.AmbientLight(0x5a7086, 0.76);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xc8eeff, 1.1);
sun.position.set(30, 40, 15);
sun.castShadow = true;
sun.shadow.camera.top = 25;
sun.shadow.camera.bottom = -25;
sun.shadow.camera.left = -25;
sun.shadow.camera.right = 25;
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300),
  new THREE.MeshStandardMaterial({color: 0x0b1120, roughness: 0.9, metalness: 0.05})
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const track = new THREE.Mesh(
  new THREE.TorusGeometry(26, 4.4, 16, 140),
  new THREE.MeshStandardMaterial({color: 0x111a34, roughness: 0.7, metalness: 0.1})
);
track.rotation.x = Math.PI / 2;
track.receiveShadow = true;
track.castShadow = true;
scene.add(track);

const lineGeo = new THREE.BufferGeometry();
const linePoints = [];
for (let i = 0; i <= 64; i++) {
  const theta = (i / 64) * Math.PI * 2;
  const r = 26;
  linePoints.push(r * Math.cos(theta), 0.03, r * Math.sin(theta));
  linePoints.push((r - 1.5) * Math.cos(theta), 0.03, (r - 1.5) * Math.sin(theta));
}
lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));
const lineMesh = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({color: 0xd9f4ff, linewidth: 2, opacity: 0.7, transparent: true}));
scene.add(lineMesh);

const barrierMat = new THREE.MeshStandardMaterial({color: 0x224e7a, roughness: 0.5, metalness: 0.2});
for (let i = 0; i < 24; i++) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.6, 2.2), barrierMat);
  const theta = (i / 24) * Math.PI * 2;
  const radius = 34;
  wall.position.set(Math.cos(theta) * radius, 1.3, Math.sin(theta) * radius);
  wall.lookAt(0, 1.3, 0);
  scene.add(wall);
}

const grass = new THREE.Mesh(
  new THREE.CircleGeometry(22, 80),
  new THREE.MeshStandardMaterial({color: 0x071118, roughness: 0.94, metalness: 0.02})
);
grass.rotation.x = -Math.PI / 2;
grass.receiveShadow = true;
scene.add(grass);

const car = new THREE.Group();
const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 4), new THREE.MeshStandardMaterial({color: 0xff3c88, roughness: 0.25, metalness: 0.6}));
body.position.y = 0.8;
car.add(body);
const frontWing = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.14, 0.5), new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.5}));
frontWing.position.set(0, 0.45, -1.8);
car.add(frontWing);
const rearWing = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.5), new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.5}));
rearWing.position.set(0, 0.55, 1.9);
car.add(rearWing);
for (let x of [-1, 1]) {
  for (let z of [-1.6, 1.6]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.5, 16), new THREE.MeshStandardMaterial({color: 0x121f33, roughness: 0.5}));
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x * 1, 0.35, z);
    car.add(wheel);
  }
}
car.castShadow = true;
scene.add(car);

const speedDisplay = document.getElementById('f1-speed');
const timerDisplay = document.getElementById('f1-time');
const controlsDisplay = document.getElementById('f1-controls');

const state = {
  angle: 0,
  speed: 0,
  lapTime: 0,
  left: false,
  right: false,
  accelerate: false,
  brake: false,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (canvas.width !== width || canvas.height !== height) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

function updateControls(event, enabled) {
  switch (event.code) {
    case 'ArrowLeft':
    case 'KeyA': state.left = enabled; break;
    case 'ArrowRight':
    case 'KeyD': state.right = enabled; break;
    case 'ArrowUp':
    case 'KeyW': state.accelerate = enabled; break;
    case 'ArrowDown':
    case 'KeyS': state.brake = enabled; break;
  }
  controlsDisplay.textContent = `Controls: ${state.accelerate ? 'Accelerating' : state.brake ? 'Braking' : 'Cruising'} · ${state.left ? 'Turning left' : state.right ? 'Turning right' : 'Straight'}`;
}

window.addEventListener('keydown', (event) => updateControls(event, true));
window.addEventListener('keyup', (event) => updateControls(event, false));
window.addEventListener('resize', resize);

let lastTime = performance.now();
function animate(time) {
  const delta = Math.min(0.06, (time - lastTime) / 1000);
  lastTime = time;

  const accel = state.accelerate ? 42 : state.brake ? -52 : -12;
  state.speed = clamp(state.speed + accel * delta, 0, 28);
  const turnSpeed = 1.5;
  if (state.left) state.angle += turnSpeed * delta * (state.speed / 6);
  if (state.right) state.angle -= turnSpeed * delta * (state.speed / 6);

  const radius = 26;
  const posX = Math.cos(state.angle) * radius;
  const posZ = Math.sin(state.angle) * radius;
  car.position.set(posX, 0, posZ);
  car.rotation.y = -state.angle + Math.PI / 2;

  const camOffset = new THREE.Vector3(
    Math.cos(state.angle) * -8,
    3.5,
    Math.sin(state.angle) * -8
  );
  camera.position.copy(car.position).add(camOffset);
  camera.lookAt(car.position.x, 1.4, car.position.z);

  state.lapTime += delta;
  speedDisplay.textContent = `${Math.round(state.speed * 12)} km/h`;
  timerDisplay.textContent = `${state.lapTime.toFixed(1)}s`;

  resize();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

camera.position.set(0, 8, 26);
camera.lookAt(0, 0, 0);
animate(performance.now());
