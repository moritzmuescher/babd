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
      const baseColors = new Float32Array(numParticles * 3) // Store original colors
      const particleVelocities = new Float32Array(numParticles * 3) // For wobble effect

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

        // Store base colors for animation
        baseColors[ix] = color
        baseColors[ix + 1] = color * 0.4
        baseColors[ix + 2] = 0

        // Initialize random velocities for wobble effect
        particleVelocities[ix] = (Math.random() - 0.5) * 2
        particleVelocities[ix + 1] = (Math.random() - 0.5) * 2
        particleVelocities[ix + 2] = (Math.random() - 0.5) * 2
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
        uniforms: {
          time: { value: 0 },
          spinFactor: { value: 1.0 },
          cursorProximity: { value: 0.0 }
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
          uniform float spinFactor;
          uniform float cursorProximity;
          varying vec3 vNormal;
          void main() {
            vec3 n = normalize(vNormal);
            float d = max(0.0, 0.7 - n.z);

            // Pulsing effect only when spinning faster (pressed), but slower
            float pulse = 1.0;
            if (spinFactor > 1.1) {
              pulse = 0.9 + 0.1 * sin(time * 1.5);
            }

            // Cursor proximity brightness (0.5 = far, 1.0 = at center)
            float proximityBoost = cursorProximity;

            // Intensity boost when spinning faster
            float boost = 0.5 + 0.5 * (spinFactor - 1.0);
            float intensity = d * d * pulse * proximityBoost * (1.0 + boost * 0.6);

            // Shift to hotter colors when spinning faster
            float heatShift = (spinFactor - 1.0) * 0.5;
            vec3 glow = vec3(1.0, 0.4 - heatShift * 0.2, 0.0) * intensity;

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
      // Helper function to generate high-quality text geometry
      function generateTextGeometry(text: string, fontSize: number, canvasWidth: number, canvasHeight: number, depthLayers: number = 1) {
        const canvas = document.createElement("canvas")
        canvas.width = canvasWidth
        canvas.height = canvasHeight
        const ctx = canvas.getContext("2d")!

        const centerX = canvas.width / 2
        const centerY = canvas.height / 2

        ctx.fillStyle = "#ff9900"

        // Official Bitcoin logo SVG path data
        const bitcoinPath = "M217.021,167.042c18.631-9.483,30.288-26.184,27.565-54.007c-3.667-38.023-36.526-50.773-78.006-54.404l-0.008-52.741 h-32.139l-0.009,51.354c-8.456,0-17.076,0.166-25.657,0.338L108.76,5.897l-32.11-0.003l-0.006,52.728 c-6.959,0.142-13.793,0.277-20.466,0.277v-0.156l-44.33-0.018l0.006,34.282c0,0,23.734-0.446,23.343-0.013 c13.013,0.009,17.262,7.559,18.484,14.076l0.01,60.083v84.397c-0.573,4.09-2.984,10.625-12.083,10.637 c0.414,0.364-23.379-0.004-23.379-0.004l-6.375,38.335h41.817c7.792,0.009,15.448,0.13,22.959,0.19l0.028,53.338l32.102,0.009 l-0.009-52.779c8.832,0.18,17.357,0.258,25.684,0.247l-0.009,52.532h32.138l0.018-53.249c54.022-3.1,91.842-16.697,96.544-67.385 C266.916,192.612,247.692,174.396,217.021,167.042z M109.535,95.321c18.126,0,75.132-5.767,75.14,32.064 c-0.008,36.269-56.996,32.032-75.14,32.032V95.321z M109.521,262.447l0.014-70.672c21.778-0.006,90.085-6.261,90.094,35.32 C199.638,266.971,131.313,262.431,109.521,262.447z"

        // Handle text with Bitcoin symbol
        if (text.includes("₿")) {
          // For "₿abd" or just "₿"
          const bitcoinIndex = text.indexOf("₿")
          const beforeBitcoin = text.substring(0, bitcoinIndex)
          const afterBitcoin = text.substring(bitcoinIndex + 1)

          ctx.font = `bold ${fontSize}px arial`
          ctx.textBaseline = "middle"

          // Calculate total width for centering
          const beforeWidth = beforeBitcoin ? ctx.measureText(beforeBitcoin).width : 0
          const afterWidth = afterBitcoin ? ctx.measureText(afterBitcoin).width : 0

          // Make Bitcoin B smaller when it's part of text (like "Babd"), larger when standalone
          const isStandalone = !beforeBitcoin && !afterBitcoin
          const bitcoinScale = isStandalone ? 1.0 : 0.82 // Slightly smaller B in "Babd"
          const bitcoinWidth = fontSize * 0.95 * bitcoinScale
          const totalWidth = beforeWidth + bitcoinWidth + afterWidth

          let currentX = centerX - totalWidth / 2

          // Draw text before Bitcoin symbol
          if (beforeBitcoin) {
            ctx.textAlign = "left"
            ctx.fillText(beforeBitcoin, currentX, centerY)
            currentX += beforeWidth
          }

          // Draw Bitcoin logo using SVG path
          ctx.save()
          const path = new Path2D(bitcoinPath)
          const svgSize = 280
          const scale = (fontSize / svgSize) * bitcoinScale
          const pathCenterX = 138.5
          const pathCenterY = isStandalone ? 180 : 185 // Adjusted vertical positioning

          ctx.translate(currentX + (bitcoinWidth / 2) - (pathCenterX * scale), centerY - (pathCenterY * scale))
          ctx.scale(scale, scale)
          ctx.fill(path)
          ctx.restore()

          currentX += bitcoinWidth

          // Draw text after Bitcoin symbol
          if (afterBitcoin) {
            ctx.textAlign = "left"
            ctx.fillText(afterBitcoin, currentX, centerY)
          }
        } else {
          // Use font for other text
          ctx.font = `bold ${fontSize}px arial`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(text, centerX, centerY)
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        const pointsArr: number[] = []
        const lineIndices: number[] = []
        const pointMap = new Map<string, number>()
        const scale = 0.02
        const sampling = 3 // Fine sampling for high quality
        const layerDepth = 0.15

        for (let d = 0; d < depthLayers; d++) {
          const pz = (d - (depthLayers - 1) / 2) * layerDepth

          for (let y = 0; y < canvas.height; y += sampling) {
            for (let x = 0; x < canvas.width; x += sampling) {
              if (imageData[(y * canvas.width + x) * 4 + 3] > 128) {
                const index = pointsArr.length / 3
                pointsArr.push((x - canvas.width / 2) * scale, (canvas.height / 2 - y) * scale, pz)
                pointMap.set(`${x},${y},${d}`, index)
              }
            }
          }
        }

        // Build wireframe connections
        for (let d = 0; d < depthLayers; d++) {
          for (let y = 0; y < canvas.height; y += sampling) {
            for (let x = 0; x < canvas.width; x += sampling) {
              const currentKey = `${x},${y},${d}`
              if (pointMap.has(currentKey)) {
                const currentIndex = pointMap.get(currentKey)!
                const neighbors = [
                  `${x + sampling},${y},${d}`,
                  `${x},${y + sampling},${d}`,
                  `${x + sampling},${y + sampling},${d}`,
                  `${x - sampling},${y + sampling},${d}`,
                ]
                for (const neighborKey of neighbors) {
                  if (pointMap.has(neighborKey)) {
                    lineIndices.push(currentIndex, pointMap.get(neighborKey)!)
                  }
                }
                // Connect depth layers
                if (d < depthLayers - 1) {
                  const nextLayerKey = `${x},${y},${d + 1}`
                  if (pointMap.has(nextLayerKey)) {
                    lineIndices.push(currentIndex, pointMap.get(nextLayerKey)!)
                  }
                }
              }
            }
          }
        }

        return { positions: new Float32Array(pointsArr), lineIndices }
      }

      // Generate both text variants with proper quality
      const babdGeom = generateTextGeometry("₿abd", 70, 512, 128, 3)
      const bitcoinGeom = generateTextGeometry("₿", 160, 512, 512, 3)

      // Create unified geometry that can hold both
      const maxPoints = Math.max(babdGeom.positions.length / 3, bitcoinGeom.positions.length / 3)
      const textPositions = new Float32Array(maxPoints * 3)
      const textColors = new Float32Array(maxPoints * 3)
      const textOpacities = new Float32Array(maxPoints)

      // Initialize with Babd positions
      for (let i = 0; i < babdGeom.positions.length; i++) {
        textPositions[i] = babdGeom.positions[i]
      }

      // Initialize colors with gradient
      for (let i = 0; i < maxPoints; i++) {
        const i3 = i * 3
        // Default orange color
        textColors[i3] = 1.0     // R
        textColors[i3 + 1] = 0.6 // G
        textColors[i3 + 2] = 0.0 // B
        textOpacities[i] = i < babdGeom.positions.length / 3 ? 1.0 : 0.0
      }

      const textGeometry = new THREE.BufferGeometry()
      textGeometry.setAttribute("position", new THREE.BufferAttribute(textPositions, 3))
      textGeometry.setAttribute("color", new THREE.BufferAttribute(textColors, 3))
      textGeometry.setAttribute("opacity", new THREE.BufferAttribute(textOpacities, 1))
      textGeometry.setIndex(babdGeom.lineIndices)

      const pointsMaterial = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        map: circleTexture,
        transparent: true,
        blending: THREE.NormalBlending,
        opacity: 1.0,
        depthWrite: true,
      })
      const textPoints = new THREE.Points(textGeometry, pointsMaterial)

      const lineMaterial = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 1.0 })
      const textLines = new THREE.LineSegments(textGeometry, lineMaterial)

      const textGroup = new THREE.Group()
      textGroup.add(textPoints)
      textGroup.add(textLines)
      scene.add(textGroup)
      textGroup.rotation.set(initialPitch, initialYaw, 0)

      // Store particle velocities for physics effect
      const textParticleVelocities = new Float32Array(maxPoints * 3)
      for (let i = 0; i < maxPoints * 3; i++) {
        textParticleVelocities[i] = (Math.random() - 0.5) * 0.15
      }

      // Track text morph state
      let textMorphFactor = 0

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
      let globalCursorX = 0
      let globalCursorY = 0
      let hasCursorMoved = false

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
      let wasCompressed = false         // Track previous compression state for ripple
      let compressionFactor = 1.0       // animated radius scale (smooth)
      let spinSpeedFactor = 1.0         // animated spin multiplier (smooth)
      let rippleTime = -999             // Time when ripple started
      const rippleDuration = 1.5        // Ripple wave duration in seconds

      // Planet physics drag state
      let isDraggingPlanet = false
      let lastPointerX = 0
      let lastPointerY = 0
      let dragVelocityX = 0
      let dragVelocityY = 0
      let angularVelocity = new THREE.Vector3(0, 0, 0) // Current rotational velocity
      const dampingFactor = 0.975 // How quickly rotation slows down (closer to 1 = slower dampening)

      // Reusable vectors
      const vCenterW = new THREE.Vector3()
      const vO = new THREE.Vector3()
      const vD = new THREE.Vector3()
      const vOC = new THREE.Vector3()
      const vClosest = new THREE.Vector3()
      const vDir = new THREE.Vector3()
      const vHit = new THREE.Vector3()
      const vSurface = new THREE.Vector3()

      function onGlobalPointerMove(e: PointerEvent) {
        globalCursorX = e.clientX
        globalCursorY = e.clientY
        hasCursorMoved = true
      }

      function onPointerMove(e: PointerEvent) {
        const rect = renderer.domElement.getBoundingClientRect()
        ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        pointerActive = true

        // Track drag velocity if dragging the planet
        if (isDraggingPlanet) {
          dragVelocityX = e.clientX - lastPointerX
          dragVelocityY = e.clientY - lastPointerY
          lastPointerX = e.clientX
          lastPointerY = e.clientY
        }
      }
      function onPointerLeave() {
        pointerActive = false
        magnetActive = false
        compressionActive = false
        isDraggingPlanet = false
        controls.enabled = true // Re-enable camera controls
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
          isDraggingPlanet = true
          lastPointerX = e.clientX
          lastPointerY = e.clientY
          dragVelocityX = 0
          dragVelocityY = 0
          controls.enabled = false // Disable camera controls when dragging planet
        }
      }
      function onPointerUp() {
        compressionActive = false

        if (isDraggingPlanet) {
          // Apply drag velocity as angular velocity
          const sensitivity = 0.005 // How much drag affects rotation
          angularVelocity.set(
            -dragVelocityY * sensitivity,
            dragVelocityX * sensitivity,
            0
          )
          isDraggingPlanet = false
          controls.enabled = true // Re-enable camera controls
        }
      }

      window.addEventListener("pointermove", onGlobalPointerMove)
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

        // Calculate cursor proximity to planet center for glow intensity
        let cursorProximity = 0.5 // Default minimum glow (50%)
        if (hasCursorMoved) {
          // Get planet center in screen space
          vCenterW.setFromMatrixPosition(planet.matrixWorld)
          const planetScreenPos = vCenterW.clone().project(camera)

          // Convert planet screen position from NDC to pixel coordinates
          const planetScreenX = (planetScreenPos.x * 0.5 + 0.5) * window.innerWidth
          const planetScreenY = (-planetScreenPos.y * 0.5 + 0.5) * window.innerHeight

          // Calculate distance from global cursor to planet center in pixels
          const dx = globalCursorX - planetScreenX
          const dy = globalCursorY - planetScreenY
          const distFromCenter = Math.sqrt(dx * dx + dy * dy)

          // Convert to proximity: 1 at center, 0.5 at far distance
          // Use screen diagonal as max distance
          const maxDist = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2)
          const normalizedDist = Math.min(distFromCenter / maxDist, 1)

          // Map from [0, 1] distance to [1.0, 0.5] proximity (inverted, with 50% minimum)
          cursorProximity = 1.0 - normalizedDist * 0.5
        }

        // Update glow shader uniform
        ;(glowMaterial.uniforms as any).cursorProximity.value = cursorProximity

        // Ease compression factor toward target
        const targetCompression = compressionActive ? compressionScaleActive : 1.0
        const compEase = compressionActive ? compressionEasePress : compressionEaseRelease
        compressionFactor += (targetCompression - compressionFactor) * compEase

        // Ease spin speed toward target
        const targetSpin = compressionActive ? spinBoostTarget : 1.0
        spinSpeedFactor += (targetSpin - spinSpeedFactor) * spinEase

        // Apply physics-based rotation from drag
        if (isDraggingPlanet) {
          // Apply rotation based on current drag velocity (immediate feedback)
          if (Math.abs(dragVelocityX) > 0.1 || Math.abs(dragVelocityY) > 0.1) {
            const sensitivity = 0.01
            _tmpAxis.set(-dragVelocityY, dragVelocityX, 0).normalize()
            const dragAngle = Math.sqrt(dragVelocityX * dragVelocityX + dragVelocityY * dragVelocityY) * sensitivity
            _tmpQuat.setFromAxisAngle(_tmpAxis, dragAngle)
            planet.quaternion.multiply(_tmpQuat)
          }
        } else if (angularVelocity.lengthSq() > 0.00001) {
          // Apply momentum-based rotation after release
          const angle = angularVelocity.length()
          _tmpAxis.copy(angularVelocity).normalize()
          _tmpQuat.setFromAxisAngle(_tmpAxis, angle)
          planet.quaternion.multiply(_tmpQuat)

          // Apply damping to slow down rotation
          angularVelocity.multiplyScalar(dampingFactor)
        } else {
          // Default precession when no manual rotation
          const precessAx = 0.25 * Math.sin(t * 0.25)
          const precessAz = 0.25 * Math.cos(t * 0.2)
          _tmpAxis.set(precessAx, 1.0, precessAz).normalize()
          const baseDelta = 0.0015
          const deltaAngle = baseDelta * spinSpeedFactor
          _tmpQuat.setFromAxisAngle(_tmpAxis, deltaAngle)
          planet.quaternion.multiply(_tmpQuat)
        }

        // Text morphing and physics animation
        const textPosAttr = textGeometry.getAttribute("position") as THREE.BufferAttribute
        const textColorAttr = textGeometry.getAttribute("color") as THREE.BufferAttribute
        const textArr = textPosAttr.array as Float32Array
        const textColorArr = textColorAttr.array as Float32Array

        // Smooth transition factor (0 = Babd, 1 = Bitcoin)
        const morphSpeed = compressionActive ? 0.1 : 0.08
        const textMorphTarget = compressionActive ? 0.0 : 1.0
        textMorphFactor += (textMorphTarget - textMorphFactor) * morphSpeed

        // Physics effects intensity during transition (peaks in the middle)
        const transitionIntensity = 1.0 - Math.abs(textMorphFactor * 2 - 1.0)
        const spinEffect = transitionIntensity * 0.4
        const scatterEffect = transitionIntensity * 0.3

        const numBabdPoints = babdGeom.positions.length / 3
        const numBitcoinPoints = bitcoinGeom.positions.length / 3

        // Update geometry index to match current morph state
        if (textMorphFactor < 0.5) {
          textGeometry.setIndex(babdGeom.lineIndices)
        } else {
          textGeometry.setIndex(bitcoinGeom.lineIndices)
        }

        for (let i = 0; i < maxPoints; i++) {
          const i3 = i * 3

          // Determine source and target positions
          let sourceX = 0, sourceY = 0, sourceZ = 0
          let targetX = 0, targetY = 0, targetZ = 0
          let particleVisible = true

          if (i < numBabdPoints) {
            sourceX = babdGeom.positions[i3]
            sourceY = babdGeom.positions[i3 + 1]
            sourceZ = babdGeom.positions[i3 + 2]
          } else {
            particleVisible = false
          }

          if (i < numBitcoinPoints) {
            targetX = bitcoinGeom.positions[i3]
            targetY = bitcoinGeom.positions[i3 + 1]
            targetZ = bitcoinGeom.positions[i3 + 2]
          } else {
            // Scatter away
            const angle = (i / maxPoints) * Math.PI * 2
            const radius = 10
            targetX = Math.cos(angle) * radius
            targetY = Math.sin(angle) * radius
            targetZ = 0
          }

          // Fade particles in/out based on visibility in each shape
          let fadeIn = 1.0
          let fadeOut = 1.0

          if (i >= numBabdPoints) {
            // This particle only exists in Bitcoin shape
            fadeIn = textMorphFactor
          }
          if (i >= numBitcoinPoints) {
            // This particle only exists in Babd shape
            fadeOut = 1.0 - textMorphFactor
          }

          const particleOpacity = Math.min(fadeIn, fadeOut)

          // Interpolate position
          const lerpX = sourceX + (targetX - sourceX) * textMorphFactor
          const lerpY = sourceY + (targetY - sourceY) * textMorphFactor
          const lerpZ = sourceZ + (targetZ - sourceZ) * textMorphFactor

          // Add physics effects during transition
          const angle = Math.atan2(sourceY, sourceX)
          const radius = Math.sqrt(sourceX * sourceX + sourceY * sourceY)
          const spinAngle = angle + spinEffect * Math.sin(t * 4 + i * 0.1)
          const spinX = Math.cos(spinAngle) * radius
          const spinY = Math.sin(spinAngle) * radius

          // Scatter/wobble effect
          const wobbleX = textParticleVelocities[i3] * scatterEffect * Math.sin(t * 3 + i * 0.05)
          const wobbleY = textParticleVelocities[i3 + 1] * scatterEffect * Math.sin(t * 3.2 + i * 0.07)
          const wobbleZ = textParticleVelocities[i3 + 2] * scatterEffect * Math.sin(t * 2.8 + i * 0.06)

          // Combine all effects
          const finalX = lerpX + (spinX - lerpX) * transitionIntensity + wobbleX
          const finalY = lerpY + (spinY - lerpY) * transitionIntensity + wobbleY
          const finalZ = lerpZ + wobbleZ

          textArr[i3] = finalX
          textArr[i3 + 1] = finalY
          textArr[i3 + 2] = finalZ * particleOpacity // Use Z to fade particles

          // Animated gradient based on position and time
          // Create a wave that moves across the text
          const gradientPhase = (finalY * 0.8 + finalX * 0.5 + t * 0.8) % (Math.PI * 2)
          const gradientValue = Math.sin(gradientPhase) * 0.5 + 0.5

          // Dark color: darker red-orange (#dd5500)
          const darkR = 0.87
          const darkG = 0.33
          const darkB = 0.0

          // Bright color: standard orange (#ff9900)
          const brightR = 1.0
          const brightG = 0.6
          const brightB = 0.0

          // Interpolate between dark and bright based on gradient
          const r = darkR + (brightR - darkR) * gradientValue
          const g = darkG + (brightG - darkG) * gradientValue
          const b = darkB + (brightB - darkB) * gradientValue

          textColorArr[i3] = r
          textColorArr[i3 + 1] = g
          textColorArr[i3 + 2] = b
        }
        textPosAttr.needsUpdate = true
        textColorAttr.needsUpdate = true

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

        // Detect release for ripple effect
        if (wasCompressed && !compressionActive) {
          rippleTime = t // Start ripple
        }
        wasCompressed = compressionActive

        // Calculate ripple effect
        let rippleProgress = (t - rippleTime) / rippleDuration
        rippleProgress = Math.max(0, Math.min(1, rippleProgress))
        const rippleActive = rippleProgress < 1

        // --- Deform + (SMOOTH) Compression + Wobble + Ripple ---
        const posAttr = planetGeometry.getAttribute("position") as THREE.BufferAttribute
        const colorAttr = planetGeometry.getAttribute("color") as THREE.BufferAttribute
        const arr = posAttr.array as Float32Array
        const colorArr = colorAttr.array as Float32Array
        const sigma = influenceRadius
        const twoSigma2 = 2 * sigma * sigma

        // Particle scatter intensity (peaks during compression)
        const scatterIntensity = (1.0 - compressionFactor) * 0.4

        // Color heat shift (more red/orange when compressed)
        const heatFactor = 1.0 - compressionFactor

        if (deformAlpha > 0.001 || Math.abs(compressionFactor - 1.0) > 1e-4 || rippleActive || scatterIntensity > 0.001) {
          for (let i = 0; i < numParticles; i++) {
            const ix = i * 3

            // Compressed base
            const bx = basePositions[ix] * compressionFactor
            const by = basePositions[ix + 1] * compressionFactor
            const bz = basePositions[ix + 2] * compressionFactor

            // Particle scatter effect - push particles outward during compression
            const baseLen = Math.sqrt(bx * bx + by * by + bz * bz)
            const normX = baseLen > 0.001 ? bx / baseLen : 0
            const normY = baseLen > 0.001 ? by / baseLen : 0
            const normZ = baseLen > 0.001 ? bz / baseLen : 0

            // Wobble effect using particle velocities
            const wobbleAmount = scatterIntensity * 0.8
            const wobbleX = particleVelocities[ix] * wobbleAmount * Math.sin(t * 3 + i * 0.1)
            const wobbleY = particleVelocities[ix + 1] * wobbleAmount * Math.sin(t * 3.2 + i * 0.15)
            const wobbleZ = particleVelocities[ix + 2] * wobbleAmount * Math.sin(t * 2.8 + i * 0.12)

            // Scatter outward
            const scatterDist = scatterIntensity * 1.5
            const scatterX = normX * scatterDist
            const scatterY = normY * scatterDist
            const scatterZ = normZ * scatterDist

            // Ripple wave effect on release
            let rippleOffset = 0
            if (rippleActive) {
              // Calculate angle from particle to create wave pattern
              const angle = Math.atan2(by, bx)
              const wavePhase = angle * 2 + rippleProgress * Math.PI * 4
              const rippleWave = Math.sin(wavePhase) * Math.exp(-rippleProgress * 3)
              rippleOffset = rippleWave * 0.3
            }

            // Magnet displacement around compressed base
            const dx = magnetLocal.x - bx
            const dy = magnetLocal.y - by
            const dz = magnetLocal.z - bz
            const dist2 = dx * dx + dy * dy + dz * dz

            const w = Math.exp(-dist2 / twoSigma2)
            const k = strength * w * deformAlpha

            // Combine all effects
            arr[ix] = bx + dx * k + scatterX + wobbleX + normX * rippleOffset
            arr[ix + 1] = by + dy * k + scatterY + wobbleY + normY * rippleOffset
            arr[ix + 2] = bz + dz * k + scatterZ + wobbleZ + normZ * rippleOffset

            // Color shift to hotter colors during compression
            const baseR = baseColors[ix]
            const baseG = baseColors[ix + 1]
            const baseB = baseColors[ix + 2]

            // Shift toward red/orange (reduce green, increase red)
            const hotR = baseR * (1.0 + heatFactor * 0.3)
            const hotG = baseG * (1.0 - heatFactor * 0.3)
            const hotB = baseB + heatFactor * 0.15

            colorArr[ix] = hotR
            colorArr[ix + 1] = hotG
            colorArr[ix + 2] = hotB
          }
          posAttr.needsUpdate = true
          colorAttr.needsUpdate = true
        } else {
          // Fully relaxed, write true base
          for (let i = 0; i < basePositions.length; i++) {
            arr[i] = basePositions[i]
            colorArr[i] = baseColors[i]
          }
          posAttr.needsUpdate = true
          colorAttr.needsUpdate = true
        }

        // Starfield drift - synced with planet rotation speed
        const starPositions = starGeometry.attributes.position as THREE.BufferAttribute
        const starSpeed = 0.5 * spinSpeedFactor // Stars move faster when planet spins faster
        for (let i = 0; i < starPositions.count; i++) {
          let z = starPositions.getZ(i)
          z += starSpeed
          if (z > 2000) z -= 4000
          starPositions.setZ(i, z)
        }
        starPositions.needsUpdate = true

        renderer.render(scene, camera)
        controls.update()
        ;(glowMaterial.uniforms as any).time.value += 0.01
        ;(glowMaterial.uniforms as any).spinFactor.value = spinSpeedFactor
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
        window.removeEventListener("pointermove", onGlobalPointerMove)
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

