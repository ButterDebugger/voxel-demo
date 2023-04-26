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

import { loadNearbyChunks, init as initTerrain } from "./terrain.js";

initTerrain(scene);

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
