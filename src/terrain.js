import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { Chunk, chunkSize, voxelScale, getAllChunks, getChunk, getLoadedChunks, getBlockType, Block, createTextureFromUrl, BlockType } from "./voxels.js";

const noise = new SimplexNoise();

const chunkScale = chunkSize * voxelScale;

export function init(scene) {
    new BlockType("grass", [
        new THREE.MeshBasicMaterial({ map: createTextureFromUrl('./assets/grass_side.png') }), // right side
        new THREE.MeshBasicMaterial({ map: createTextureFromUrl('./assets/grass_side.png') }), // left side
        new THREE.MeshBasicMaterial({ map: createTextureFromUrl('./assets/grass.png') }), // top side
        new THREE.MeshBasicMaterial({ map: createTextureFromUrl('./assets/dirt.png') }), // bottom side
        new THREE.MeshBasicMaterial({ map: createTextureFromUrl('./assets/grass_side.png') }), // front side
        new THREE.MeshBasicMaterial({ map: createTextureFromUrl('./assets/grass_side.png') }), // back side
    ], scene);

    let worldSize = 10;
    
    for (let x = -worldSize; x < worldSize; x++) {
        for (let z = -worldSize; z < worldSize; z++) {
            generateChunk(x, z, noise);
        }
    }
}

export function loadNearbyChunks(playerPosition, renderDistance) {
	for (let x = Math.floor(playerPosition.x / chunkScale) - renderDistance; x < Math.floor(playerPosition.x / chunkScale) + renderDistance; x++) {
        for (let z = Math.floor(playerPosition.z / chunkScale) - renderDistance; z < Math.floor(playerPosition.z / chunkScale) + renderDistance; z++) {
            let chunk = getChunk(x, z);

            if (chunk === null) {
                generateChunk(x, z, noise).load();
            } else {
                chunk.load();
            }
        }
    }

    // TODO: unload chunks
}

export function generateChunk(chunkX, chunkZ, noise) {
    let chunk = new Chunk(chunkX, chunkZ);

    for (let x = chunkX * chunkSize; x < chunkX * chunkSize + chunkSize; x++) {
        for (let z = chunkZ * chunkSize; z < chunkZ * chunkSize + chunkSize; z++) {
            let y = Math.round(noise.noise(x / 100, z / 100) * 10);
    
            let b = new Block(x, y, z, getBlockType("grass"));
            chunk.addBlock(b);
        }
    }

    return chunk;
}