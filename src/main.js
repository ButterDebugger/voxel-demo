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
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const offscreen = canvas.transferControlToOffscreen();

// TODO: offscreen canvas worker: https://github.com/mrdoob/three.js/tree/master/examples/jsm/offscreen
/*
let worker = new Worker("./worker.js", {
    type: "module"
});

worker.postMessage({
    drawingSurface: offscreen,
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: window.devicePixelRatio,
}, [ offscreen ]);
*/

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(scene.background, 750, 1000);

/**
 * Objects
 */

import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { BlockType, BlockFace, blockSize, declareBlocks, Block } from "./blocks.js";
import { Chunk, createOrGetChunk, chunkSize, loadAllChunks, unloadAllChunks, loadNearbyChunks, getChunk } from "./chunks.js";

declareBlocks(scene);

const noise = new SimplexNoise();
const noise2 = new SimplexNoise();

let length = 100;

for (let x = -length; x < length; x++) {
    for (let z = -length; z < length; z++) {
        let y = Math.round((noise.noise(x / 20, z / 20) * 8 + noise2.noise(x / 40, z / 40) * 8) / 2);

        new Block(BlockType.grass, x, y, z, scene);
    }
}

getChunk(0, 0, 0)?.load?.();

// let unSlashLoad = 0;

// setInterval(() => {
//     unSlashLoad = (unSlashLoad + 1) % 2;

//     if (unSlashLoad === 1) {
//         loadAllChunks();
//     } else {
//         unloadAllChunks();
//     }
// }, 5000);

/**
 * Screen resizing
 */

window.addEventListener('resize', () => {
    // Update camera
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
    75,
    canvas.width / canvas.height,
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
    canvas: offscreen,
    antialias: true,
    logarithmicDepthBuffer: true
});
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
    let moved = false;

    if (keys?.KeyW) {
        controls.moveForward(1);
        moved = true;
    }
    if (keys?.KeyA) {
        controls.moveRight(-1);
        moved = true;
    }
    if (keys?.KeyS) {
        controls.moveForward(-1);
        moved = true;
    }
    if (keys?.KeyD) {
        controls.moveRight(1);
        moved = true;
    }
    if (keys?.Space) {
        camera.position.y += 1;
        moved = true;
    }
    if (keys?.Shift) {
        camera.position.y -= 1;
        moved = true;
    }

    if (moved) {
        loadNearbyChunks(camera.position, 4);
    }
}

animate();
