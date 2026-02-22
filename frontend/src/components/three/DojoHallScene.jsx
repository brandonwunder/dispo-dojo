import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { prefersReducedMotion } from '../../lib/animation/reducedMotion';

export default function DojoHallScene() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion() || !containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a14, 0.08);
    scene.background = new THREE.Color(0x0a0a14);

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 50);
    camera.position.set(0, 3, 6);
    camera.lookAt(0, 2.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Wooden floor
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x2a2118, roughness: 0.85 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Central clan crest (gold torus)
    const torusMat = new THREE.MeshStandardMaterial({ color: 0xd4a853, metalness: 0.8, roughness: 0.3 });
    const torus = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.1, 16, 48), torusMat);
    torus.position.set(0, 3, -2);
    scene.add(torus);

    // Inner emblem (small sphere)
    const emblemMat = new THREE.MeshStandardMaterial({ color: 0xd4a853, metalness: 0.9, roughness: 0.2, emissive: 0xd4a853, emissiveIntensity: 0.2 });
    const emblem = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), emblemMat);
    emblem.position.set(0, 3, -2);
    scene.add(emblem);

    // Hanging banners (left and right)
    const bannerMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.7, side: THREE.DoubleSide });
    [-3, 3].forEach(x => {
      const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 3), bannerMat);
      banner.position.set(x, 4, -3);
      scene.add(banner);
    });

    // Overhead lantern
    const lanternLight = new THREE.PointLight(0xff9a3c, 3, 12);
    lanternLight.position.set(0, 5, 0);
    scene.add(lanternLight);

    // Ambient
    scene.add(new THREE.AmbientLight(0x1a1510, 0.5));

    // Dust motes
    const dustGeo = new THREE.BufferGeometry();
    const dustCount = 100;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 10;
      dustPositions[i * 3 + 1] = Math.random() * 6;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0xffeedd, size: 0.03, transparent: true, opacity: 0.4 });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // Animation
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      torus.rotation.y += 0.003;
      emblem.rotation.y -= 0.005;
      emblem.rotation.x += 0.002;

      // Float dust
      const pos = dust.geometry.attributes.position.array;
      for (let i = 0; i < dustCount; i++) {
        pos[i * 3 + 1] += 0.001;
        if (pos[i * 3 + 1] > 6) pos[i * 3 + 1] = 0;
      }
      dust.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full absolute inset-0" />;
}
