import * as THREE from "three";
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const voxelSize = 5;
const blockGeometry = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);
let blockTypes = {};

export class VoxelGroup {
    constructor(scene) {
        this.scene = scene;
        this.voxels = [];
    }

    addVoxel(position, texture) {
        let material = new THREE.MeshBasicMaterial({ map: texture });
        let mesh = new THREE.Mesh(blockGeometry, material);
        mesh.position.copy(position).multiplyScalar(voxelSize);
        this.voxels.push(mesh);
        this.scene.add(mesh);
    }

    getVoxel(position) {
        let voxelPos = position.clone().multiplyScalar(voxelSize);
        let index = this.voxels.findIndex(vox => vox.position.equals(voxelPos));

        if (index == -1) return null;

        return this.voxels[index];
    }

    removeVoxel(position) {
        let voxelPos = position.clone().multiplyScalar(voxelSize);
        let index = this.voxels.findIndex(vox => vox.position.equals(voxelPos));

        if (index == -1) return false;

        let mesh = this.voxels[index];
        this.scene.remove(mesh);
        this.voxels.splice(index, 1);

        return true;
    }
}

export class Block {
    constructor(x, y, z, type) {
        this.position = new THREE.Vector3(x, y, z).multiplyScalar(voxelSize);
        this.type = type;
    }

    add() {
        let matrix = new THREE.Matrix4().setPosition(this.position);
        this.type.mesh.setMatrixAt(this.type.count++, matrix);
        this.type.mesh.count++;
        this.type.mesh.instanceMatrix.needsUpdate = true;
        this.type.mesh.computeBoundingSphere();
    }
}

export class BlockType {
    constructor(name, material, scene, info = {}) {
        this.name = name;
        this.material = material;
        this.mesh = new THREE.InstancedMesh(blockGeometry, material, 100);
        this.count = 0;
        this.info = info;

        scene.add(this.mesh);

        blockTypes[name] = this;
    }
}

export function getBlockType(name) {
    return blockTypes[name] ?? null;
}

export function createTextureFromUrl(url) {
    let loader = new THREE.TextureLoader();
    let texture = loader.load(url);
    texture.magFilter = THREE.NearestFilter; // Remove antialiasing
    return texture;
}
