import * as THREE from "three";
import { DynamicInstancedMesh } from "./utils.js";

export const voxelScale = 5;
export const chunkSize = 16;
const blockGeometry = new THREE.BoxGeometry(voxelScale, voxelScale, voxelScale);

let mappings = {
    chunks: {},
    blocks: {},
    blockTypes: {}
}

export class Chunk {
    constructor(x, z) {
        this.position = { x: x, z: z };
        this.blocks = [];
        this.loaded = false;

        mappings.chunks[`${x},${z}`] = this;
    }

    addBlock(block) {
        this.blocks.push(block);

        if (this.loaded) block.addMesh();
    }
    removeBlock(block) {
        let index = this.blocks.findIndex(b => b.position.equals(block.position));

        if (index === -1) return false;

		if (this.loaded) this.blocks[index].removeMesh();
		
        this.blocks.splice(index, 1);

        return true;
    }
    getBlocks() {
        return this.blocks;
    }

    load() {
        if (this.loaded) return;

        for (let block of this.blocks) {
            block.addMesh();
        }

        this.loaded = true;
    }
    unload() {
        if (!this.loaded) return;

        for (let block of this.blocks) {
            block.removeMesh();
        }

        this.loaded = false;
    }
    isLoaded() {
        return this.loaded;
    }
}

export function getChunk(x, z) {
    return mappings.chunks[`${x},${z}`] ?? null;
}
export function getAllChunks() {
	return Object.values(mappings.chunks);
}
export function getLoadedChunks() {
	return getAllChunks().filter(chunk => chunk.isLoaded());
}
export function getUnloadedChunks() {
	return getAllChunks().filter(chunk => !chunk.isLoaded());
}

export class Block {
    constructor(x, y, z, type) {
        this.position = new THREE.Vector3(x, y, z);
        this.type = type;

        mappings.blocks[`${x},${y},${z}`] = this;
    }

    addMesh() {
        this.type.addBlockMesh(this);
    }

    removeMesh() {
        this.type.removeBlockMesh(this);
    }
}

// export function createBlock(override) {}

export class BlockType {
    constructor(name, material, scene, info = {}) {
        this.name = name;
        this.material = material;
        this.info = info;
        
        this.mesh = new DynamicInstancedMesh(blockGeometry, material, 256, scene);
        this.count = 0;
        this.scene = scene;

        mappings.blockTypes[name] = this;
    }

    addBlockMesh(block) {
        let matrix = new THREE.Matrix4().setPosition(block.position.clone().multiplyScalar(voxelScale));
        this.mesh.setMatrixAt(this.mesh.getNextIndex(), matrix);
    }

    removeBlockMesh(block) {
        let blockPosition = block.position.clone().multiplyScalar(voxelScale);

        for (let i = 0; i < this.mesh.count; i++) {
            let matrix = new THREE.Matrix4();
            let position = new THREE.Vector3();
            let quaternion = new THREE.Quaternion();
            let scale = new THREE.Vector3();

            this.mesh.getMatrixAt(i, matrix);
            matrix.decompose(position, quaternion, scale);
            
            if (blockPosition.equals(position)) {
                this.mesh.removeInstanceAt(i);
                return true;
            }
        }

        return false;
    }
}

export function getBlockType(name) {
    return mappings.blockTypes[name] ?? null;
}

/*
 *  Miscellaneous functions
 */

export function createTextureFromUrl(url) {
    let loader = new THREE.TextureLoader();
    let texture = loader.load(url);
    texture.magFilter = THREE.NearestFilter; // Remove antialiasing
    return texture;
}
