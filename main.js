import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

// --- HELPER: Tekstur Asap ---
function getSmokeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)'); 
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');   
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// --- CLASS: Sistem Asap ---
class SimpleSmoke {
    constructor(scene, texture, count, position, scale, colorHex, velocityY) {
        this.group = new THREE.Group();
        this.sprites = [];
        this.baseScale = scale;
        this.velocityY = velocityY;
        this.sourcePosition = position.clone();
        this.isEmitting = true;
        
        const material = new THREE.SpriteMaterial({
            map: texture, color: colorHex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.NormalBlending
        });

        for(let i=0; i<count; i++){
            const sprite = new THREE.Sprite(material.clone()); 
            this.resetSprite(sprite);
            sprite.userData.delay = Math.random() * 100; 
            this.group.add(sprite);
            this.sprites.push(sprite);
        }
        scene.add(this.group);
    }

    resetSprite(sprite) {
         if (!this.isEmitting) {
             sprite.material.opacity = 0;
             sprite.position.y = -1000; 
             return;
         }
         sprite.position.set(
             this.sourcePosition.x + (Math.random()-0.5)*this.baseScale*0.3, 
             this.sourcePosition.y + (Math.random()*0.2)*this.baseScale, 
             this.sourcePosition.z + (Math.random()-0.5)*this.baseScale*0.3
         );
         sprite.scale.set(this.baseScale*0.5, this.baseScale*0.5, 1);
         sprite.material.opacity = 0.6 + Math.random()*0.4; 
    }

    update(newSourcePos, isCarVisible = true) {
        this.isEmitting = isCarVisible;
        if(newSourcePos) this.sourcePosition.copy(newSourcePos);
        this.sprites.forEach(sprite => {
            const fadeSpeed = this.isEmitting ? 0.005 : 0.05;
            if(sprite.userData.delay > 0) {
                sprite.userData.delay--; return;
            }
            sprite.position.y += this.velocityY * (0.8 + Math.random()*0.4); 
            sprite.scale.x += 0.015 * this.baseScale; 
            sprite.scale.y += 0.015 * this.baseScale;
            sprite.material.opacity -= fadeSpeed; 
            if(sprite.material.opacity <= 0) {
                this.resetSprite(sprite);
            }
        });
    }
}

// --- KONFIGURASI SCENE ---
const SCENE_CONFIG = {
    groundSize: 144, roadWidth: 8, blockSize: 24,
    houseScale: 0.45, factoryScale: 0.017, carScale: 3         
};

// --- 1. SETUP DASAR & WARNA ---
const scene = new THREE.Scene();
const COLORS = {
    skyLow: new THREE.Color(0x87CEEB), skyMed: new THREE.Color(0x8899AA), skyHigh: new THREE.Color(0x554433),
    fogLow: 0x87CEEB, fogMed: 0x8899AA, fogHigh: 0x554433,
    roof: new THREE.Color(0x36454F), wall: new THREE.Color(0xFFFFFF), bush: new THREE.Color(0x228B22), 
    factoryWall: new THREE.Color(0x778899), factoryRoof: new THREE.Color(0x4682B4), 
    carBody: new THREE.Color(0xD72638), carTire: new THREE.Color(0x111111), 
    groundClean: new THREE.Color(0x999999), groundDirty: new THREE.Color(0x8B4513)
};

scene.background = COLORS.skyLow.clone();
scene.fog = new THREE.Fog(COLORS.fogLow, 60, 250);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(50, 60, 60); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- EVENT: Handle window resize untuk fullscreen canvas ---
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.maxPolarAngle = Math.PI / 2 - 0.1;

// --- 2. FITUR TAMBAHAN: WASD + SPACE + SHIFT ---
const keys = { w: false, a: false, s: false, d: false, space: false, shift: false };
const moveSpeed = 0.2; // Kecepatan pelan sesuai request

document.addEventListener('keydown', (event) => {
    switch(event.key.toLowerCase()) {
        case 'w': keys.w = true; break;
        case 'a': keys.a = true; break;
        case 's': keys.s = true; break;
        case 'd': keys.d = true; break;
        case ' ': keys.space = true; break;
        case 'shift': keys.shift = true; break;
    }
});

document.addEventListener('keyup', (event) => {
    switch(event.key.toLowerCase()) {
        case 'w': keys.w = false; break;
        case 'a': keys.a = false; break;
        case 's': keys.s = false; break;
        case 'd': keys.d = false; break;
        case ' ': keys.space = false; break;
        case 'shift': keys.shift = false; break;
    }
});

function updateCameraMovement() {
    // Arah depan (tanpa Y agar jalan datar)
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    // Arah kanan
    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up).normalize();

    // Arah atas (Global)
    const up = new THREE.Vector3(0, 1, 0);

    const move = new THREE.Vector3();

    if (keys.w) move.add(forward);
    if (keys.s) move.sub(forward);
    if (keys.d) move.add(right);
    if (keys.a) move.sub(right);
    if (keys.space) move.add(up); // Naik
    if (keys.shift) move.sub(up); // Turun

    if (move.length() > 0) {
        move.normalize().multiplyScalar(moveSpeed);
        camera.position.add(move);
        controls.target.add(move); // Update target orbit agar kamera tidak snapping
    }
}

// --- 3. FITUR TAMBAHAN: SLIDER UI ---
const slider = document.getElementById('pollutionSlider');
const aqiDisplay = document.getElementById('aqi-display');
const statusDisplay = document.getElementById('status-display');
const healthAdvice = document.getElementById('health-advice');

if (slider) { // Cek jika elemen ada di HTML
    slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        
        let targetSky, targetFog;
        if (val <= 50) {
            const t = val / 50;
            targetSky = COLORS.skyLow.clone().lerp(COLORS.skyMed, t);
            targetFog = new THREE.Color(COLORS.fogLow).lerp(new THREE.Color(COLORS.fogMed), t);
        } else {
            const t = (val - 50) / 50;
            targetSky = COLORS.skyMed.clone().lerp(COLORS.skyHigh, t);
            targetFog = new THREE.Color(COLORS.fogMed).lerp(new THREE.Color(COLORS.fogHigh), t);
        }

        scene.background.copy(targetSky);
        scene.fog.color.copy(targetFog);

        const near = 60 - (val / 100) * 50; 
        const far = 250 - (val / 100) * 150;
        scene.fog.near = near;
        scene.fog.far = far;

        if(aqiDisplay) {
            const realAQI = Math.floor(val * 3);
            aqiDisplay.innerText = realAQI;
            
            if(val < 20) {
                statusDisplay.innerText = "Excellent"; statusDisplay.style.color = "#00ff00";
                healthAdvice.innerText = "Udara sangat bersih. Sempurna untuk olahraga luar ruangan.";
            } else if (val < 50) {
                statusDisplay.innerText = "Moderate"; statusDisplay.style.color = "#ffff00";
                healthAdvice.innerText = "Kualitas udara dapat diterima. Kelompok sensitif sebaiknya waspada.";
            } else if (val < 80) {
                statusDisplay.innerText = "Unhealthy"; statusDisplay.style.color = "#ff8800";
                healthAdvice.innerText = "Kurangi aktivitas berat di luar ruangan. Gunakan masker jika perlu.";
            } else {
                statusDisplay.innerText = "Hazardous"; statusDisplay.style.color = "#ff0000";
                healthAdvice.innerText = "BAHAYA! Hindari semua aktivitas luar ruangan. Gunakan masker N95.";
            }
        }
    });
}

// --- 4. PENCAHAYAAN ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.8); dirLight.position.set(100, 150, 100);
dirLight.castShadow = true; dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.left = -100; dirLight.shadow.camera.right = 100;
dirLight.shadow.camera.top = 100; dirLight.shadow.camera.bottom = -100;
scene.add(dirLight);

// --- 5. AWAN LOW-POLY ---
function createClouds() {
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, flatShading: true, roughness: 1, metalness: 0, transparent: true, opacity: 0.9 });
    const cloudGroup = new THREE.Group();
    for(let i = 0; i < 60; i++) { 
        const geos = [];
        const createCloudBlock = (scale, x, y, z) => { const geo = new THREE.DodecahedronGeometry(scale); geo.translate(x, y, z); geos.push(geo); }
        const mainScale = Math.random() * 4 + 2;
        createCloudBlock(mainScale, 0,0,0);
        createCloudBlock(mainScale * 0.6, Math.random()*5-2.5, Math.random()*3, Math.random()*5-2.5);
        createCloudBlock(mainScale * 0.5, Math.random()*5-2.5, Math.random()*3, Math.random()*5-2.5);
        const mergedGeo = BufferGeometryUtils.mergeGeometries(geos);
        const cloud = new THREE.Mesh(mergedGeo, cloudMat);
        const spread = SCENE_CONFIG.groundSize * 1.3;
        cloud.position.set((Math.random() - 0.5) * spread, Math.random() * 30 + 50, (Math.random() - 0.5) * spread);
        cloud.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
        cloud.castShadow = true; cloudGroup.add(cloud);
    }
    scene.add(cloudGroup);
}
createClouds();

// --- 6. JALAN RAYA ---
function createRoads() {
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); 
    const halfSize = SCENE_CONFIG.groundSize / 2;
    const intersectionMargin = SCENE_CONFIG.roadWidth / 2 + 1; 

    for (let x = -halfSize; x <= halfSize; x += SCENE_CONFIG.blockSize) {
        // Vertikal
        const roadV = new THREE.Mesh(new THREE.PlaneGeometry(SCENE_CONFIG.roadWidth, SCENE_CONFIG.groundSize), roadMat);
        roadV.rotation.x = -Math.PI / 2; roadV.position.set(x, 0.02, 0); roadV.receiveShadow = true; scene.add(roadV);
        for (let z = -halfSize; z < halfSize; z += 8) { 
            if (Math.abs(z % SCENE_CONFIG.blockSize) < intersectionMargin) continue;
            const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 4), stripeMat);
            stripe.rotation.x = -Math.PI / 2; stripe.position.set(x, 0.03, z + 2); scene.add(stripe);
        }
        // Horizontal
        const roadH = new THREE.Mesh(new THREE.PlaneGeometry(SCENE_CONFIG.groundSize, SCENE_CONFIG.roadWidth), roadMat);
        roadH.rotation.x = -Math.PI / 2; roadH.position.set(0, 0.02, x); roadH.receiveShadow = true; scene.add(roadH);
        for (let z = -halfSize; z < halfSize; z += 8) {
            if (Math.abs(z % SCENE_CONFIG.blockSize) < intersectionMargin) continue;
            const stripe = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.5), stripeMat);
            stripe.rotation.x = -Math.PI / 2; stripe.position.set(z + 2, 0.03, x); scene.add(stripe);
        }
    }
}
createRoads();

// --- 7. MANAGER OBJEK ---
const loader = new OBJLoader();
const smokeTexture = getSmokeTexture();
let factorySmoke;
const factoryPos = new THREE.Vector3(SCENE_CONFIG.blockSize/2, 0, SCENE_CONFIG.blockSize/2);

// A. PABRIK
function colorFactoryDetailed(mesh) {
    mesh.geometry.computeBoundingBox();
    const bbox = mesh.geometry.boundingBox;
    const minY = bbox.min.y;
    const maxY = bbox.max.y;
    const minX = bbox.min.x;
    const maxX = bbox.max.x;

    const colors = [];
    const pos = mesh.geometry.attributes.position;
    const norm = mesh.geometry.attributes.normal;

    const roofColor = COLORS.factoryRoof;
    const wallBase = COLORS.factoryWall;
    const windowColor = new THREE.Color(0xC8DFFF);
    const dirtColor = COLORS.groundDirty;

    const height = maxY - minY;
    const widthX = maxX - minX;

    for (let i = 0; i < pos.count; i++) {
        const ny = norm.getY(i);
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);

        let c;

        if (ny > 0.6) {
            // Atap pabrik (bagian yang menghadap ke atas)
            c = roofColor;
        } else {
            // Tinggi relatif (untuk gradasi vertikal tembok)
            const hT = (y - minY) / height;

            // Tembok dasar dengan sedikit gradasi ke atas
            let wallColor = wallBase.clone().lerp(new THREE.Color(0xffffff), 0.15 * hT);

            // Bagian bawah tembok sedikit lebih kotor
            if (hT < 0.25) {
                wallColor = wallColor.lerp(dirtColor, 0.25);
            }

            // "Jendela" – pola kotak di tengah tinggi tembok
            const isMidHeight = hT > 0.35 && hT < 0.7;
            const windowPattern =
                (Math.abs(((x - minX) / widthX) * 6 % 1 - 0.5) < 0.22) &&
                (Math.abs((z * 0.5) % 1 - 0.5) < 0.18);

            if (isMidHeight && windowPattern) {
                c = windowColor;
            } else {
                c = wallColor;
            }
        }

        colors.push(c.r, c.g, c.b);
    }

    mesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    mesh.material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.7,
        metalness: 0.25
    });
}

loader.load('object/factory.obj', function (object) {
    object.scale.set(SCENE_CONFIG.factoryScale, SCENE_CONFIG.factoryScale, SCENE_CONFIG.factoryScale);
    object.traverse((child) => {
        if (child.isMesh && child.geometry.attributes.normal) { 
            colorFactoryDetailed(child); child.castShadow = true; child.receiveShadow = true; 
        }
    });
    object.position.copy(factoryPos); scene.add(object);
    const smokeEmitPos = factoryPos.clone().add(new THREE.Vector3(0, 8, 0));
    factorySmoke = new SimpleSmoke(scene, smokeTexture, 40, smokeEmitPos, 6, 0x888888, 0.1);
});

// B. RUMAH
function colorHouseDetailed(mesh) {
    mesh.geometry.computeBoundingBox();
    const min = mesh.geometry.boundingBox.min.y;
    const max = mesh.geometry.boundingBox.max.y;
    const height = max - min;

    const roofThreshold = min + height * 0.55;
    const bushThreshold = min + height * 0.15;

    const colors = [];
    const pos = mesh.geometry.attributes.position;

    const roofMain = COLORS.roof;
    const roofEdge = COLORS.roof.clone().lerp(new THREE.Color(0x000000), 0.25);
    const wallBase = COLORS.wall;
    const bushBase = COLORS.bush;

    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);

        let c;

        if (y > roofThreshold) {
            // Atap dengan highlight di tengah & lebih gelap di tepi
            const edgeFactor =
                Math.max(0, Math.abs(x) + Math.abs(z)) * 0.08;
            c = roofMain.clone().lerp(roofEdge, Math.min(edgeFactor, 0.4));
        } else if (y < bushThreshold) {
            // Semak/halaman dengan variasi kecil
            const noise = (Math.sin(x * 3.1) * Math.cos(z * 2.7) + 1) * 0.25;
            c = bushBase.clone().lerp(new THREE.Color(0x1a5e1a), noise);
        } else {
            // Dinding dengan gradasi vertikal halus
            const t = (y - bushThreshold) / (roofThreshold - bushThreshold);
            let wallColor = wallBase.clone().lerp(new THREE.Color(0xdddddd), 0.2 * t);

            // Area "jendela" sederhana di tengah dinding
            const isWindowBand = t > 0.35 && t < 0.7;
            const windowPattern =
                (Math.abs((x * 0.6) % 1 - 0.5) < 0.18) &&
                (Math.abs((z * 0.6) % 1 - 0.5) < 0.18);

            if (isWindowBand && windowPattern) {
                c = new THREE.Color(0xC8E6FF);
            } else {
                c = wallColor;
            }
        }

        colors.push(c.r, c.g, c.b);
    }

    mesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    mesh.material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.9
    });
}

loader.load('object/house.obj', function (object) {
    object.scale.set(SCENE_CONFIG.houseScale, SCENE_CONFIG.houseScale, SCENE_CONFIG.houseScale);
    object.traverse((child) => {
        if (child.isMesh) { colorHouseDetailed(child); child.castShadow = true; child.receiveShadow = true; }
    });
    placeHousesSystematically(object);
});

function placeHousesSystematically(baseHouseModel) {
    const halfSize = SCENE_CONFIG.groundSize / 2;
    for (let x = -halfSize + SCENE_CONFIG.blockSize/2; x < halfSize; x += SCENE_CONFIG.blockSize) {
        for (let z = -halfSize + SCENE_CONFIG.blockSize/2; z < halfSize; z += SCENE_CONFIG.blockSize) {
            if (Math.abs(x - factoryPos.x) < 1 && Math.abs(z - factoryPos.z) < 1) continue;
            const house = baseHouseModel.clone();
            house.position.set(x, 0, z);
            const rotations = [0, Math.PI/2, Math.PI, -Math.PI/2];
            house.rotation.y = rotations[Math.floor(Math.random() * rotations.length)];
            scene.add(house);
        }
    }
}

// C. MOBIL
const cars = []; 
loader.load('object/car.obj', function(object) {
    object.scale.set(SCENE_CONFIG.carScale, SCENE_CONFIG.carScale, SCENE_CONFIG.carScale);

    function colorCarDetailed(mesh) {
        mesh.geometry.computeBoundingBox();
        const bbox = mesh.geometry.boundingBox;
        const minY = bbox.min.y;
        const maxY = bbox.max.y;
        const minZ = bbox.min.z;
        const maxZ = bbox.max.z;
        const height = maxY - minY;
        const lengthZ = maxZ - minZ;

        const tireThreshold = minY + height * 0.25;
        const windowBottom = minY + height * 0.45;
        const windowTop = minY + height * 0.75;
        const roofStart = minY + height * 0.8;

        const colors = [];
        const pos = mesh.geometry.attributes.position;

        const tireColor = COLORS.carTire;
        const bodyMain = COLORS.carBody;
        const bodyRoof = COLORS.carBody.clone().lerp(new THREE.Color(0xffffff), 0.2);
        const windowColor = new THREE.Color(0xA5C8FF);
        const lightFront = new THREE.Color(0xFFF5B5);
        const lightBack = new THREE.Color(0xFF6666);

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const z = pos.getZ(i);

            let c;

            if (y < tireThreshold) {
                // Ban
                c = tireColor;
            } else {
                const zNorm = (z - minZ) / lengthZ;
                const isFront = zNorm > 0.8;
                const isBack = zNorm < 0.2;

                // Jendela
                if (y > windowBottom && y < windowTop) {
                    c = windowColor;
                }
                // Lampu depan & belakang
                else if (y < windowBottom && (isFront || isBack)) {
                    c = isFront ? lightFront : lightBack;
                }
                // Atap lebih terang
                else if (y > roofStart) {
                    c = bodyRoof;
                }
                // Bodi utama dengan sedikit gradasi
                else {
                    const t = (y - tireThreshold) / (roofStart - tireThreshold);
                    c = bodyMain.clone().lerp(new THREE.Color(0x660000), 0.15 * (1 - t));
                }
            }

            colors.push(c.r, c.g, c.b);
        }

        mesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        mesh.material = new THREE.MeshStandardMaterial({ 
            vertexColors: true, roughness: 0.3, metalness: 0.6, transparent: true, opacity: 1.0 
        });
    }

    object.traverse(child => { if(child.isMesh) { colorCarDetailed(child); } });

    const spawnCar = (x, z, axis, direction) => {
        const car = object.clone();
        car.traverse((child) => { if (child.isMesh) child.material = child.material.clone(); });

        car.position.set(x, 0.80, z); 
        car.userData = { 
            speed: 0.04 + Math.random() * 0.03, axis: axis, direction: direction,
            currentOpacity: 1.0,
            smoke: new SimpleSmoke(scene, smokeTexture, 12, car.position, 1.2, 0x555555, 0.05)
        };
        
        if(axis === 'z') { car.rotation.y = direction === 1 ? Math.PI : 0; } 
        else { car.rotation.y = direction === 1 ? -Math.PI/2 : Math.PI/2; }
        scene.add(car); cars.push(car);
    };

    const offset = 2.5; 
    
    // Konfigurasi Jalur
    const laneConfigs = [
        { x: offset, axis: 'z', dir: 1 }, 
        { x: -offset, axis: 'z', dir: -1 },
        { z: offset, axis: 'x', dir: 1 },
        { z: -offset, axis: 'x', dir: -1 },
        { x: -SCENE_CONFIG.blockSize + offset, axis: 'z', dir: 1 },
        { x: -SCENE_CONFIG.blockSize - offset, axis: 'z', dir: -1 },
        { x: SCENE_CONFIG.blockSize + offset, axis: 'z', dir: 1 },
        { x: SCENE_CONFIG.blockSize - offset, axis: 'z', dir: -1 },
        { z: SCENE_CONFIG.blockSize + offset, axis: 'x', dir: 1 },
        { z: SCENE_CONFIG.blockSize - offset, axis: 'x', dir: -1 },
        { z: -SCENE_CONFIG.blockSize + offset, axis: 'x', dir: 1 },
        { z: -SCENE_CONFIG.blockSize - offset, axis: 'x', dir: -1 }
    ];

    // Lebih sedikit mobil + sebaran merata
    laneConfigs.forEach(lane => {
        // 3 mobil per jalur: -40, 0, 40
        for (let i = -40; i <= 40; i += 40) {
            const pos = i;
            if (lane.axis === 'z') {
                spawnCar(lane.x, pos, 'z', lane.dir);
            } else {
                spawnCar(pos, lane.z, 'x', lane.dir);
            }
        }
    });
});

// --- 8. HEATMAP TANAH ---
const pollutionSources = [
    { x: factoryPos.x, z: factoryPos.z, intensity: 30, decay: 0.01 }, 
    { x: 48, z: 24, intensity: 15, decay: 0.02 }, { x: -24, z: -48, intensity: 15, decay: 0.02 }
];
function calculatePollutionColor(x, z) {
    let total = 0;
    pollutionSources.forEach(s => { total += s.intensity * Math.exp(-s.decay * Math.sqrt((x-s.x)**2 + (z-s.z)**2)**2); });
    const norm = Math.min(total / 25, 1.0); 
    const finalColor = COLORS.groundClean.clone().lerp(COLORS.groundDirty, norm);
    return [finalColor.r, finalColor.g, finalColor.b];
}
const geoGround = new THREE.PlaneGeometry(SCENE_CONFIG.groundSize, SCENE_CONFIG.groundSize, 150, 150);
const colors = [];
for (let i = 0; i < geoGround.attributes.position.count; i++) {
    const x = geoGround.attributes.position.getX(i); const z = geoGround.attributes.position.getY(i);
    colors.push(...calculatePollutionColor(x, z));
}
geoGround.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
const matGround = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 1, metalness: 0 });
const ground = new THREE.Mesh(geoGround, matGround);
ground.rotation.x = -Math.PI / 2; scene.add(ground);

// --- 9. ANIMASI LOOP ---
function animate() {
    requestAnimationFrame(animate);
    
    controls.update(); // OrbitControls
    updateCameraMovement(); // Logic WASD (Dipanggil di sini)

    if(factorySmoke) factorySmoke.update(null, true);

    const limit = SCENE_CONFIG.groundSize / 2 + 5; 
    const fadeStart = limit - 20; 

    cars.forEach((car) => {
        const data = car.userData;
        car.position[data.axis] += data.speed * data.direction;

        const currentPos = car.position[data.axis];
        const distFromCenter = Math.abs(currentPos);
        let targetOpacity = 1.0;

        if (distFromCenter > fadeStart) {
            let fadeProgress = (distFromCenter - fadeStart) / (limit - fadeStart);
            targetOpacity = 1.0 - fadeProgress;
            if(targetOpacity < 0) targetOpacity = 0;
            
            const movingOutwards = (currentPos > 0 && data.direction === 1) || (currentPos < 0 && data.direction === -1);
            if (distFromCenter >= limit && movingOutwards) {
                data.direction *= -1;
                car.rotation.y += Math.PI;
            }
        }

        data.currentOpacity = targetOpacity;
        car.traverse(c => { if(c.isMesh) c.material.opacity = targetOpacity; });

        if(data.smoke) {
            const isVisible = targetOpacity > 0.1;
            const exhaustOffset = new THREE.Vector3(0, 0.5, 3.5); 
            exhaustOffset.applyEuler(car.rotation); 
            const exhaustPos = car.position.clone().add(exhaustOffset);
            data.smoke.update(exhaustPos, isVisible);
        }
    });
    renderer.render(scene, camera);
}
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
animate();