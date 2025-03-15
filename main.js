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
  Audio, 
  AudioListener, 
  AudioLoader,
  PositionalAudio,
  AnimationMixer,

} from 'three';

import { ARButton } from 'three/addons/webxr/ARButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

let camera, scene, renderer;
let controller;
const objects = [];
const bullets = [];
const speed = 50;
let score = 0;
let scoreMesh;
const clock = new Clock();
let mixer;

function loadGLTF(name, x, y, z) {

  const loader = new GLTFLoader();
  loader.load(`assets/models/${name}.glb`, function (gltf) {
    const piece = gltf.scene;
    piece.name = `${name}`;
    piece.position.set(x, y, z);
    const animations = gltf.animations;


    if (animations && animations.length > 0) {
      mixer = new AnimationMixer(piece);

      const action = mixer.clipAction(animations[0]);
      action.play();
    }

    scene.add(piece);
    objects.push(piece);

  }, undefined, function (error) {
    console.error(error);
  });
}

function addSoundToGLTFModel(model, audioFilePath) {
  const listener = new AudioListener();
  camera.add(listener);
  const sound = new PositionalAudio(listener);

  const audioLoader = new AudioLoader();
  audioLoader.load(audioFilePath, function(buffer) {
    sound.setBuffer(buffer);
    sound.setRefDistance(5);
    sound.setLoop(true);
    sound.setVolume(1.0);
    sound.play();
  });

  model.add(sound);
}


function add3DText() {
  const loader = new FontLoader();
  loader.load('assets/fonts/gentilis_bold.typeface.json', function(font) {
    const textGeometry = new TextGeometry(`Score: ${score}`, {
      font: font,
      size: 0.2,
      depth: 0.02,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.002,
      bevelOffset: 0,
      bevelSegments: 3
    });

    const textMaterial = new MeshBasicMaterial({ color: 0xff0000 });
    const scoreMesh = new Mesh(textGeometry, textMaterial);

    scoreMesh.name = 'text'

    scoreMesh.position.set(-0.5, 0, -1);
    scene.add(scoreMesh);
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
  loader.load('assets/models/fairy.glb', function (gltf) {
    const target = gltf.scene;
    target.name = 'fairy';
    target.position.set(x, y, z);
    target.userData.phase = Math.random() * Math.PI * 2;
    target.userData.startX = x;
    target.userData.startY = y;
    target.userData.startZ = z;
    addSoundToGLTFModel(target, 'assets/audio/hey_listen.mp3')
    scene.add(target);

  }, undefined, function (error) {
    console.error(error);
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

function addBackgroundMusic() {
  const listener = new AudioListener();
  camera.add(listener);

  const backgroundMusic = new Audio(listener);

  const audioLoader = new AudioLoader();
  audioLoader.load('assets/audio/song_storm.mp3', function(buffer) {
    backgroundMusic.setBuffer(buffer);
    backgroundMusic.setLoop(true);
    backgroundMusic.setVolume(0.2);
    backgroundMusic.play();
  });
}

function findSoundInModel(model) {
  let sound = null;
  model.traverse(child => {
    if (child.type === 'Audio') {
      sound = child;
    }
  });
  return sound;
}

function removeModelAndSound(model) {
  const sound = findSoundInModel(model)

  if (sound) {
    sound.stop();
    model.remove(sound);
  }
  scene.remove(model);
}


const animate = () => {
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  if (mixer) {
    mixer.update(delta);
  }

  const target = scene.getObjectByName('fairy');
  if (target) {
    randomMovementWithPhase(target, elapsed);
  }

  bullets.forEach((bullet, index) => {
    bullet.translateZ(-speed * delta);

    if (target) {
      const distance = bullet.position.distanceTo(target.position);

      if (distance < 3) {

        const text = scene.getObjectByName('text');
        if (text) {
          scene.remove(text);
          add3DText()
        }

        score++;
        console.log(`Cible touchée ! Score : ${score}`);

        removeModelAndSound(target);

        setTimeout(() => {
          spawnNewTarget();
        }, 5_000);

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

  xrButton.addEventListener('click', () => {
    addBackgroundMusic();
    const target = scene.getObjectByName('fairy');
    if (target) {
      addSoundToGLTFModel(target, 'assets/audio/hey_listen.mp3')
    }
  });

  const onSelect = (event) => {

      const bulletGeometry = new SphereGeometry(0.5, 32, 32);
      const bulletMaterial = new MeshBasicMaterial({ color: 0xff0000 });
      const bullet = new Mesh(bulletGeometry, bulletMaterial);

      bullet.position.set( 0, 0, 0 ).applyMatrix4( controller.matrixWorld );
      bullet.quaternion.setFromRotationMatrix( controller.matrixWorld );
    
      scene.add(bullet);
      bullets.push(bullet);

  }

  loadGLTF('fairy', 0, 1, -10)

  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);
  window.addEventListener('resize', onWindowResize, false);
}
add3DText()
init();

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}
