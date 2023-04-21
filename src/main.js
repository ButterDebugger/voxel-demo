import * as THREE from "three";
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { GUI } from "dat.gui";
import Stats from "three/examples/jsm/libs/stats.module";

/**
 * GUI Controls
 */
const gui = new GUI();

const stats = new Stats();
document.body.appendChild(stats.dom);

/**
 * Base
 */

// Canvas
const canvas = document.querySelector("canvas");

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

/**
 * Object
 */

import { VoxelGroup, createTextureFromUrl, BlockType, Block, getBlockType } from "./voxels.js";

const voxGroup = new VoxelGroup(scene);

new BlockType("grass", new THREE.MeshBasicMaterial({ color: 0x00ff00 }), scene);

import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";

const noise = new SimplexNoise();

for (let x = 0; x < 25; x++) {
  for (let z = 0; z < 25; z++) {
    let y = Math.round(noise.noise(x / 100, z / 100) * 10);

    new Block(x, y, z, getBlockType("grass")).add();

    // voxGroup.addVoxel(new THREE.Vector3(x, y, z), createTextureFromUrl("./grass.png"));

    // for (let i = y - 1; i < y; i++) {
    //   voxGroup.addVoxel(new THREE.Vector3(x, i, z), createTextureFromUrl("./grass.png"));
    // }
  }
}

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.001,
  5000
);
camera.position.y = 5;
scene.add(camera);

const axesHelper = new THREE.AxesHelper(30);
scene.add(axesHelper);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Controls
const controls = new PointerLockControls(camera, canvas);

canvas.addEventListener("click", () => {
  controls.lock();
});

/**
 * Animate
 */
const animate = () => {
  // Call animate again on the next frame
  requestAnimationFrame(animate);

  // Update controls
  updateControls();

  // Render
  renderer.render(scene, camera);
  
  // Update stats
  stats.update();
}

function updateControls() {
  if (keys?.KeyW) {
    controls.moveForward(1);
  }
  if (keys?.KeyA) {
    controls.moveRight(-1);
  }
  if (keys?.KeyS) {
    controls.moveForward(-1);
  }
  if (keys?.KeyD) {
    controls.moveRight(1);
  }
  if (keys?.Space) {
    camera.position.y += 1;
  }
  if (keys?.Shift) {
    camera.position.y -= 1;
  }
}

animate();
