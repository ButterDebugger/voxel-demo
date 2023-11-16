import * as THREE from "three";
import { chunkSize, createTextureFromUrl } from "./old/voxels.js";
import { createOrGetChunk, getBlock } from "./chunks.js";
import { DynamicInstancedMesh } from "./utils.js";

export const blockSize = 10;

export const BlockFace = Object.freeze({
	Top: 1,
	Bottom: 2,
	North: 4,
	East: 8,
	South: 16, // Front
	West: 32
});

export function declareBlocks(scene) {
	BlockPlane.grassTop = new BlockPlane(createTextureFromUrl('./assets/grass.png'), scene);
	BlockPlane.grassSide = new BlockPlane(createTextureFromUrl('./assets/grass_side.png'), scene);
	BlockPlane.dirt = new BlockPlane(createTextureFromUrl('./assets/dirt.png'), scene);

	BlockType.grass = new BlockType(
		BlockPlane.grassTop,
		BlockPlane.dirt,
		BlockPlane.grassSide,
		BlockPlane.grassSide,
		BlockPlane.grassSide,
		BlockPlane.grassSide
	);
}

export class BlockPlane {
	constructor(texture, scene) {
		this.texture = texture;

		let geometry = new THREE.PlaneGeometry(blockSize, blockSize);
		let material = new THREE.MeshBasicMaterial({
			map: this.texture,
			side: THREE.DoubleSide
		});
		this.mesh = new DynamicInstancedMesh(geometry, material, 256, scene);
		this.count = 0;
		this.scene = scene;
	}

	getBlockMeshMatrix(block, face) {
		let matrix = new THREE.Matrix4();

		switch (face) {
			case BlockFace.Top:
				matrix.makeRotationX(Math.PI * 1.5);
				matrix.setPosition(
					new THREE.Vector3(block.x, block.y, block.z)
						.multiplyScalar(blockSize)
						.add(new THREE.Vector3(0, blockSize / 2, 0))
				);
				break;
			case BlockFace.Bottom:
				matrix.makeRotationX(Math.PI / 2);
				matrix.setPosition(
					new THREE.Vector3(block.x, block.y, block.z)
						.multiplyScalar(blockSize)
						.add(new THREE.Vector3(0, -blockSize / 2, 0))
				);
				break;
			case BlockFace.North:
				matrix.makeRotationY(Math.PI);
				matrix.setPosition(
					new THREE.Vector3(block.x, block.y, block.z)
						.multiplyScalar(blockSize)
						.add(new THREE.Vector3(0, 0, -blockSize / 2))
				);
				break;
			case BlockFace.East:
				matrix.makeRotationY(Math.PI / 2);
				matrix.setPosition(
					new THREE.Vector3(block.x, block.y, block.z)
						.multiplyScalar(blockSize)
						.add(new THREE.Vector3(blockSize / 2, 0, 0))
				);
				break;
			case BlockFace.South:
				matrix.setPosition(
					new THREE.Vector3(block.x, block.y, block.z)
						.multiplyScalar(blockSize)
						.add(new THREE.Vector3(0, 0, blockSize / 2))
				);
				break;
			case BlockFace.West:
				matrix.makeRotationY(Math.PI * 1.5);
				matrix.setPosition(
					new THREE.Vector3(block.x, block.y, block.z)
						.multiplyScalar(blockSize)
						.add(new THREE.Vector3(-blockSize / 2, 0, 0))
				);
				break;
			default:
				break;
		}

		return matrix;
	}

	addBlockMesh(block, face) {
		let matrix = this.getBlockMeshMatrix(block, face);
		this.mesh.setMatrixAt(this.mesh.getNextIndex(), matrix);
	}

	removeBlockMesh(block, face) {
		let faceMatrix = this.getBlockMeshMatrix(block, face);
		let facePosition = new THREE.Vector3();
		let faceQuaternion = new THREE.Quaternion();
		let faceScale = new THREE.Vector3();

		faceMatrix.decompose(facePosition, faceQuaternion, faceScale);

		for (let i = 0; i < this.mesh.count; i++) {
			let matrix = new THREE.Matrix4();
			let position = new THREE.Vector3();
			let quaternion = new THREE.Quaternion();
			let scale = new THREE.Vector3();

			this.mesh.getMatrixAt(i, matrix);
			matrix.decompose(position, quaternion, scale);

			if (facePosition.equals(position)) {
				this.mesh.removeInstanceAt(i);
				return true;
			}
		}

		return false;
	}
}

export class BlockType {
	constructor(topPlane, bottomPlane, northPlane, eastPlane, southPlane, westPlane) {
		this.topPlane = topPlane;
		this.bottomPlane = bottomPlane;
		this.northPlane = northPlane;
		this.eastPlane = eastPlane;
		this.southPlane = southPlane;
		this.westPlane = westPlane;
	}

	createBlock(worldX, worldY, worldZ, scene) {
		return new Block(this, worldX, worldY, worldZ, scene);
	}

	getPlane(face) {
		switch (face) {
			case BlockFace.Top:
				return this.topPlane;
			case BlockFace.Bottom:
				return this.bottomPlane;
			case BlockFace.North:
				return this.northPlane;
			case BlockFace.East:
				return this.eastPlane;
			case BlockFace.South:
				return this.southPlane;
			case BlockFace.West:
				return this.westPlane;
			default:
				break;
		}
	}
}

export class Block {
	constructor(type, worldX, worldY, worldZ, scene) {
		this.culledFaces = [];
		this.faces = [
			BlockFace.Top,
			BlockFace.Bottom,
			BlockFace.North,
			BlockFace.East,
			BlockFace.South,
			BlockFace.West
		];
		this.previousFaces = [];
		this.isRendered = false;
		this.type = type;
		this.x = worldX;
		this.y = worldY;
		this.z = worldZ;

		// Get the chunk this block should belong to
		let chunkX = Math.floor(worldX / chunkSize);
		let chunkY = Math.floor(worldY / chunkSize);
		let chunkZ = Math.floor(worldZ / chunkSize);

		this.chunk = createOrGetChunk(chunkX, chunkY, chunkZ, scene);
		this.chunk.addBlock(this);
	}

	cullFaces() {
		let newFaces = [];

		if (!(getBlock(this.x, this.y + 1, this.z) instanceof Block)) {
			newFaces.push(BlockFace.Top);
		}

		if (!(getBlock(this.x, this.y - 1, this.z) instanceof Block)) {
			newFaces.push(BlockFace.Bottom);
		}

		if (!(getBlock(this.x, this.y, this.z + 1) instanceof Block)) {
			newFaces.push(BlockFace.South);
		}

		if (!(getBlock(this.x, this.y, this.z - 1) instanceof Block)) {
			newFaces.push(BlockFace.North);
		}

		if (!(getBlock(this.x + 1, this.y, this.z) instanceof Block)) {
			newFaces.push(BlockFace.East);
		}

		if (!(getBlock(this.x - 1, this.y, this.z) instanceof Block)) {
			newFaces.push(BlockFace.West);
		}

		this.faces = newFaces;
	}

	render() {
		if (this.isRendered) this.unrender();

		for (let face of this.faces) {
			let plane = this.type.getPlane(face);
			plane.addBlockMesh(this, face);
		}
		this.isRendered = true;
		this.previousFaces = this.faces.slice();
	}
	unrender() {
		for (let face of this.previousFaces) {
			let plane = this.type.getPlane(face);

			plane.removeBlockMesh(this, face);
		}
		this.isRendered = false;
	}
}
