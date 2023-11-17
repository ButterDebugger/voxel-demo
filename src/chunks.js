import * as THREE from "three";
import { Block, blockSize } from "./blocks.js";

export const chunkSize = 16; // FIXME: blocks render weirdly when this isn't set to 16
const chunks = {};

// TODO: clamp blocks into chunks

export class Chunk {
    constructor(x, y, z, scene) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.scene = scene;

        this.loaded = false;
        this.blocks = [];

        for (let x = 0; x < chunkSize; x++) {
            this.blocks[x] = [];

            for (let y = 0; y < chunkSize; y++) {
                this.blocks[x][y] = new Array(chunkSize);
            }
        }
    }

    load() {
        if (this.loaded) return;
        this.loaded = true;

        for (let xAxis of this.blocks) {
            for (let yAxis of xAxis) {
                for (let block of yAxis) {
                    if (!(block instanceof Block)) continue;

                    block.cullFaces();
                    block.render();
                }
            }
        }
    }
    unload() {
        if (!this.loaded) return;
        this.loaded = false;

        for (let xAxis of this.blocks) {
            for (let yAxis of xAxis) {
                for (let block of yAxis) {
                    if (!(block instanceof Block)) continue;
                    
                    block.unrender();
                }
            }
        }
    }

    addBlock(block) {
        let relativeX = Math.abs(block.x % chunkSize);
        let relativeY = Math.abs(block.y % chunkSize);
        let relativeZ = Math.abs(block.z % chunkSize);

        this.blocks[relativeX][relativeY][relativeZ] = block; // TODO: replace existing blocks

        if (this.loaded) {
            block.cullFaces();
            block.render();
        }
    }

    cullBlocks() {
        for (let xAxis of this.blocks) {
            for (let yAxis of xAxis) {
                for (let block of yAxis) {
                    if (!(block instanceof Block)) continue;
                    
                    // block.cullFaces();
                }
            }
        }
    }
}

export function createOrGetChunk(x, y, z, scene) {
    let key = `${x}:${y}:${z}`;
    let chunk = chunks[key];

    if (typeof chunk == "undefined") {
        chunk = new Chunk(x, y, z, scene);
        chunks[key] = chunk;
    }

    return chunk;
}

export function getChunk(x, y, z) {
    let key = `${x}:${y}:${z}`;
    return chunks[key] ?? null;
}

export function isChunkAtPos(chunkX, chunkY, chunkZ) {
    let key = `${chunkX}:${chunkY}:${chunkZ}`;
    return !!chunks[key];
}

export function getBlock(worldX, worldY, worldZ) {
    let chunkX = Math.floor(worldX / chunkSize);
    let chunkY = Math.floor(worldY / chunkSize);
    let chunkZ = Math.floor(worldZ / chunkSize);

    if (!isChunkAtPos(chunkX, chunkY, chunkZ)) return null;

    let relativeX = Math.abs(worldX % chunkSize);
    let relativeY = Math.abs(worldY % chunkSize);
    let relativeZ = Math.abs(worldZ % chunkSize);

    return chunks[`${chunkX}:${chunkY}:${chunkZ}`].blocks[relativeX][relativeY][relativeZ];
}

export function loadAllChunks() {
    for (let chunkKey of Object.keys(chunks)) {
        let chunk = chunks[chunkKey];
        
        chunk.load();
        chunk.cullBlocks();
    }
}

export function unloadAllChunks() {
    for (let chunkKey of Object.keys(chunks)) {
        let chunk = chunks[chunkKey];
        
        chunk.unload();
    }
}

export function loadNearbyChunks(position, renderDistance) {
    let relativePos = position.clone().divideScalar(chunkSize * blockSize).round();
    let loadedChunks = Object.values(chunks).filter(chunk => chunk.loaded);
    let nearbyChunks = [];

    for (let x = relativePos.x - renderDistance; x < relativePos.x + renderDistance; x++) {
        for (let z = relativePos.z - renderDistance; z < relativePos.z + renderDistance; z++) {
            let distance = new THREE.Vector2(relativePos.x, relativePos.z).distanceTo(new THREE.Vector2(x, z));
            if (distance > renderDistance) continue;

            for (let y = relativePos.y - renderDistance; y < relativePos.y + renderDistance; y++) {
                if (!isChunkAtPos(x, y, z)) continue;
    
                nearbyChunks.push(getChunk(x, y, z));
            }
        }
    }

    for (let loadedChunk of loadedChunks) {
        if (nearbyChunks.includes(loadedChunk)) continue;

        loadedChunk.unload();
    }

    for (let nearbyChunk of nearbyChunks) {
        if (loadedChunks.includes(nearbyChunk)) continue;

        nearbyChunk.load();
    }
}
