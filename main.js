"use strict";

import {
  Clock,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  PMREMGenerator
} from 'three';


import { ARButton } from 'three/addons/webxr/ARButton.js';

import {
  GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';

import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';


/*************************** Initialisattion des paamtres *************************** */

let camera, scene, renderer;
let controller;
let loaded = false;
const objects = [];
const clock = new Clock();


function printGraph(obj) {
  console.group(' <%o> ' + obj.name, obj);
  obj.children.forEach(printGraph);
  console.groupEnd();
}

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


function randomMovement(object, elapsed) {
  const amplitude = 0.5;
  const frequency = 0.5;

  object.position.x = Math.sin(elapsed * frequency) * amplitude;
  object.position.y = Math.cos(elapsed * frequency * 1.5) * amplitude + 1;
  object.position.z = Math.sin(elapsed * frequency * 0.5) * amplitude - 2;
}

function shootBullet(event) {
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const bulletGeometry = new THREE.SphereGeometry(0.1, 32, 32);
  const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

  bullet.position.copy(camera.position);
  bullet.velocity = raycaster.ray.direction.multiplyScalar(10);

  scene.add(bullet);
  bullets.push(bullet);
}



const animate = () => {

  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  const target = scene.getObjectByName('targetA');
  if (target) {
    randomMovement(target, elapsed);
  }



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
    objects[0].position.set(0, 0.5, -2)
  }


  loadGLTF('targetA', 0, 1, -2)


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
