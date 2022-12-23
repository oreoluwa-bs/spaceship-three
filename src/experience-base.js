import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const gsapMatchMedia = gsap.matchMedia();
const mmStates = {
  reduceMotion: "(prefers-reduced-motion: reduce)",
  notReduceMotion: "(prefers-reduced-motion: no-preference)",
};

export default class Experience {
  constructor(options) {
    this.container = options.dom;

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.loadingManager = new THREE.LoadingManager(() => {
      this.setupAnimation();
    });
    this.gltfLoader = new GLTFLoader(this.loadingManager);
    this.dracoLoader = new DRACOLoader(this.loadingManager);
    this.dracoLoader.setDecoderPath("/js/libs/draco/");
    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    this.models = {};

    this.init();

    this.resize();
    this.addEventListeners();
    this.addObjects();
    this.render();

    const toLoad = [
      {
        name: "spaceship",
        path: "/models/spaceship.gltf",
        scale: [0.25, 0.25, 0.25],
      },
      // {
      //   path: "/models/cybertruck.glb",
      //   scale: [0.15, 0.15, 0.15],
      // },
    ];

    toLoad.forEach((item) => {
      const group = new THREE.Group();

      this.gltfLoader.load(item.path, (model) => {
        model.scene.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.receiveShadow = true;
            o.castShadow = true;
            item.scale && o.scale.set(...item.scale);
          }
        });

        group.add(model.scene);

        this.scene.add(group);
        this.models[item.name] = group;
      });
    });
  }

  addEventListeners() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  init() {
    this.time = 0;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      70,
      this.width / this.height,
      0.01,
      10
    );

    this.camera.position.z = 1;
    // this.camera.position.y = 1;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.style.overflow = "hidden";
    this.container.style.margin = 0;

    this.container.appendChild(this.renderer.domElement);

    new OrbitControls(this.camera, this.renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    const frontLight = new THREE.PointLight(0xffffff, 0.8);
    const backLight = new THREE.PointLight(0xffffff, 0.8);

    frontLight.castShadow = true;
    frontLight.shadow.mapSize.width = 1024;
    frontLight.shadow.mapSize.height = 1024;
    backLight.castShadow = true;
    backLight.shadow.mapSize.width = 1024;
    backLight.shadow.mapSize.height = 1024;
    frontLight.position.set(10, 10, 10);
    backLight.position.set(-10, -10, 10);

    // ambientLight.position(1, 1, 1);

    this.scene.add(frontLight);
    this.scene.add(backLight);
    this.scene.add(ambientLight);
  }

  addObjects() {
    this.geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    // this.material = new THREE.MeshNormalMaterial();

    this.material = new THREE.ShaderMaterial({
      fragmentShader: `
        void main(){
            gl_FragColor = vec4(0.0, 0.0, 1.0, 1);
        }
      `,
      vertexShader: `
        void main(){
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      uniforms: {},
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    // this.scene.add(this.mesh);
  }

  setupAnimation() {
    // this.models.spaceship.position.y = 0.35;
    this.models.spaceship.position.x = 0.3;
    // this.models.spaceship.lookAt(this.camera.position);

    gsapMatchMedia.add(mmStates.notReduceMotion, () => {
      this.desktopAnimation();
    });
  }

  desktopAnimation() {
    let section = 0;
    const tl = gsap.timeline({
      defaults: { duration: 1, ease: "power2.inOut" },
      scrollTrigger: {
        trigger: "[data-animation='page']",
        start: "top top",
        end: "bottom bottom",
        scrub: 0.1,
        // markers: true,
      },
    });

    tl.to(
      this.models.spaceship.position,
      {
        x: -0.5,
        // onUpdate: () => {
        //   this.models.spaceship.lookAt(this.camera.position);
        // },
      },
      section
    ).to(
      this.models.spaceship.rotation,
      {
        y: 1,
      },
      section
    );

    //  Section 2
    section += 1;

    tl.to(
      this.models.spaceship.position,
      {
        y: -0.1,
        x: 0.5,
      },
      section
    ).to(
      this.models.spaceship.rotation,
      {
        // y: 1,
        x: 1.5,
      },
      section
    );

    //  Section 3
    section += 1;

    tl.to(
      this.models.spaceship.position,
      {
        x: -0.5,
      },
      section
    ).to(
      this.models.spaceship.rotation,
      {
        y: -1,
        // x: -1.5,
        z: 1,
      },
      section
    );
  }

  render() {
    this.time += 0.05;

    // this.mesh.rotation.x = this.time / 2000;
    // this.mesh.rotation.y = this.time / 1000;

    this.renderer.render(this.scene, this.camera);

    window.requestAnimationFrame(this.render.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);

    this.camera.aspect = this.width / this.height;

    this.camera.updateProjectionMatrix();
  }
}
