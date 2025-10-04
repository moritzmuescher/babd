"use client"

import { useEffect, useRef } from "react"

export function ThreeScene() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    let scene: any, camera: any, renderer: any, controls: any

    const initThree = async () => {
      const THREE = await import("three")
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js")

      // Basic setup
      scene = new THREE.Scene()
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000)
      renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setClearColor(0x000000)

      if (containerRef.current) {
        containerRef.current.appendChild(renderer.domElement)
      }

      controls = new OrbitControls(camera, renderer.domElement)
      controls.enableRotate = true
      controls.enableZoom = true
      controls.enablePan = false
      controls.maxDistance = 500
      controls.minDistance = 0.1

      // Set different initial camera position for mobile vs desktop
      const isMobile = window.innerWidth < 768
      camera.position.z = isMobile ? 15 : 10

      // Create circle texture
      const canvas = document.createElement("canvas")
      canvas.width = 32
      canvas.height = 32
      const ctx = canvas.getContext("2d")!
      ctx.beginPath()
      ctx.arc(16, 16, 16, 0, 2 * Math.PI)
      ctx.fillStyle = "white"
      ctx.fill()
      const circleTexture = new THREE.CanvasTexture(canvas)

      // Starfield
      const starGeometry = new THREE.BufferGeometry()
      const starVertices = []
      for (let i = 0; i < 10000; i++) {
        starVertices.push(
          THREE.MathUtils.randFloatSpread(2000),
          THREE.MathUtils.randFloatSpread(2000),
          THREE.MathUtils.randFloatSpread(4000),
        )
      }
      starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starVertices, 3))
      const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.7,
        map: circleTexture,
        transparent: true,
      })
      const stars = new THREE.Points(starGeometry, starMaterial)
      scene.add(stars)

      // Planet
      const numParticles = 5000
      const sphereRadius = 5
      const planetGeometry = new THREE.BufferGeometry()
      const positions = new Float32Array(numParticles * 3)
      const colors = new Float32Array(numParticles * 3)
      const goldenRatio = (1 + Math.sqrt(5)) / 2
      const angleIncrement = Math.PI * 2 * goldenRatio

      for (let i = 0; i < numParticles; i++) {
        const t = i / numParticles
        const inclination = Math.acos(1 - 2 * t)
        const azimuth = angleIncrement * i

        const x = sphereRadius * Math.sin(inclination) * Math.cos(azimuth)
        const y = sphereRadius * Math.sin(inclination) * Math.sin(azimuth)
        const z = sphereRadius * Math.cos(inclination)

        positions[i * 3] = x
        positions[i * 3 + 1] = y
        positions[i * 3 + 2] = z

        const intensity = (z / sphereRadius + 1) / 2
        const color = 1.0 - (1 - intensity) * 0.5
        colors[i * 3] = color
        colors[i * 3 + 1] = color * 0.4
        colors[i * 3 + 2] = 0
      }

      planetGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
      planetGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))
      const planetMaterial = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        map: circleTexture,
        transparent: true,
        depthWrite: false,
      })

      const planet = new THREE.Points(planetGeometry, planetMaterial)
      planet.material.emissive = new THREE.Color(0x442200)
      planet.material.emissiveIntensity = 0.4
      scene.add(planet)

      // Add glow sphere around planet
      const glowGeometry = new THREE.SphereGeometry(sphereRadius * 1.2, 32, 32)
      const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
        },
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          varying vec3 vNormal;
          void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            vec3 glow = vec3(1.0, 0.4, 0.0) * intensity;
            gl_FragColor = vec4(glow, intensity * 0.4);
          }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
      })
      const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial)
      scene.add(glowSphere)

      // Text particles
      const textCanvas = document.createElement("canvas")
      textCanvas.width = 512
      textCanvas.height = 128
      const textCtx = textCanvas.getContext("2d")!
      textCtx.font = "bold 100px arial"
      textCtx.fillStyle = "#ff9900"
      const text = "₿abd"
      const metrics = textCtx.measureText(text)
      textCtx.fillText(text, (textCanvas.width - metrics.width) / 2, 100)
      const imageData = textCtx.getImageData(0, 0, textCanvas.width, textCanvas.height).data

      const points = []
      const lineIndices = []
      const pointMap = new Map()

      const scale = 0.02
      const sampling = 4
      const depthLayers = 2
      const layerDepth = 0.2

      for (let d = 0; d < depthLayers; d++) {
        const pz = (d - (depthLayers - 1) / 2) * layerDepth
        for (let y = 0; y < textCanvas.height; y += sampling) {
          for (let x = 0; x < textCanvas.width; x += sampling) {
            if (imageData[(y * textCanvas.width + x) * 4 + 3] > 128) {
              const index = points.length / 3
              points.push((x - textCanvas.width / 2) * scale, (textCanvas.height / 2 - y) * scale, pz)
              pointMap.set(`${x},${y},${d}`, index)
            }
          }
        }
      }

      for (let d = 0; d < depthLayers; d++) {
        for (let y = 0; y < textCanvas.height; y += sampling) {
          for (let x = 0; x < textCanvas.width; x += sampling) {
            const currentKey = `${x},${y},${d}`
            if (pointMap.has(currentKey)) {
              const currentIndex = pointMap.get(currentKey)

              const neighbors = [
                `${x + sampling},${y},${d}`,
                `${x},${y + sampling},${d}`,
                `${x + sampling},${y + sampling},${d}`,
                `${x - sampling},${y + sampling},${d}`,
              ]

              for (const neighborKey of neighbors) {
                if (pointMap.has(neighborKey)) {
                  lineIndices.push(currentIndex, pointMap.get(neighborKey))
                }
              }

              if (d < depthLayers - 1) {
                const nextLayerKey = `${x},${y},${d + 1}`
                if (pointMap.has(nextLayerKey)) {
                  lineIndices.push(currentIndex, pointMap.get(nextLayerKey))
                }
              }
            }
          }
        }
      }

      const textGeometry = new THREE.BufferGeometry()
      textGeometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3))
      textGeometry.setIndex(lineIndices)

      const pointsMaterial = new THREE.PointsMaterial({
        size: 0.05,
        color: 0xff9900,
        map: circleTexture,
        transparent: true,
      })
      pointsMaterial.emissive = new THREE.Color(0xff6600)
      pointsMaterial.emissiveIntensity = 0.6

      const textPoints = new THREE.Points(textGeometry, pointsMaterial)

      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xff9900,
        transparent: true,
        opacity: 1.0,
      })
      lineMaterial.emissive = new THREE.Color(0xff6600)
      lineMaterial.emissiveIntensity = 0.4
      const textLines = new THREE.LineSegments(textGeometry, lineMaterial)

      const textGroup = new THREE.Group()
      textGroup.add(textPoints)
      textGroup.add(textLines)
      scene.add(textGroup)

      // Animation loop
      function animate() {
        requestAnimationFrame(animate)

        planet.rotation.y += 0.001
        const starPositions = starGeometry.attributes.position
        for (let i = 0; i < starPositions.count; i++) {
          let z = starPositions.getZ(i)
          z += 0.5
          if (z > 2000) z -= 4000
          starPositions.setZ(i, z)
        }
        starPositions.needsUpdate = true

        renderer.render(scene, camera)
        controls.update()
        glowMaterial.uniforms.time.value += 0.01
      }
      animate()

      // Handle resize
      const handleResize = () => {
        const width = window.innerWidth
        const height = window.innerHeight
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height)

        // Adjust camera position on resize if switching between mobile/desktop
        const isMobileNow = width < 768
        const currentZ = camera.position.z
        const targetZ = isMobileNow ? 15 : 10

        // Only adjust if there's a significant difference to avoid constant adjustments
        if (Math.abs(currentZ - targetZ) > 2) {
          camera.position.z = targetZ
        }
      }
      window.addEventListener("resize", handleResize)

      return () => {
        window.removeEventListener("resize", handleResize)
      }
    }

    initThree()
  }, [])

  return <div ref={containerRef} className="absolute inset-0" />
}

