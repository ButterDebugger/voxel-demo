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
scene.fog = new THREE.Fog(scene.background, 750, 1000);

/**
 * Object
 */

import { createTextureFromUrl, BlockType, Block, getBlockType, generateChunk } from "./voxels.js";

new BlockType("grass", [
    new THREE.MeshBasicMaterial({ map: createTextureFromUrl('./assets/grass_side.png') }), // right side
    new THREE.MeshBasicMaterial({ map: createTextureFromUrl('./assets/grass_side.png') }), // left side
    new THREE.MeshBasicMaterial({ map: createTextureFromUrl('./assets/grass.png') }), // top side
    new THREE.MeshBasicMaterial({ map: createTextureFromUrl('./assets/dirt.png') }), // bottom side
    new THREE.MeshBasicMaterial({ map: createTextureFromUrl('./assets/grass_side.png') }), // front side
    new THREE.MeshBasicMaterial({ map: createTextureFromUrl('./assets/grass_side.png') }), // back side
], scene);

import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";

const noise = new SimplexNoise();

let worldSize = 10;

for (let x = -worldSize; x < worldSize; x++) {
    for (let z = -worldSize; z < worldSize; z++) {
        let c = generateChunk(x, z, noise);
        c.load();
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
    0.01,
    1000
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
    logarithmicDepthBuffer: true
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Controls
const controls = new PointerLockControls(camera, document.body);

controls.lock = function lock() { // Fixed issue on chrome https://github.com/mrdoob/three.js/issues/12757
    this.domElement.requestPointerLock({
        unadjustedMovement: true,
    })
}

canvas.addEventListener("click", () => {
    controls.lock();
});







// import { DynamicInstancedMesh } from "./utils.js";

// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
// let dynamicMesh = new DynamicInstancedMesh(geometry, [
//     new THREE.MeshBasicMaterial({ map: createTextureFromUrl('./grass_side.png') }), // right side
//     new THREE.MeshBasicMaterial({ map: createTextureFromUrl('./grass_side.png') }), // left side
//     new THREE.MeshBasicMaterial({ map: createTextureFromUrl('./grass.png') }), // top side
//     new THREE.MeshBasicMaterial({ map: createTextureFromUrl('./dirt.png') }), // bottom side
//     new THREE.MeshBasicMaterial({ map: createTextureFromUrl('./grass_side.png') }), // front side
//     new THREE.MeshBasicMaterial({ map: createTextureFromUrl('./grass_side.png') }), // back side
// ], 10, scene);

// let iwer = 0;

// setInterval(() => {
//     dynamicMesh.setMatrixAt(iwer, new THREE.Matrix4().setPosition(new THREE.Vector3(iwer % 100, 0, Math.floor(iwer / 100))));
//     console.log(iwer % 100, Math.floor(iwer / 100))

//     iwer += 1;
// }, 1);










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
