"use client"
import { useEffect, useRef } from "react"

export function ThreeScene() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    let scene: any, camera: any, renderer: any, controls: any
    let frameId: number | null = null

    const initThree = async () => {
      const THREE = await import("three")
      const { OrbitControls } = await import("three/addons/controls/OrbitControls.js")

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

      // Camera
      camera.position.z = 15

      // --- UTIL: Circle texture for point sprites ---
      const canvas = document.createElement("canvas")
      canvas.width = 32
      canvas.height = 32
      const ctx = canvas.getContext("2d")!
      ctx.beginPath()
      ctx.arc(16, 16, 16, 0, 2 * Math.PI)
      ctx.fillStyle = "white"
      ctx.fill()
      const circleTexture = new THREE.CanvasTexture(canvas)
      circleTexture.minFilter = THREE.LinearFilter
      circleTexture.magFilter = THREE.LinearFilter
      circleTexture.generateMipmaps = false
      circleTexture.wrapS = THREE.ClampToEdgeWrapping
      circleTexture.wrapT = THREE.ClampToEdgeWrapping
      circleTexture.premultiplyAlpha = true
      circleTexture.needsUpdate = true

      // --- Starfield ---
      const starGeometry = new THREE.BufferGeometry()
      const starVertices: number[] = []
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
        blending: THREE.NormalBlending,
        alphaTest: 0.5,
        depthWrite: false,
      })
      const stars = new THREE.Points(starGeometry, starMaterial)
      scene.add(stars)

      // --- Planet (point cloud) ---
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

        const ix = i * 3
        positions[ix] = x
        positions[ix + 1] = y
        positions[ix + 2] = z

        const intensity = (z / sphereRadius + 1) / 2
        const color = 1.0 - (1 - intensity) * 0.5
        colors[ix] = color
        colors[ix + 1] = color * 0.4
        colors[ix + 2] = 0
      }

      planetGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
      planetGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))

      const planetMaterial = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        map: circleTexture,
        transparent: true,
        blending: THREE.NormalBlending,
        alphaTest: 0.5,
        depthWrite: true,
      })

      const initialYaw = 0.18
      const initialPitch = -0.12

      const planet = new THREE.Points(planetGeometry, planetMaterial)
      scene.add(planet)
      planet.rotation.set(initialPitch, initialYaw, 0)

      // --- GLOW sphere ---
      const glowGeometry = new THREE.SphereGeometry(sphereRadius * 1.2, 32, 32)
      const glowMaterial = new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 } },
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
            vec3 n = normalize(vNormal);
            float d = max(0.0, 0.7 - n.z);
            float intensity = d * d;
            vec3 glow = vec3(1.0, 0.4, 0.0) * intensity;
            gl_FragColor = vec4(glow, intensity * 0.4);
          }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        depthTest: true,
      })
      const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial)
      scene.add(glowSphere)
      glowSphere.rotation.set(initialPitch, initialYaw, 0)

      // --- Text group (points + wireframe) ---
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
      const pointsArr: number[] = []
      const lineIndices: number[] = []
      const pointMap = new Map<string, number>()
      const scale = 0.02
      const sampling = 4
      const depthLayers = 2
      const layerDepth = 0.2

      for (let d = 0; d < depthLayers; d++) {
        const pz = (d - (depthLayers - 1) / 2) * layerDepth
        for (let y = 0; y < textCanvas.height; y += sampling) {
          for (let x = 0; x < textCanvas.width; x += sampling) {
            if (imageData[(y * textCanvas.width + x) * 4 + 3] > 128) {
              const index = pointsArr.length / 3
              pointsArr.push((x - textCanvas.width / 2) * scale, (textCanvas.height / 2 - y) * scale, pz)
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
              const currentIndex = pointMap.get(currentKey) as number
              const neighbors = [
                `${x + sampling},${y},${d}`,
                `${x},${y + sampling},${d}`,
                `${x + sampling},${y + sampling},${d}`,
                `${x - sampling},${y + sampling},${d}`,
              ]
              for (const neighborKey of neighbors) {
                if (pointMap.has(neighborKey)) {
                  lineIndices.push(currentIndex, pointMap.get(neighborKey) as number)
                }
              }
              if (d < depthLayers - 1) {
                const nextLayerKey = `${x},${y},${d + 1}`
                if (pointMap.has(nextLayerKey)) {
                  lineIndices.push(currentIndex, pointMap.get(nextLayerKey) as number)
                }
              }
            }
          }
        }
      }

      const textGeometry = new THREE.BufferGeometry()
      textGeometry.setAttribute("position", new THREE.Float32BufferAttribute(pointsArr, 3))
      textGeometry.setIndex(lineIndices)

      const pointsMaterial = new THREE.PointsMaterial({
        size: 0.05,
        color: 0xff9900,
        map: circleTexture,
        transparent: true,
        blending: THREE.NormalBlending,
        alphaTest: 0.5,
        depthWrite: true,
      })
      const textPoints = new THREE.Points(textGeometry, pointsMaterial)

      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff9900, transparent: true, opacity: 1.0 })
      const textLines = new THREE.LineSegments(textGeometry, lineMaterial)

      const textGroup = new THREE.Group()
      textGroup.add(textPoints)
      textGroup.add(textLines)
      scene.add(textGroup)
      textGroup.rotation.set(initialPitch, initialYaw, 0)

      // --- Reusable objects ---
      const _tmpAxis = new THREE.Vector3()
      const _tmpQuat = new THREE.Quaternion()

      // =============================
      // Magnetic bend toward cursor (robust for on-surface & near-miss)
      // =============================
      const basePositions = positions.slice(0) // immutable reference state in local space

      const raycaster = new THREE.Raycaster()
      const mouse = new THREE.Vector2(999, 999) // Start off-screen

      // Tunables for the effect
      const influenceRadius = 1.6
      const strength = 0.45
      const hoverReach = 3.0
      const maxOutward = 0.6
      const nearMissStrengthScale = 0.85

      let deformAlpha = 0
      const magnetLocal = new THREE.Vector3(0, 0, sphereRadius)
      const magnetLocalTarget = new THREE.Vector3(0, 0, sphereRadius)
      let magnetActive = false
      let magnetMode: 'none' | 'hit' | 'near' = 'none'

      // Reusable vectors
      const vCenterW = new THREE.Vector3()
      const vO = new THREE.Vector3()
      const vD = new THREE.Vector3()
      const vOC = new THREE.Vector3()
      const vClosest = new THREE.Vector3()
      const vDir = new THREE.Vector3()
      const vHit = new THREE.Vector3()
      const vN = new THREE.Vector3()

      function onPointerMove(e: PointerEvent) {
        const rect = renderer.domElement.getBoundingClientRect()
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        magnetActive = true // A move implies the cursor is over the component
      }

      function onPointerLeave() {
        magnetActive = false
        magnetMode = 'none'
        // Optional: Move mouse far away to prevent lingering effects
        mouse.set(999, 999)
      }

      renderer.domElement.addEventListener("pointermove", onPointerMove)
      renderer.domElement.addEventListener("pointerleave", onPointerLeave)

              // --- Animation loop ---
            function animate() {
              frameId = requestAnimationFrame(animate)
              const t = performance.now() * 0.001
      
              // Update magnet logic every frame
              if (magnetActive) {
                raycaster.setFromCamera(mouse, camera)
                vCenterW.setFromMatrixPosition(planet.matrixWorld)
      
                const sphere = new THREE.Sphere(vCenterW, sphereRadius)
                const hit = raycaster.ray.intersectSphere(sphere, vHit)
      
                if (hit) {
                  magnetMode = 'hit'
                  magnetLocalTarget.copy(planet.worldToLocal(vHit.clone()))
                } else {
                  vO.copy(raycaster.ray.origin)
                  vD.copy(raycaster.ray.direction)
                  vOC.subVectors(vCenterW, vO)
                  const tClosest = Math.max(vOC.dot(vD), 0)
                  vClosest.copy(vO).addScaledVector(vD, tClosest)
                  const d = vClosest.distanceTo(vCenterW)
      
                  if (d <= sphereRadius + hoverReach) {
                    magnetMode = 'near'
                    vDir.subVectors(vClosest, vCenterW).normalize()
                    const proximity = THREE.MathUtils.clamp((sphereRadius + hoverReach - d) / hoverReach, 0, 1)
                    const outward = maxOutward * proximity
                    const targetW = vCenterW.clone().addScaledVector(vDir, sphereRadius + outward)
                    magnetLocalTarget.copy(planet.worldToLocal(targetW.clone()))
                  } else {
                    magnetMode = 'none'
                  }
                }
              } else {
                magnetMode = 'none'
              }
      
              // Planet precession (original rotation behavior)
              const precessAx = 0.25 * Math.sin(t * 0.25)
              const precessAz = 0.25 * Math.cos(t * 0.2)        _tmpAxis.set(precessAx, 1.0, precessAz).normalize()
        const deltaAngle = 0.0015
        _tmpQuat.setFromAxisAngle(_tmpAxis, deltaAngle)
        planet.quaternion.multiply(_tmpQuat)

        // Text gentle drift
        textGroup.rotation.y = initialYaw + 0.015 * Math.sin(t * 0.6 + 1.2)
        textGroup.rotation.x = initialPitch + 0.012 * Math.cos(t * 0.8)

        // Keep glow aligned with planet
        glowSphere.quaternion.copy(planet.quaternion)

        // Smooth activation and magnet center
        deformAlpha += ((magnetActive ? 1 : 0) - deformAlpha) * 0.12 // ease in/out
        magnetLocal.lerp(magnetLocalTarget, 0.18)

        // Deform planet vertices in LOCAL space toward magnetLocal
        const posAttr = planetGeometry.getAttribute("position") as any
        const arr = posAttr.array as Float32Array
        const sigma = influenceRadius
        const twoSigma2 = 2 * sigma * sigma
        const strengthEff = magnetMode === 'near' ? strength * nearMissStrengthScale : strength

        if (deformAlpha > 0.001) {
          for (let i = 0; i < numParticles; i++) {
            const ix = i * 3
            const bx = basePositions[ix]
            const by = basePositions[ix + 1]
            const bz = basePositions[ix + 2]

            const dx = magnetLocal.x - bx
            const dy = magnetLocal.y - by
            const dz = magnetLocal.z - bz
            const dist2 = dx * dx + dy * dy + dz * dz

            // Gaussian falloff around the cursor impact point
            const w = Math.exp(-dist2 / twoSigma2)
            const k = strengthEff * w * deformAlpha

            arr[ix] = bx + dx * k
            arr[ix + 1] = by + dy * k
            arr[ix + 2] = bz + dz * k
          }
          posAttr.needsUpdate = true
        } else {
          // relax back to base quickly when inactive
          for (let i = 0; i < basePositions.length; i++) arr[i] = basePositions[i]
          posAttr.needsUpdate = true
        }

        // Starfield gentle forward drift
        const starPositions = starGeometry.attributes.position as any
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

      frameId = requestAnimationFrame(animate)

      // Resize
      const handleResize = () => {
        const width = window.innerWidth
        const height = window.innerHeight
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height)
      }
      window.addEventListener("resize", handleResize)

      // Cleanup
      return () => {
        window.removeEventListener("resize", handleResize)
        renderer.domElement.removeEventListener("pointermove", onPointerMove)
        renderer.domElement.removeEventListener("pointerleave", onPointerLeave)
        if (frameId) cancelAnimationFrame(frameId)
        renderer.dispose()
      }
    }

    let cleanup: (() => void) | undefined
    initThree().then((fn) => {
      if (typeof fn === "function") cleanup = fn
    })

    return () => {
      if (cleanup) cleanup()
    }
  }, [])

  return <div ref={containerRef} className="absolute inset-0" />
}
