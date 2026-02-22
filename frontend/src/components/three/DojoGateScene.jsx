import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { prefersReducedMotion } from '../../lib/animation/reducedMotion';

export default function DojoGateScene() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion() || !containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x06060f, 1, 20);
    scene.background = new THREE.Color(0x06060f);

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 3, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // === TORII GATE ===
    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513, roughness: 0.8, metalness: 0.1
    });
    const topBeamMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4a853, roughness: 0.6, metalness: 0.3
    });

    // Two pillars
    const pillarGeo = new THREE.CylinderGeometry(0.2, 0.25, 6, 12);
    const leftPillar = new THREE.Mesh(pillarGeo, woodMaterial);
    leftPillar.position.set(-2.5, 3, 0);
    scene.add(leftPillar);
    const rightPillar = new THREE.Mesh(pillarGeo, woodMaterial);
    rightPillar.position.set(2.5, 3, 0);
    scene.add(rightPillar);

    // Top beam (kasagi) - gold
    const topBeamGeo = new THREE.BoxGeometry(7, 0.3, 0.5);
    const topBeam = new THREE.Mesh(topBeamGeo, topBeamMaterial);
    topBeam.position.set(0, 6.2, 0);
    scene.add(topBeam);

    // Secondary beam
    const secondBeamGeo = new THREE.BoxGeometry(5.5, 0.2, 0.4);
    const secondBeam = new THREE.Mesh(secondBeamGeo, woodMaterial);
    secondBeam.position.set(0, 5.5, 0);
    scene.add(secondBeam);

    // === STONE LANTERNS (2) ===
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
    [-4, 4].forEach(x => {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.6), stoneMat);
      base.position.set(x, 0.15, 1.5);
      scene.add(base);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 1.2, 8), stoneMat);
      body.position.set(x, 0.9, 1.5);
      scene.add(body);
      // Lantern light
      const light = new THREE.PointLight(0xff9a3c, 2, 6);
      light.position.set(x, 1.8, 1.5);
      scene.add(light);
    });

    // === GROUND ===
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a1510, roughness: 1 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // === STARS ===
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 60;
      starPositions[i * 3 + 1] = Math.random() * 30 + 5;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 60 - 10;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, transparent: true, opacity: 0.6 });
    scene.add(new THREE.Points(starGeo, starMat));

    // === LIGHTING ===
    scene.add(new THREE.AmbientLight(0x222244, 0.4));
    const moonLight = new THREE.DirectionalLight(0xaaaaff, 0.3);
    moonLight.position.set(5, 15, -5);
    scene.add(moonLight);

    // === PARTICLES (cherry blossoms / embers) ===
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 60;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = [];
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 15;
      particlePositions[i * 3 + 1] = Math.random() * 8;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      particleSpeeds.push({ x: (Math.random() - 0.5) * 0.005, y: -Math.random() * 0.008 - 0.002 });
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0xffccaa, size: 0.06, transparent: true, opacity: 0.7 });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // === ANIMATION ===
    let animId;
    let cameraZ = 8;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Slow camera push toward gate
      if (cameraZ > 5.5) {
        cameraZ -= 0.003;
        camera.position.z = cameraZ;
      }

      // Animate particles
      const positions = particles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += particleSpeeds[i].x;
        positions[i * 3 + 1] += particleSpeeds[i].y;
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = 8;
          positions[i * 3] = (Math.random() - 0.5) * 15;
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
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

  return <div ref={containerRef} className="fixed inset-0 z-0" />;
}
