import * as THREE from "three";

// TODO: reincorporate computeBoundingSphere without it affecting performance

export class DynamicInstancedMesh {
    constructor(geometry, material, count, scene) {
        this.mesh = new THREE.InstancedMesh(geometry, material, count);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.scene = scene;
        this.availableIndexes = new Set();
        this.count = 0;
        this.mesh.count = 0;
        this.maxCount = count;

        this.setBlankMatrix = (i) => { // TODO: Set a blank matrix for the given index (offers no performance gain, just makes them invisible)
            this.mesh.setMatrixAt(i, new THREE.Matrix4().scale(new THREE.Vector3()));
            this.mesh.instanceMatrix.needsUpdate = true;
            // this.mesh.computeBoundingSphere();
        }
        this.scene.add(this.mesh);

        if (typeof this.setBlankMatrix === 'function') {
            for (let i = 0; i < count; i++) {
                this.setBlankMatrix(i);
            }
        }
    }

    rebuild() {
        this.mesh.dispose();

        let originalCount = this.maxCount;
        let newMesh = new THREE.InstancedMesh(this.mesh.geometry, this.mesh.material, this.maxCount *= 2);
        newMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        let countIncrease = this.maxCount - originalCount;
        
        // Copy the matrices from the old mesh to the new mesh
        for (let i = 0; i < this.mesh.count; i++) {
            let matrix = new THREE.Matrix4();
            this.mesh.getMatrixAt(i, matrix);
            newMesh.setMatrixAt(i, matrix);
        }

        if (typeof this.setBlankMatrix === 'function') {
            for (let i = originalCount; i <= originalCount + countIncrease; i++) {
                this.setBlankMatrix(i);
            }
        }
        
        this.scene.add(newMesh);
        this.scene.remove(this.mesh);

        this.mesh = newMesh;
        this.mesh.count = this.count;
        this.mesh.instanceMatrix.needsUpdate = true;
        // this.mesh.computeBoundingSphere();
    }

    getNextIndex() {
        if (this.availableIndexes.size > 0) {
            return this.availableIndexes.values().next().value;
        }
        return this.count;
    }
    

    /*
     *  Remade instanced mesh methods
     */

    computeBoundingBox() {
        return this.mesh.computeBoundingBox();
    }

    computeBoundingSphere() {
        return this.mesh.computeBoundingSphere();
    }

    dispose() {
        return this.mesh.dispose();
    }

    getColorAt(index, color) {
        return this.mesh.getColorAt(index, color);
    }

    getMatrixAt(index, matrix) {
        return this.mesh.getMatrixAt(index, matrix);
    }

    setColorAt(index, color) { // TODO: test this
        return this.mesh.setColorAt(index, color);
    }

    setMatrixAt(index, matrix) {
        let oldCount = this.count;
        this.count = Math.max(this.count, index + 1);
        for (let i = oldCount; i < this.count - 1; i++) {
            this.availableIndexes.add(i);
        }
        this.availableIndexes.delete(index);

        this.mesh.count = this.count;
        this.mesh.instanceMatrix.needsUpdate = true;
        // this.mesh.computeBoundingSphere();

        if (this.count >= this.maxCount) {
            this.rebuild();
        }
        
        return this.mesh.setMatrixAt(index, matrix);
    }

    /*
     *  Custom instanced mesh methods
     */

    removeInstanceAt(index) {
        this.availableIndexes.add(index);
        this.setBlankMatrix(index);

        // TODO: add automatic downsizing of the instanced mesh
    }
}