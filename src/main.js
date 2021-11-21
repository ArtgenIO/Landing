// Based on the https://github.com/the-halfbloodprince/GalaxyM1199 project <3

import * as THREE from 'three';
import { AdditiveBlending } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import './main.scss';

const textureLoader = new THREE.TextureLoader();
const shape = textureLoader.load(
  new URL('img/particle.png', import.meta.url).toString(),
);

// Canvas
const canvas = document.querySelector('canvas.webgl');
// Scene
const scene = new THREE.Scene();
// Galaxy Config
const config = {};

config.count = 70000;
config.size = 0.014;
config.radius = 5.5;
config.branches = 6;
config.spin = -1.75;
config.randomness = 8.5;
config.randomnessPower = 4.9;
config.stars = 18000;
config.starColor = '#37393f';
config.insideColor = '#ff6040';
config.outsideColor = '#521b82';

let bgStarsGeometry = null;
let bgStarsMaterial = null;
let bgStars = null;

//Background stars
function generateBgStars() {
  if (bgStars !== null) {
    bgStarsGeometry.dispose();
    bgStarsMaterial.dispose();
    scene.remove(bgStars);
  }

  bgStarsGeometry = new THREE.BufferGeometry();
  const bgStarsPositions = new Float32Array(config.stars * 3);

  for (let j = 0; j < config.stars; j++) {
    bgStarsPositions[j * 3 + 0] = (Math.random() - 0.5) * 20;
    bgStarsPositions[j * 3 + 1] = (Math.random() - 0.5) * 20;
    bgStarsPositions[j * 3 + 2] = (Math.random() - 0.5) * 20;
  }

  bgStarsGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(bgStarsPositions, 3),
  );

  bgStarsMaterial = new THREE.PointsMaterial({
    size: config.size,
    depthWrite: false,
    sizeAttenuation: true,
    blending: AdditiveBlending,
    color: config.starColor,
    transparent: true,
    alphaMap: shape,
  });

  bgStars = new THREE.Points(bgStarsGeometry, bgStarsMaterial);

  scene.add(bgStars);
}

generateBgStars();

// Generate the galaxy shape
let geometry = null;
let material = null;
let points = null;
let composer;

function generateGalaxy() {
  if (points !== null) {
    geometry.dispose();
    material.dispose();
    scene.remove(points);
  }

  geometry = new THREE.BufferGeometry();

  const positions = new Float32Array(config.count * 3);
  const colors = new Float32Array(config.count * 3);

  const colorInside = new THREE.Color(config.insideColor);
  const colorOutside = new THREE.Color(config.outsideColor);

  for (let i = 0; i < config.count; i++) {
    //Position
    const x = Math.random() * config.radius;
    const branchAngle = ((i % config.branches) / config.branches) * 2 * Math.PI;
    const spinAngle = x * config.spin;

    const randomX =
      Math.pow(Math.random(), config.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1);
    const randomY =
      Math.pow(Math.random(), config.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1);
    const randomZ =
      Math.pow(Math.random(), config.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1);

    positions[i * 3] = Math.sin(branchAngle + spinAngle) * x + randomX;
    positions[i * 3 + 1] = randomY;
    positions[i * 3 + 2] = Math.cos(branchAngle + spinAngle) * x + randomZ;

    // Color
    const mixedColor = colorInside.clone();
    mixedColor.lerp(colorOutside, x / config.radius);

    colors[i * 3 + 0] = mixedColor.r;
    colors[i * 3 + 1] = mixedColor.g;
    colors[i * 3 + 2] = mixedColor.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  material = new THREE.PointsMaterial({
    color: 'white',
    size: config.size,
    depthWrite: false,
    sizeAttenuation: true,
    blending: AdditiveBlending,
    vertexColors: true,
    transparent: true,
    alphaMap: shape,
  });

  points = new THREE.Points(geometry, material);
  scene.add(points);
}

generateGalaxy();

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  composer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Base camera
const camera = new THREE.PerspectiveCamera(
  70,
  sizes.width / sizes.height,
  1,
  50,
);
camera.position.x = 5;
camera.position.y = 2.5;
camera.position.z = 3;
camera.lookAt(0, 5, 0);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const params = {
  bloomStrength: 1.0,
  bloomThreshold: 0.1,
  bloomRadius: -0.25,
};

const renderScene = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,
  0.4,
  0.85,
);
bloomPass.threshold = params.bloomThreshold;
bloomPass.strength = params.bloomStrength;
bloomPass.radius = params.bloomRadius;

composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// Animate
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  //Update the camera
  points.rotation.y = elapsedTime * 0.025;
  bgStars.rotation.y = -elapsedTime * 0.04;

  // Render
  //renderer.render(scene, camera);
  composer.render();

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
