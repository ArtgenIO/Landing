// Based on the https://github.com/the-halfbloodprince/GalaxyM1199 project <3

import Gumshoe from 'gumshoejs';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Clock,
  Color,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const textureLoader = new TextureLoader();
const shape = textureLoader.load(
  new URL('img/particle.png', import.meta.url).toString(),
);

// Canvas
const canvas = document.querySelector('canvas.webgl');
const scene = new Scene();

// Create default renderer
const renderer = new WebGLRenderer({
  canvas: canvas,
});

// Galaxy Config
const config = {};
config.count = 70000;
config.size = 0.014;
config.radius = 5.5;
config.branches = 6;
config.spin = -2;
config.randomness = 8.5;
config.randomnessPower = 4.9;
config.stars = 18000;
config.starColor = '#37393f';
config.insideColor = '#2df0b2';
config.outsideColor = '#4b21a8';

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

  bgStarsGeometry = new BufferGeometry();
  const bgStarsPositions = new Float32Array(config.stars * 3);

  for (let j = 0; j < config.stars; j++) {
    bgStarsPositions[j * 3 + 0] = (Math.random() - 0.5) * 20;
    bgStarsPositions[j * 3 + 1] = (Math.random() - 0.5) * 20;
    bgStarsPositions[j * 3 + 2] = (Math.random() - 0.5) * 20;
  }

  bgStarsGeometry.setAttribute(
    'position',
    new BufferAttribute(bgStarsPositions, 3),
  );

  bgStarsMaterial = new PointsMaterial({
    size: config.size,
    depthWrite: false,
    sizeAttenuation: true,
    blending: AdditiveBlending,
    color: config.starColor,
    transparent: true,
    alphaMap: shape,
  });

  bgStars = new Points(bgStarsGeometry, bgStarsMaterial);

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

  geometry = new BufferGeometry();

  const positions = new Float32Array(config.count * 3);
  const colors = new Float32Array(config.count * 3);

  const colorInside = new Color(config.insideColor);
  const colorOutside = new Color(config.outsideColor);

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

  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('color', new BufferAttribute(colors, 3));

  material = new PointsMaterial({
    color: 'white',
    size: config.size,
    depthWrite: false,
    sizeAttenuation: true,
    blending: AdditiveBlending,
    vertexColors: true,
    transparent: true,
    alphaMap: shape,
  });

  points = new Points(geometry, material);
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
const camera = new PerspectiveCamera(70, sizes.width / sizes.height, 1, 50);
camera.position.x = 5;
camera.position.y = 2.5;
camera.position.z = 3;
camera.lookAt(0, 5, 0);

scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const params = {
  bloomStrength: 1.0,
  bloomThreshold: 0.1,
  bloomRadius: -0.25,
};

const renderScene = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(
  new Vector2(window.innerWidth, window.innerHeight),
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
const clock = new Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  //Update the camera
  points.rotation.y = -elapsedTime * 0.02;
  bgStars.rotation.y = -elapsedTime * 0.002;
  camera.rotation.x = 30;

  // Render
  //renderer.render(scene, camera);
  composer.render();

  // Call tick again on the next frame
  if (window.innerWidth < 3000) {
    window.requestAnimationFrame(tick);
  }
};

window.onload = () => {
  tick();
  new Gumshoe('.menu a');
};

window.createScreenShot = () => {
  try {
    const strMime = 'image/jpeg';
    const imgData = renderer.domElement.toDataURL(strMime);

    saveFile(imgData.replace(strMime, 'image/octet-stream'), 'test.jpg');
  } catch (e) {
    console.log(e);
    return;
  }
};

var saveFile = function (strData, filename) {
  var link = document.createElement('a');
  if (typeof link.download === 'string') {
    document.body.appendChild(link); //Firefox requires the link to be in the body
    link.download = filename;
    link.href = strData;
    link.click();
    document.body.removeChild(link); //remove the link when done
  } else {
    location.replace(uri);
  }
};
