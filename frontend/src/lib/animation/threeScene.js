/**
 * Three.js — 3D hero visuals ONLY. Not used for anything else.
 * Renders a floating gold torus-knot with soft particles.
 */

import * as THREE from 'three'
import { prefersReducedMotion } from './reducedMotion'

export function createHeroScene(canvas) {
  if (!canvas || prefersReducedMotion()) return null

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 100)
  camera.position.z = 5

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  })
  renderer.setSize(canvas.clientWidth, canvas.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // Gold torus knot
  const geometry = new THREE.TorusKnotGeometry(1, 0.35, 128, 32)
  const material = new THREE.MeshStandardMaterial({
    color: 0xc9a96e,
    metalness: 0.85,
    roughness: 0.15,
    emissive: 0x332200,
    emissiveIntensity: 0.15,
  })
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  // Particle field
  const particleCount = 200
  const positions = new Float32Array(particleCount * 3)
  for (let i = 0; i < particleCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 10
  }
  const particleGeom = new THREE.BufferGeometry()
  particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const particleMat = new THREE.PointsMaterial({
    color: 0xc9a96e,
    size: 0.02,
    transparent: true,
    opacity: 0.5,
  })
  const particles = new THREE.Points(particleGeom, particleMat)
  scene.add(particles)

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xc9a96e, 1.5)
  directionalLight.position.set(3, 4, 5)
  scene.add(directionalLight)

  const rimLight = new THREE.DirectionalLight(0x4488ff, 0.4)
  rimLight.position.set(-3, -2, -3)
  scene.add(rimLight)

  // Animation loop
  let animId = null
  function animate() {
    animId = requestAnimationFrame(animate)
    mesh.rotation.x += 0.003
    mesh.rotation.y += 0.005
    particles.rotation.y += 0.0005
    renderer.render(scene, camera)
  }
  animate()

  // Resize handler
  function handleResize() {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }
  window.addEventListener('resize', handleResize)

  // Cleanup function
  return {
    destroy() {
      if (animId) cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      geometry.dispose()
      material.dispose()
      particleGeom.dispose()
      particleMat.dispose()
      renderer.dispose()
    },
  }
}
