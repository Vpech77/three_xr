"use strict";

import {
  Clock,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  PMREMGenerator,
  SphereGeometry,
  MeshBasicMaterial,
  Mesh,

} from 'three';

import { ARButton } from 'three/addons/webxr/ARButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

let camera, scene, renderer;
let controller;
const objects = [];
const bullets = [];
const speed = 50;
const clock = new Clock();

function loadGLTF(name, x, y, z) {
  const loader = new GLTFLoader();
  loader.load(`assets/models/${name}.glb`, function (gltf) {
    const piece = gltf.scene;
    piece.name = `${name}`;
    piece.position.set(x, y, z);

    if (name === 'targetA') {
      piece.rotateY(- Math.PI / 2);
    }

    scene.add(piece);
    objects.push(piece);

  }, undefined, function (error) {
    console.error(error);
  });
}

function generateRandomPosition() {
  const rangeX = 2;
  const rangeY = 1;
  const distanceZ = -2;

  const x = (Math.random() * rangeX) - rangeX / 2;
  const y = Math.random() * rangeY + 0.5;
  const z = distanceZ;

  return { x, y, z };
}


function spawnNewTarget() {
  const { x, y, z } = generateRandomPosition();

  const loader = new GLTFLoader();
  loader.load('assets/models/targetA.glb', function (gltf) {
    const target = gltf.scene;
    target.name = 'targetA';
    target.rotateY(- Math.PI / 2);
    target.position.set(x, y, z);
    target.userData.phase = Math.random() * Math.PI * 2;
    target.userData.startX = x;
    target.userData.startY = y;
    target.userData.startZ = z;

    scene.add(target);

  }, undefined, function (error) {
    console.error('Erreur lors du chargement du modèle :', error);
  });
}

function randomMovementWithPhase(object, elapsed) {
  const amplitude = 1.8;
  const frequency = 0.8;

  object.userData.startX = object.userData.startX ?? object.position.x;
  object.userData.startY = object.userData.startY ?? object.position.y;
  object.userData.startZ = object.userData.startZ ?? object.position.z;

  const phase = object.userData.phase || 0;

  object.position.x = object.userData.startX + Math.sin(elapsed * frequency + phase) * amplitude;
  object.position.y = object.userData.startY + Math.cos(elapsed * frequency * 1.5 + phase) * amplitude;
  object.position.z = object.userData.startZ + Math.sin(elapsed * frequency * 0.7 + phase) * amplitude;

}

let score = 0;

const animate = () => {
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  const target = scene.getObjectByName('targetA');
  if (target) {
    randomMovementWithPhase(target, elapsed);
  }

  bullets.forEach((bullet, index) => {
    bullet.translateZ(-speed * delta);

    if (target) {
      const distance = bullet.position.distanceTo(target.position);
      if (distance < 0.5) {

        score++;
        console.log(`Cible touchée ! Score : ${score}`);
        scene.remove(target);

        setTimeout(() => {
          spawnNewTarget();
        }, 1_000);

        scene.remove(bullet);
        bullets.splice(index, 1);
    }}

    if (bullet.position.length() > 20) {
      scene.remove(bullet);
      bullets.splice(index, 1);
    }
  });
  renderer.render(scene, camera);
};

const init = () => {
  scene = new Scene();
  camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
  renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);
  const environment = new RoomEnvironment();
  const pmremGenerator = new PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(environment).texture;
  const xrButton = ARButton.createButton(renderer, {});
  xrButton.style.backgroundColor = 'skyblue';
  document.body.appendChild(xrButton);


  const onSelect = (event) => {

      const bulletGeometry = new SphereGeometry(0.05, 32, 32);
      const bulletMaterial = new MeshBasicMaterial({ color: 0xff0000 });
      const bullet = new Mesh(bulletGeometry, bulletMaterial);

      bullet.position.set( 0, 0, 0 ).applyMatrix4( controller.matrixWorld );
      bullet.quaternion.setFromRotationMatrix( controller.matrixWorld );
    
      scene.add(bullet);
      bullets.push(bullet);
    
  }

  loadGLTF('targetA', 0, 1, -3)

  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);
  window.addEventListener('resize', onWindowResize, false);
}

init();

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}
