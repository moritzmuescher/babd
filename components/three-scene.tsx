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
      renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2))
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
      // Magnetic bend (continuous outside→surface)
      // + Press-to-compress (SMOOTH)
      // =============================
      const basePositions = positions.slice(0) // immutable local-space base

      const raycaster = new THREE.Raycaster()
      const ndc = new THREE.Vector2()
      let pointerActive = false

      // Tunables
      const influenceRadius = 1.6
      const strength = 0.45
      const hoverReach = 3.0        // how far outside still influences (world)
      const maxOutward = 1.2        // max outward offset (world)
      const tentSharpness = 1.0     // triangular peak sharpness

      // Press-to-compress tunables
      const compressionScaleActive = 0.72 // target radius while pressed
      const compressionEasePress = 0.25   // approach rate toward compressed
      const compressionEaseRelease = 0.18 // approach rate back to normal
      const spinBoostTarget = 2.2         // ↓ reduced spin multiplier while pressed
      const spinEase = 0.18               // easing for spin factor

      let deformAlpha = 0
      const magnetLocal = new THREE.Vector3(0, 0, sphereRadius)
      const magnetWorldTarget = new THREE.Vector3()
      let magnetActive = false

      // Smooth “outward intensity” that peaks outside and goes to ~0 at the surface
      let outwardAlpha = 0

      // Press-to-compress state
      let compressionActive = false
      let compressionFactor = 1.0       // animated radius scale (smooth)
      let spinSpeedFactor = 1.0         // animated spin multiplier (smooth)

      // Reusable vectors
      const vCenterW = new THREE.Vector3()
      const vO = new THREE.Vector3()
      const vD = new THREE.Vector3()
      const vOC = new THREE.Vector3()
      const vClosest = new THREE.Vector3()
      const vDir = new THREE.Vector3()
      const vHit = new THREE.Vector3()
      const vSurface = new THREE.Vector3()

      function onPointerMove(e: PointerEvent) {
        const rect = renderer.domElement.getBoundingClientRect()
        ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        pointerActive = true
      }
      function onPointerLeave() {
        pointerActive = false
        magnetActive = false
        compressionActive = false
      }

      // PRESS-TO-COMPRESS: enable only if clicking the sphere surface
      function onPointerDown(e: PointerEvent) {
        const rect = renderer.domElement.getBoundingClientRect()
        ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(ndc, camera)

        vCenterW.setFromMatrixPosition(planet.matrixWorld)
        const sphere = new THREE.Sphere(vCenterW, sphereRadius)
        const hit = raycaster.ray.intersectSphere(sphere, vHit)
        if (hit) {
          compressionActive = true
        }
      }
      function onPointerUp() {
        compressionActive = false
      }

      renderer.domElement.addEventListener("pointermove", onPointerMove)
      renderer.domElement.addEventListener("pointerleave", onPointerLeave)
      renderer.domElement.addEventListener("pointerdown", onPointerDown)
      window.addEventListener("pointerup", onPointerUp)

      // Triangular "tent" curve with peak at u=0.5, zero at u=0 and u=1
      function tent01(u: number) {
        const x = Math.max(0, Math.min(1, u))
        const t = 1 - 2 * Math.abs(x - 0.5) // 0..1..0
        return Math.pow(t, tentSharpness)
      }

      function updateMagnetFromRay() {
        if (!pointerActive) {
          magnetActive = false
          outwardAlpha += (0 - outwardAlpha) * 0.15
          return
        }

        raycaster.setFromCamera(ndc, camera)
        vCenterW.setFromMatrixPosition(planet.matrixWorld)
        const sphere = new THREE.Sphere(vCenterW, sphereRadius)

        // Compute closest point on the ray to the sphere center
        vO.copy(raycaster.ray.origin)
        vD.copy(raycaster.ray.direction)
        vOC.subVectors(vCenterW, vO)
        const t = Math.max(vOC.dot(vD), 0)             // forward along the ray
        vClosest.copy(vO).addScaledVector(vD, t)
        let d = vClosest.distanceTo(vCenterW)          // distance from center at closest approach

        // Detect if we actually hit the sphere
        const hit = raycaster.ray.intersectSphere(sphere, vHit) ?? null

        // Direction from center
        if (hit) {
          vDir.copy(vHit).sub(vCenterW).normalize()
          vSurface.copy(vHit)
          d = sphereRadius // enforce continuity
        } else {
          vDir.subVectors(vClosest, vCenterW)
          const len = vDir.length()
          if (len > 1e-6) vDir.multiplyScalar(1 / len)
          else vDir.set(0, 0, 1).applyQuaternion(planet.getWorldQuaternion(new THREE.Quaternion())).normalize()
          vSurface.copy(vCenterW).addScaledVector(vDir, sphereRadius)
        }

        const withinHover = d <= sphereRadius + hoverReach
        magnetActive = withinHover || !!hit

        const u = Math.max(0, Math.min(1, (d - sphereRadius) / hoverReach))
        const targetOutward = tent01(u)
        outwardAlpha += (targetOutward - outwardAlpha) * 0.25

        const outward = maxOutward * outwardAlpha
        magnetWorldTarget.copy(vSurface).addScaledVector(vDir, outward)
      }

      // --- Animation loop ---
      function animate() {
        frameId = requestAnimationFrame(animate)
        const t = performance.now() * 0.001

        // Update sticky target (continuous outside → surface)
        updateMagnetFromRay()

        // Ease compression factor toward target
        const targetCompression = compressionActive ? compressionScaleActive : 1.0
        const compEase = compressionActive ? compressionEasePress : compressionEaseRelease
        compressionFactor += (targetCompression - compressionFactor) * compEase

        // Ease spin speed toward target
        const targetSpin = compressionActive ? spinBoostTarget : 1.0
        spinSpeedFactor += (targetSpin - spinSpeedFactor) * spinEase

        // Planet precession — boosted by smoothed spinSpeedFactor
        const precessAx = 0.25 * Math.sin(t * 0.25)
        const precessAz = 0.25 * Math.cos(t * 0.2)
        _tmpAxis.set(precessAx, 1.0, precessAz).normalize()
        const baseDelta = 0.0015
        const deltaAngle = baseDelta * spinSpeedFactor
        _tmpQuat.setFromAxisAngle(_tmpAxis, deltaAngle)
        planet.quaternion.multiply(_tmpQuat)

        // Text gentle drift (slightly boosted too)
        const driftBoost = 0.8 + 0.2 * spinSpeedFactor
        textGroup.rotation.y = initialYaw + 0.015 * driftBoost * Math.sin(t * 0.6 + 1.2)
        textGroup.rotation.x = initialPitch + 0.012 * driftBoost * Math.cos(t * 0.8)

        // Keep glow aligned with planet & scale with compression
        glowSphere.quaternion.copy(planet.quaternion)
        glowSphere.scale.setScalar(compressionFactor)

        // Smooth activation & magnet interpolation
        deformAlpha += ((magnetActive ? 1 : 0) - deformAlpha) * 0.12
        if (magnetActive) {
          const targetLocal = planet.worldToLocal(magnetWorldTarget.clone())
          magnetLocal.lerp(targetLocal, 0.18)
        }

        // --- Deform + (SMOOTH) Compression ---
        const posAttr = planetGeometry.getAttribute("position") as THREE.BufferAttribute
        const arr = posAttr.array as Float32Array
        const sigma = influenceRadius
        const twoSigma2 = 2 * sigma * sigma

        if (deformAlpha > 0.001 || Math.abs(compressionFactor - 1.0) > 1e-4) {
          for (let i = 0; i < numParticles; i++) {
            const ix = i * 3

            // Compressed base
            const bx = basePositions[ix] * compressionFactor
            const by = basePositions[ix + 1] * compressionFactor
            const bz = basePositions[ix + 2] * compressionFactor

            // Magnet displacement around compressed base
            const dx = magnetLocal.x - bx
            const dy = magnetLocal.y - by
            const dz = magnetLocal.z - bz
            const dist2 = dx * dx + dy * dy + dz * dz

            const w = Math.exp(-dist2 / twoSigma2)
            const k = strength * w * deformAlpha

            arr[ix] = bx + dx * k
            arr[ix + 1] = by + dy * k
            arr[ix + 2] = bz + dz * k
          }
          posAttr.needsUpdate = true
        } else {
          // Fully relaxed, write true base
          for (let i = 0; i < basePositions.length; i++) arr[i] = basePositions[i]
          posAttr.needsUpdate = true
        }

        // Starfield gentle forward drift
        const starPositions = starGeometry.attributes.position as THREE.BufferAttribute
        for (let i = 0; i < starPositions.count; i++) {
          let z = starPositions.getZ(i)
          z += 0.5
          if (z > 2000) z -= 4000
          starPositions.setZ(i, z)
        }
        starPositions.needsUpdate = true

        renderer.render(scene, camera)
        controls.update()
        ;(glowMaterial.uniforms as any).time.value += 0.01
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
        renderer.domElement.removeEventListener("pointerdown", onPointerDown)
        window.removeEventListener("pointerup", onPointerUp)
        if (frameId) cancelAnimationFrame(frameId)
        if (renderer.domElement && renderer.domElement.parentElement) {
          renderer.domElement.parentElement.removeChild(renderer.domElement)
        }
        starGeometry.dispose()
        starMaterial.dispose()
        planetGeometry.dispose()
        planetMaterial.dispose()
        textGeometry.dispose()
        pointsMaterial.dispose()
        lineMaterial.dispose()
        glowGeometry.dispose()
        glowMaterial.dispose()
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

