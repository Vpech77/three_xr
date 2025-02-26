"use strict";

import {
  Clock,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  PMREMGenerator
} from 'three';


import { XRButton } from 'three/addons/webxr/XRButton.js';

import {
  GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';

import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

let camera, scene, renderer;
let controller;

const objects = [];

const clock = new Clock();

const animate = () => {

  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

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

  const xrButton = XRButton.createButton(renderer, {});
  xrButton.style.backgroundColor = 'skyblue';
  document.body.appendChild(xrButton);


  const onSelect = (event) => {

    objects[0].position.set(0, 0, - 0.5).applyMatrix4(controller.matrixWorld);

  }
  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);
  window.addEventListener('resize', onWindowResize, false);

}

init();


function loadData() {
  new GLTFLoader()
    .setPath('assets/models/')
    .load('./targetA.glb', gltfReader);
}

function gltfReader(gltf) {
  let testModel = null;

  testModel = gltf.scene;

  if (testModel != null) {
    console.log("Model loaded:  " + testModel);
    objects.push(testModel);
    testModel.rotateY(- Math.PI / 2);
    if (controller) {
      testModel.position.set(0, 0, - 0.5).applyMatrix4(controller.matrixWorld);
    }
    scene.add(gltf.scene);
  } else {
    console.log("Load FAILED.  ");
  }
}

loadData();



camera.position.z = 3;




function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}
