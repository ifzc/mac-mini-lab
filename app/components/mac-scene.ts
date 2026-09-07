import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { PartId, ViewMode } from './parts';

export interface SceneState {
  explosion: number;
  selected: PartId;
  autoRotate: boolean;
  labels: boolean;
}
export interface LabelPoint {
  id: PartId;
  x: number;
  y: number;
  visible: boolean;
}
export function createMacScene(
  host: HTMLDivElement,
  onPick: (id: PartId) => void,
  onProject: (points: LabelPoint[]) => void,
) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute(
    'aria-label',
    'Mac mini 三维模型，可拖动旋转或使用视角按钮操作',
  );
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 120);
  camera.position.set(6.1, 4.5, 7.3);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.9, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.enablePan = false;
  controls.minDistance = 5.5;
  controls.maxDistance = 24;
  controls.minPolarAngle = 0.04;
  controls.maxPolarAngle = Math.PI * 0.73;
  controls.autoRotateSpeed = 0.6;
  const room = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room, 0.05);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.85;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.AmbientLight(0xf0f5ff, 1.6));
  const light = new THREE.DirectionalLight(0xfff8ee, 5);
  light.position.set(-3, 7, 6);
  light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  light.shadow.camera.left = -7;
  light.shadow.camera.right = 7;
  light.shadow.camera.top = 8;
  light.shadow.camera.bottom = -7;
  light.shadow.bias = -0.001;
  light.shadow.normalBias = 0.025;
  scene.add(light);
  const rim = new THREE.DirectionalLight(0xd5e4ff, 3);
  rim.position.set(5, 3, -5);
  scene.add(rim);
  const model = new THREE.Group();
  scene.add(model);
  const materials: THREE.Material[] = [];
  const material = (
    color: THREE.ColorRepresentation,
    metalness = 0,
    roughness = 0.5,
  ) => {
    const m = new THREE.MeshStandardMaterial({ color, metalness, roughness });
    materials.push(m);
    return m;
  };
  const silver = material('#b5bdc8', 0.88, 0.29),
    edge = material('#d2d8df', 0.78, 0.23);
  const black = material('#1c2229', 0.25, 0.42),
    dark = material('#10171c', 0.05, 0.67);
  const pcb = material('#17443d', 0.24, 0.56),
    gold = material('#b09c5c', 0.72, 0.3);
  const copper = material('#bd834a', 0.85, 0.3),
    steel = material('#7b8b98', 0.8, 0.3);
  const component = material('#343c48', 0.16, 0.57),
    pale = material('#cbd1da', 0.8, 0.35);
  const groups: Record<PartId, THREE.Group> = {
    enclosure: new THREE.Group(),
    power: new THREE.Group(),
    logic: new THREE.Group(),
    storage: new THREE.Group(),
    thermal: new THREE.Group(),
    base: new THREE.Group(),
  };
  Object.entries(groups).forEach(([id, group]) => {
    group.name = id;
    model.add(group);
  });
  function mesh(
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    parent: THREE.Object3D,
    x = 0,
    y = 0,
    z = 0,
  ) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function box(
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    r: number,
    mat: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
  ) {
    return mesh(
      new RoundedBoxGeometry(
        w,
        h,
        d,
        3,
        Math.min(r, h / 2 - 0.0001, w / 2 - 0.0001, d / 2 - 0.0001),
      ),
      mat,
      parent,
      x,
      y,
      z,
    );
  }
  function roundedPath(w: number, d: number, r: number) {
    const p = new THREE.Shape(),
      x = -w / 2,
      y = -d / 2;
    p.moveTo(x + r, y);
    p.lineTo(x + w - r, y);
    p.quadraticCurveTo(x + w, y, x + w, y + r);
    p.lineTo(x + w, y + d - r);
    p.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    p.lineTo(x + r, y + d);
    p.quadraticCurveTo(x, y + d, x, y + d - r);
    p.lineTo(x, y + r);
    p.quadraticCurveTo(x, y, x + r, y);
    return p;
  }
  function plate(
    parent: THREE.Object3D,
    w: number,
    d: number,
    h: number,
    r: number,
    mat: THREE.Material,
    y: number,
    x = 0,
    z = 0,
  ) {
    const g = new THREE.ExtrudeGeometry(roundedPath(w, d, r), {
      depth: h,
      bevelEnabled: false,
      curveSegments: 16,
    });
    g.rotateX(-Math.PI / 2);
    return mesh(g, mat, parent, x, y, z);
  }
  function cylinder(
    parent: THREE.Object3D,
    r: number,
    h: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    n = 48,
  ) {
    return mesh(new THREE.CylinderGeometry(r, r, h, n), mat, parent, x, y, z);
  }
  function ring(
    parent: THREE.Object3D,
    r: number,
    tube: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
  ) {
    const m = mesh(
      new THREE.TorusGeometry(r, tube, 8, 64),
      mat,
      parent,
      x,
      y,
      z,
    );
    m.rotation.x = Math.PI / 2;
    return m;
  }
  function screw(parent: THREE.Object3D, x: number, y: number, z: number) {
    cylinder(parent, 0.045, 0.02, steel, x, y, z, 12);
    box(parent, 0.052, 0.007, 0.012, 0.003, black, x, y + 0.012, z);
    box(parent, 0.012, 0.007, 0.052, 0.003, black, x, y + 0.013, z);
  }
  function apple(parent: THREE.Object3D, scale: number, y: number) {
    const s = new THREE.Shape();
    s.moveTo(0, 0.24);
    s.bezierCurveTo(-0.18, 0.4, -0.48, 0.31, -0.49, 0.03);
    s.bezierCurveTo(-0.51, -0.22, -0.29, -0.53, -0.16, -0.54);
    s.bezierCurveTo(-0.06, -0.55, -0.04, -0.49, 0.05, -0.49);
    s.bezierCurveTo(0.16, -0.49, 0.2, -0.55, 0.28, -0.51);
    s.bezierCurveTo(0.37, -0.45, 0.44, -0.33, 0.47, -0.24);
    s.bezierCurveTo(0.28, -0.16, 0.25, 0.07, 0.45, 0.16);
    s.bezierCurveTo(0.31, 0.36, 0.18, 0.35, 0, 0.24);
    const a = mesh(new THREE.ShapeGeometry(s, 40), black, parent, 0, y, 0);
    a.rotation.x = -Math.PI / 2;
    a.scale.setScalar(scale);
    const leaf = new THREE.Shape();
    leaf.moveTo(0.02, 0.32);
    leaf.bezierCurveTo(0.04, 0.52, 0.2, 0.6, 0.28, 0.61);
    leaf.bezierCurveTo(0.29, 0.43, 0.17, 0.32, 0.02, 0.32);
    const l = mesh(new THREE.ShapeGeometry(leaf, 30), black, parent, 0, y, 0);
    l.rotation.x = -Math.PI / 2;
    l.scale.setScalar(scale);
  }
  const shell = roundedPath(4, 4, 0.52),
    inner = roundedPath(3.82, 3.82, 0.46);
  shell.holes.push(new THREE.Path(inner.getPoints(32)));
  const shellGeo = new THREE.ExtrudeGeometry(shell, {
    depth: 1.36,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.015,
    bevelThickness: 0.015,
    curveSegments: 24,
  });
  shellGeo.rotateX(-Math.PI / 2);
  mesh(shellGeo, silver, groups.enclosure, 0, 0.19, 0);
  plate(groups.enclosure, 4, 4, 0.1, 0.52, silver, 1.51);
  plate(groups.enclosure, 3.985, 3.985, 0.025, 0.515, edge, 1.59);
  apple(groups.enclosure, 0.74, 1.618);
  // Front openings are inset dark geometry against the aluminum face.
  function usb(x: number, y: number, z: number, front = true) {
    const p = box(groups.enclosure, 0.31, 0.115, 0.026, 0.05, black, x, y, z);
    box(
      groups.enclosure,
      0.19,
      0.022,
      0.028,
      0.009,
      steel,
      x,
      y,
      z + (front ? 0.016 : -0.016),
    );
    return p;
  }
  usb(-0.72, 0.65, 2.009);
  usb(-0.13, 0.65, 2.009);
  const audio = mesh(
    new THREE.CylinderGeometry(0.064, 0.064, 0.034, 32),
    black,
    groups.enclosure,
    0.62,
    0.65,
    2.017,
  );
  audio.rotation.x = Math.PI / 2;
  const audioRim = mesh(
    new THREE.TorusGeometry(0.069, 0.009, 6, 40),
    steel,
    groups.enclosure,
    0.62,
    0.65,
    2.034,
  );
  audioRim.rotation.z = 0;
  const ledMat = new THREE.MeshBasicMaterial({ color: 0xfff9d8 });
  materials.push(ledMat);
  const led = mesh(
    new THREE.SphereGeometry(0.017, 12, 12),
    ledMat,
    groups.enclosure,
    1.38,
    0.64,
    2.017,
  );
  led.castShadow = false;
  for (const x of [-1.44, -1.31]) {
    const p = mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.04, 24),
      black,
      groups.enclosure,
      x,
      0.68,
      -2.015,
    );
    p.rotation.x = Math.PI / 2;
  }
  box(groups.enclosure, 0.32, 0.29, 0.04, 0.025, black, -0.83, 0.68, -2.012);
  box(groups.enclosure, 0.22, 0.06, 0.045, 0.008, gold, -0.83, 0.59, -2.024);
  box(groups.enclosure, 0.37, 0.15, 0.04, 0.033, black, -0.23, 0.68, -2.012);
  box(groups.enclosure, 0.23, 0.025, 0.044, 0.005, steel, -0.23, 0.675, -2.031);
  [0.45, 0.92, 1.39].forEach((x) => usb(x, 0.68, -2.019, false));
  // Power board and compact electrical components.
  plate(groups.power, 3.48, 3.42, 0.045, 0.3, component, 1.19);
  for (const x of [-1.44, 1.44])
    for (const z of [-1.36, 1.36]) screw(groups.power, x, 1.247, z);
  box(groups.power, 1.1, 0.19, 0.75, 0.06, black, -0.65, 1.315, -0.65);
  box(groups.power, 0.95, 0.012, 0.58, 0.015, pale, -0.65, 1.416, -0.65);
  for (let i = 0; i < 9; i++)
    box(
      groups.power,
      0.012,
      0.009,
      0.46,
      0.003,
      steel,
      -0.98 + i * 0.08,
      1.428,
      -0.65,
    );
  for (let i = 0; i < 3; i++) {
    cylinder(groups.power, 0.16, 0.2, black, 0.47 + i * 0.38, 1.32, -0.82);
    cylinder(groups.power, 0.143, 0.009, pale, 0.47 + i * 0.38, 1.425, -0.82);
  }
  ring(groups.power, 0.29, 0.085, copper, -0.76, 1.315, 0.62);
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const w = box(
      groups.power,
      0.047,
      0.16,
      0.14,
      0.015,
      gold,
      -0.76 + Math.cos(a) * 0.29,
      1.32,
      0.62 + Math.sin(a) * 0.29,
    );
    w.rotation.y = -a;
  }
  box(groups.power, 0.56, 0.21, 0.62, 0.045, black, 0.27, 1.32, 0.53);
  box(groups.power, 0.46, 0.215, 0.49, 0.035, gold, 0.27, 1.32, 0.53);
  for (let i = 0; i < 5; i++)
    box(
      groups.power,
      0.13,
      0.095,
      0.22,
      0.014,
      black,
      1.02,
      1.28,
      0.05 + i * 0.27,
    );
  // Mainboard, M4, memory packages, traces and I/O controllers.
  plate(groups.logic, 3.47, 3.45, 0.065, 0.34, pcb, 0.83);
  for (const x of [-1.43, 1.43])
    for (const z of [-1.4, 1.4]) screw(groups.logic, x, 0.91, z);
  for (let i = 0; i < 22; i++) {
    const z = -1.39 + i * 0.128;
    const path = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.48, 0.901, z),
      new THREE.Vector3(-0.8, 0.901, z),
      new THREE.Vector3(-0.48, 0.901, z * 0.5),
      new THREE.Vector3(0.13, 0.901, z * 0.5),
    ]);
    const line = new THREE.Line(
      path,
      new THREE.LineBasicMaterial({
        color: '#6e927d',
        transparent: true,
        opacity: 0.58,
      }),
    );
    groups.logic.add(line);
  }
  box(groups.logic, 1.06, 0.065, 1.12, 0.055, black, -0.22, 0.949, -0.11);
  box(groups.logic, 0.86, 0.042, 0.92, 0.025, steel, -0.22, 1.002, -0.11);
  const chipCanvas = document.createElement('canvas');
  chipCanvas.width = 512;
  chipCanvas.height = 512;
  const ctx = chipCanvas.getContext('2d')!;
  ctx.fillStyle = '#a9b1bd';
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = '#323b48';
  ctx.font = '500 165px -apple-system, Arial';
  ctx.textAlign = 'center';
  ctx.fillText('M4', 256, 304);
  ctx.font = '22px Arial';
  ctx.fillStyle = '#596470';
  ctx.fillText('APPLE SILICON', 256, 370);
  const chipTexture = new THREE.CanvasTexture(chipCanvas);
  chipTexture.colorSpace = THREE.SRGBColorSpace;
  const chipMat = new THREE.MeshStandardMaterial({
    map: chipTexture,
    metalness: 0.6,
    roughness: 0.38,
  });
  materials.push(chipMat);
  const face = mesh(
    new THREE.PlaneGeometry(0.81, 0.87),
    chipMat,
    groups.logic,
    -0.22,
    1.026,
    -0.11,
  );
  face.rotation.x = -Math.PI / 2;
  for (const x of [-1.13, 0.7]) {
    box(groups.logic, 0.46, 0.085, 0.78, 0.025, black, x, 0.95, -0.13);
    for (let i = 0; i < 7; i++) {
      box(
        groups.logic,
        0.025,
        0.018,
        0.035,
        0.005,
        gold,
        x - 0.25,
        0.918,
        -0.42 + i * 0.09,
      );
      box(
        groups.logic,
        0.025,
        0.018,
        0.035,
        0.005,
        gold,
        x + 0.25,
        0.918,
        -0.42 + i * 0.09,
      );
    }
  }
  for (let i = 0; i < 8; i++) {
    box(
      groups.logic,
      0.13,
      0.05,
      0.18,
      0.008,
      component,
      -1.23 + i * 0.32,
      0.926,
      1.13,
    );
    box(
      groups.logic,
      0.1,
      0.022,
      0.05,
      0.005,
      gold,
      -1.23 + i * 0.32,
      0.918,
      0.91,
    );
  }
  for (let i = 0; i < 11; i++)
    box(
      groups.logic,
      0.1,
      0.04,
      0.09,
      0.009,
      pale,
      -1.43 + i * 0.275,
      0.922,
      -1.16,
    );
  for (let i = 0; i < 4; i++)
    box(
      groups.logic,
      0.34,
      0.15,
      0.27,
      0.02,
      steel,
      -0.87 + i * 0.62,
      0.976,
      -1.56,
    );
  // Storage module leaves the board laterally so the chip stays visible.
  plate(groups.storage, 0.53, 1.16, 0.038, 0.055, pcb, 0.919, 1.25, 0.45);
  box(groups.storage, 0.37, 0.052, 0.38, 0.014, black, 1.25, 0.967, 0.18);
  box(groups.storage, 0.37, 0.052, 0.38, 0.014, black, 1.25, 0.967, 0.71);
  for (let i = 0; i < 8; i++)
    box(
      groups.storage,
      0.039,
      0.009,
      0.15,
      0.003,
      gold,
      1.057 + i * 0.055,
      0.945,
      -0.085,
    );
  screw(groups.storage, 1.25, 0.966, 0.969);
  // Bottom thermal deck: blower, curved blades, fin stack and heat pipe.
  plate(groups.thermal, 3.35, 3.3, 0.07, 0.39, black, 0.24);
  const fanX = -0.32,
    fanZ = 0.29;
  cylinder(groups.thermal, 1.19, 0.19, component, fanX, 0.375, fanZ);
  cylinder(groups.thermal, 1.08, 0.028, dark, fanX, 0.485, fanZ);
  const rotor = new THREE.Group();
  rotor.position.set(fanX, 0.51, fanZ);
  groups.thermal.add(rotor);
  for (let i = 0; i < 41; i++) {
    const a = (i / 41) * Math.PI * 2;
    const blade = box(
      rotor,
      0.52,
      0.105,
      0.036,
      0.012,
      steel,
      Math.cos(a) * 0.75,
      0,
      Math.sin(a) * 0.75,
    );
    blade.rotation.y = -a + 0.37;
  }
  cylinder(rotor, 0.43, 0.13, black, 0, 0.013, 0);
  cylinder(rotor, 0.22, 0.007, component, 0, 0.081, 0);
  ring(groups.thermal, 1.145, 0.026, steel, fanX, 0.533, fanZ);
  box(groups.thermal, 2.45, 0.1, 0.47, 0.015, copper, 0.1, 0.365, -1.26);
  for (let i = 0; i < 36; i++)
    box(
      groups.thermal,
      0.025,
      0.38,
      0.52,
      0.008,
      steel,
      -1.08 + i * 0.067,
      0.56,
      -1.28,
    );
  const pipe = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.4, 0.58, -1.23),
    new THREE.Vector3(0.94, 0.58, -1.07),
    new THREE.Vector3(1.17, 0.58, -0.58),
    new THREE.Vector3(0.83, 0.58, -0.18),
  ]);
  mesh(
    new THREE.TubeGeometry(pipe, 32, 0.073, 12, false),
    copper,
    groups.thermal,
  );
  for (const x of [-1.4, 1.4])
    for (const z of [-1.38, 1.38]) screw(groups.thermal, x, 0.326, z);
  // Rounded base, raised rubber foot and underside power button.
  plate(groups.base, 3.86, 3.86, 0.13, 0.54, black, 0.075);
  cylinder(groups.base, 1.74, 0.065, dark, 0, 0.045, 0, 96);
  ring(groups.base, 1.6, 0.044, black, 0, 0.011, 0);
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const v = box(
      groups.base,
      0.025,
      0.016,
      0.17,
      0.005,
      steel,
      Math.cos(a) * 1.62,
      0.215,
      Math.sin(a) * 1.62,
    );
    v.rotation.y = -a + Math.PI / 2;
  }
  cylinder(groups.base, 0.12, 0.018, component, 1.34, 0.064, 1.22);
  for (const x of [-1.27, 1.27])
    for (const z of [-1.27, 1.27]) screw(groups.base, x, 0.215, z);
  // Catch shadows without introducing a distracting floor.
  const floor = mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.ShadowMaterial({ color: '#72849b', opacity: 0.14 }),
    scene,
    0,
    -0.015,
    0,
  );
  floor.rotation.x = -Math.PI / 2;
  floor.castShadow = false;
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  const sc = shadowCanvas.getContext('2d')!;
  const grad = sc.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, 'rgba(75,91,113,0.19)');
  grad.addColorStop(0.45, 'rgba(75,91,113,0.10)');
  grad.addColorStop(1, 'rgba(75,91,113,0)');
  sc.fillStyle = grad;
  sc.fillRect(0, 0, 256, 256);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const contact = mesh(
    new THREE.PlaneGeometry(7, 7),
    new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
    }),
    scene,
    0,
    -0.01,
    0,
  );
  contact.rotation.x = -Math.PI / 2;
  contact.castShadow = false;
  const highlights: Record<string, THREE.MeshStandardMaterial[]> = {};
  Object.entries(groups).forEach(([id, g]) => {
    highlights[id] = [];
    g.traverse((o) => {
      o.userData.partId = id;
      if (
        o instanceof THREE.Mesh &&
        o.material instanceof THREE.MeshStandardMaterial
      ) {
        o.material = o.material.clone();
        highlights[id].push(o.material);
      }
    });
  });
  let state: SceneState = {
    explosion: 0,
    selected: 'enclosure',
    autoRotate: false,
    labels: true,
  };
  let explosion = 0,
    lastTime = 0,
    frame = 0,
    disposed = false,
    highlighted = '';
  let width = 1,
    height = 1;
  let cameraGoal: THREE.Vector3 | null = null,
    targetGoal: THREE.Vector3 | null = null;
  let manualView = false;
  let currentView: ViewMode = 'perspective';
  const offsets: Record<PartId, number> = {
    enclosure: 5.25,
    power: 3.38,
    logic: 2.12,
    storage: 2.12,
    thermal: 0.97,
    base: 0,
  };
  const anchorY: Record<PartId, number> = {
    enclosure: 1.55,
    power: 1.34,
    logic: 0.95,
    storage: 0.99,
    thermal: 0.43,
    base: 0.18,
  };
  const resize = new ResizeObserver(() => {
    width = host.clientWidth;
    height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    orient(currentView, false, manualView);
  });
  resize.observe(host);
  const raycaster = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  let downX = 0,
    downY = 0;
  function hit(e: PointerEvent) {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      (-(e.clientY - r.top) / r.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    return raycaster
      .intersectObjects(model.children, true)
      .find((h) => h.object.visible)?.object.userData.partId as
      | PartId
      | undefined;
  }
  function pointerDown(e: PointerEvent) {
    downX = e.clientX;
    downY = e.clientY;
    cameraGoal = null;
    targetGoal = null;
    manualView = true;
  }
  function pointerUp(e: PointerEvent) {
    if (Math.hypot(e.clientX - downX, e.clientY - downY) < 5) {
      const id = hit(e);
      if (id) onPick(id);
    }
  }
  function pointerMove(e: PointerEvent) {
    if (!e.buttons)
      renderer.domElement.style.cursor = hit(e) ? 'pointer' : 'grab';
  }
  renderer.domElement.addEventListener('pointerdown', pointerDown);
  renderer.domElement.addEventListener('pointerup', pointerUp);
  renderer.domElement.addEventListener('pointermove', pointerMove);
  function onWheel() {
    cameraGoal = null;
    targetGoal = null;
    manualView = true;
  }
  renderer.domElement.addEventListener('wheel', onWheel, { passive: true });
  function orient(
    mode: ViewMode = 'perspective',
    force = false,
    preserveOrbit = false,
  ) {
    const amount = state.explosion / 100;
    const center = new THREE.Vector3(0, 0.9 + amount * 2.3, 0);
    const aspectFactor = Math.max(1, 1.05 / camera.aspect);
    const distance = Math.min(23, (10.6 + amount * 4.8) * aspectFactor);
    const dir = preserveOrbit
      ? camera.position.clone().sub(controls.target)
      : mode === 'front'
        ? new THREE.Vector3(0, 0.1, 1)
        : mode === 'back'
          ? new THREE.Vector3(0, 0.12, -1)
          : mode === 'top'
            ? new THREE.Vector3(0, 1, 0.001)
            : new THREE.Vector3(6.1, 4.0, 7.3);
    cameraGoal = dir.normalize().multiplyScalar(distance).add(center);
    targetGoal = center;
    manualView = preserveOrbit;
    if (reduced || force) {
      camera.position.copy(cameraGoal);
      controls.target.copy(center);
      cameraGoal = null;
      targetGoal = null;
      controls.update();
    }
  }
  function animate(time: number) {
    if (disposed) return;
    frame = requestAnimationFrame(animate);
    if (document.hidden) {
      lastTime = time;
      return;
    }
    const dt = Math.min((time - lastTime) / 1000, 0.05) || 0.016;
    lastTime = time;
    explosion = THREE.MathUtils.damp(
      explosion,
      state.explosion / 100,
      reduced ? 200 : 5,
      dt,
    );
    for (const id of Object.keys(groups) as PartId[]) {
      groups[id].position.y = offsets[id] * explosion;
    }
    groups.storage.position.x = 1.6 * explosion;
    if (cameraGoal && targetGoal) {
      camera.position.lerp(cameraGoal, 1 - Math.exp(-5 * dt));
      controls.target.lerp(targetGoal, 1 - Math.exp(-5 * dt));
      if (camera.position.distanceTo(cameraGoal) < 0.005) {
        cameraGoal = null;
        targetGoal = null;
      }
    }
    controls.autoRotate = state.autoRotate;
    controls.update();
    if (!reduced) rotor.rotation.y -= dt * 0.45 * explosion;
    if (highlighted !== state.selected) {
      Object.entries(highlights).forEach(([id, list]) =>
        list.forEach((m) => {
          m.emissive.set(id === state.selected ? '#3767c5' : '#000000');
          m.emissiveIntensity = id === state.selected ? 0.09 : 0;
        }),
      );
      highlighted = state.selected;
    }
    renderer.render(scene, camera);
    const labelPoints = (Object.keys(groups) as PartId[]).map((id) => {
      const p = new THREE.Vector3(id === 'storage' ? 1.65 : 1.8, anchorY[id], 0)
        .applyMatrix4(groups[id].matrixWorld)
        .project(camera);
      return {
        id,
        x: Math.max(12, Math.min(width - 120, (p.x * 0.5 + 0.5) * width + 27)),
        y: Math.max(
          20,
          Math.min(
            height - 25,
            (-p.y * 0.5 + 0.5) * height + (id === 'storage' ? 28 : 0),
          ),
        ),
        visible: state.labels && explosion > 0.5 && p.z < 1,
      };
    });
    onProject(labelPoints);
  }
  orient('perspective', true);
  frame = requestAnimationFrame(animate);
  return {
    setState(next: SceneState) {
      const moved = state.explosion !== next.explosion;
      state = next;
      if (moved) orient(currentView, false, manualView);
    },
    setView(mode: ViewMode) {
      currentView = mode;
      orient(mode);
    },
    reset() {
      currentView = 'perspective';
      orient('perspective');
    },
    zoom(direction: number) {
      cameraGoal = null;
      targetGoal = null;
      manualView = true;
      const v = camera.position.clone().sub(controls.target);
      v.setLength(
        THREE.MathUtils.clamp(
          v.length() * (direction > 0 ? 0.85 : 1.18),
          controls.minDistance,
          controls.maxDistance,
        ),
      );
      camera.position.copy(controls.target).add(v);
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      renderer.domElement.removeEventListener('pointermove', pointerMove);
      renderer.domElement.removeEventListener('wheel', onWheel);
      const geos = new Set<THREE.BufferGeometry>(),
        mats = new Set<THREE.Material>();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Line) {
          geos.add(o.geometry);
          const m = Array.isArray(o.material) ? o.material : [o.material];
          m.forEach((v: THREE.Material) => mats.add(v));
        }
      });
      geos.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      mats.forEach((m) => m.dispose());
      chipTexture.dispose();
      shadowTexture.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
export type MacScene = ReturnType<typeof createMacScene>;
