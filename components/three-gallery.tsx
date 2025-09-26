"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { gsap } from "gsap"

export default function ThreeGallery() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const sceneRef = useRef<{
    scene?: THREE.Scene
    camera?: THREE.PerspectiveCamera
    renderer?: THREE.WebGLRenderer
    group?: THREE.Group
    particles?: THREE.Points
    starField?: THREE.Points
    mouse?: THREE.Vector2
    mousePressed?: boolean
    animationId?: number
  }>({})

  useEffect(() => {
    if (!mountRef.current) return

    // 全局变量
    let scene: THREE.Scene
    let camera: THREE.PerspectiveCamera
    let renderer: THREE.WebGLRenderer
    let group: THREE.Group
    const mouse = new THREE.Vector2()
    let mousePressed = false
    let particles: THREE.Points
    let starField: THREE.Points
    let loadingManager: THREE.LoadingManager
    let loadedCount = 0
    let totalCount = 0

    // 初始化
    function init() {
      // 场景设置
      scene = new THREE.Scene()
      scene.fog = new THREE.Fog(0x000000, 1000, 5000)

      camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000)
      camera.position.set(0, 200, 5000)

      renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      mountRef.current?.appendChild(renderer.domElement)

      // 保存引用
      sceneRef.current = { scene, camera, renderer, group, particles, starField, mouse }

      // 创建星空背景
      createStarField()
      // 创建粒子系统
      createParticles()
      // 创建画廊
      createGallery()
      // 添加灯光
      addLighting()
      // 事件监听
      addEventListeners()
    }

    // 创建星空背景
    function createStarField() {
      const starGeometry = new THREE.BufferGeometry()
      const starCount = 2000
      const positions = new Float32Array(starCount * 3)

      for (let i = 0; i < starCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 10000
        positions[i + 1] = (Math.random() - 0.5) * 10000
        positions[i + 2] = (Math.random() - 0.5) * 10000
      }

      starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))

      const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2,
        transparent: true,
        opacity: 0.8,
      })

      starField = new THREE.Points(starGeometry, starMaterial)
      scene.add(starField)
      sceneRef.current.starField = starField
    }

    // 创建粒子系统
    function createParticles() {
      const particleGeometry = new THREE.BufferGeometry()
      const particleCount = 500
      const positions = new Float32Array(particleCount * 3)
      const colors = new Float32Array(particleCount * 3)

      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 2000
        positions[i + 1] = (Math.random() - 0.5) * 2000
        positions[i + 2] = (Math.random() - 0.5) * 2000

        colors[i] = Math.random() * 0.5 + 0.5
        colors[i + 1] = Math.random() * 0.5 + 0.5
        colors[i + 2] = 1
      }

      particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
      particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))

      const particleMaterial = new THREE.PointsMaterial({
        size: 3,
        transparent: true,
        opacity: 0.6,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
      })

      particles = new THREE.Points(particleGeometry, particleMaterial)
      scene.add(particles)
      sceneRef.current.particles = particles
    }

    // 创建画廊
    function createGallery() {
      const urls = [
        "https://picsum.photos/id/1015/400/250",
        "https://picsum.photos/id/1016/400/250",
        "https://picsum.photos/id/1018/400/250",
        "https://picsum.photos/id/1021/400/250",
        "https://picsum.photos/id/1025/400/250",
        "https://picsum.photos/id/1035/400/250",
        "https://picsum.photos/id/1041/400/250",
        "https://picsum.photos/id/1043/400/250",
        "https://picsum.photos/id/1044/400/250",
        "https://picsum.photos/id/1045/400/250",
        "https://picsum.photos/id/1046/400/250",
        "https://picsum.photos/id/1047/400/250",
      ]

      totalCount = urls.length

      loadingManager = new THREE.LoadingManager()
      loadingManager.onProgress = (url, loaded, total) => {
        const progress = (loaded / total) * 100
        setLoadingProgress(progress)
      }

      loadingManager.onLoad = () => {
        setIsLoaded(true)
        startAnimation()
      }

      const loader = new THREE.TextureLoader(loadingManager)
      group = new THREE.Group()
      scene.add(group)
      sceneRef.current.group = group

      // 设置初始倾斜角度
      group.rotation.x = Math.PI / 2

      const radius = 1000
      const angleStep = (Math.PI * 2) / urls.length

      urls.forEach((url, i) => {
        const texture = loader.load(url, () => {
          loadedCount++
        })

        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter

        const material = new THREE.MeshLambertMaterial({
          map: texture,
          side: THREE.DoubleSide,
        })

        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(400, 250), material)
        mesh.castShadow = true
        mesh.receiveShadow = true

        const angle = i * angleStep
        mesh.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
        mesh.lookAt(0, 0, 0)

        // 添加发光边框
        const borderGeometry = new THREE.PlaneGeometry(420, 270)
        const borderMaterial = new THREE.MeshBasicMaterial({
          color: 0x4ecdc4,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide,
        })
        const border = new THREE.Mesh(borderGeometry, borderMaterial)
        border.position.copy(mesh.position)
        border.lookAt(0, 0, 0)
        border.position.add(mesh.position.clone().normalize().multiplyScalar(-2))

        group.add(mesh)
        group.add(border)
      })
    }

    // 添加灯光
    function addLighting() {
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
      scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(100, 100, 50)
      directionalLight.castShadow = true
      directionalLight.shadow.mapSize.width = 2048
      directionalLight.shadow.mapSize.height = 2048
      scene.add(directionalLight)

      // 添加彩色点光源
      const pointLight1 = new THREE.PointLight(0xff6b6b, 0.5, 1000)
      pointLight1.position.set(500, 200, 0)
      scene.add(pointLight1)

      const pointLight2 = new THREE.PointLight(0x4ecdc4, 0.5, 1000)
      pointLight2.position.set(-500, 200, 0)
      scene.add(pointLight2)
    }

    // 开始动画
    function startAnimation() {
      const totalDuration = 6

      // 相机飞入动画
      gsap.to(camera.position, {
        x: 0,
        y: 100,
        z: 0,
        duration: totalDuration,
        ease: "power4.out",
      })

      // 画廊 Y 轴旋转动画
      gsap.to(group.rotation, {
        y: "+=" + Math.PI * 2,
        duration: totalDuration,
        ease: "power4.out",
        onComplete: () => {
          gsap.to(group.rotation, {
            y: "+=" + Math.PI * 4,
            duration: 60,
            ease: "none",
            repeat: -1,
          })
        },
      })

      // 画廊 X 轴旋转动画
      gsap.to(group.rotation, {
        x: 0,
        duration: totalDuration,
        ease: "power4.out",
      })
    }

    // 事件监听
    function addEventListeners() {
      const canvas = renderer.domElement

      function onMouseDown(event: MouseEvent) {
        if (!isLoaded) return
        mousePressed = true
        sceneRef.current.mousePressed = true
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
      }

      function onMouseMove(event: MouseEvent) {
        if (!isLoaded || !mousePressed) return

        const deltaX = (event.clientX / window.innerWidth) * 2 - 1 - mouse.x
        const deltaY = -(event.clientY / window.innerHeight) * 2 + 1 - mouse.y

        if (group) {
          group.rotation.y += deltaX * 2
          group.rotation.x += deltaY * 0.5
        }

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
      }

      function onMouseUp() {
        mousePressed = false
        sceneRef.current.mousePressed = false
      }

      function onMouseWheel(event: WheelEvent) {
        if (!isLoaded) return

        const delta = event.deltaY
        const zoomSpeed = 50

        camera.position.z += delta > 0 ? zoomSpeed : -zoomSpeed
        camera.position.z = Math.max(50, Math.min(2000, camera.position.z))
      }

      function onKeyDown(event: KeyboardEvent) {
        if (!isLoaded) return

        if (event.code === "Space") {
          event.preventDefault()
          // 重置视角
          gsap.to(camera.position, {
            x: 0,
            y: 100,
            z: 0,
            duration: 2,
            ease: "power2.inOut",
          })
          if (group) {
            gsap.to(group.rotation, {
              x: 0,
              y: 0,
              duration: 2,
              ease: "power2.inOut",
            })
          }
        }
      }

      function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }

      canvas.addEventListener("mousedown", onMouseDown)
      canvas.addEventListener("mousemove", onMouseMove)
      canvas.addEventListener("mouseup", onMouseUp)
      canvas.addEventListener("wheel", onMouseWheel)
      document.addEventListener("keydown", onKeyDown)
      window.addEventListener("resize", onWindowResize)

      // 清理函数
      return () => {
        canvas.removeEventListener("mousedown", onMouseDown)
        canvas.removeEventListener("mousemove", onMouseMove)
        canvas.removeEventListener("mouseup", onMouseUp)
        canvas.removeEventListener("wheel", onMouseWheel)
        document.removeEventListener("keydown", onKeyDown)
        window.removeEventListener("resize", onWindowResize)
      }
    }

    // 渲染循环
    function animate() {
      const animationId = requestAnimationFrame(animate)
      sceneRef.current.animationId = animationId

      if (isLoaded) {
        const time = Date.now() * 0.001
        if (particles) {
          particles.rotation.y = time * 0.1
          particles.rotation.x = time * 0.05
        }

        if (starField) {
          starField.rotation.y = time * 0.02
        }
      }

      renderer.render(scene, camera)
    }

    // 启动
    init()
    const cleanup = addEventListeners()
    animate()

    // 清理函数
    return () => {
      cleanup?.()
      if (sceneRef.current.animationId) {
        cancelAnimationFrame(sceneRef.current.animationId)
      }
      if (renderer) {
        mountRef.current?.removeChild(renderer.domElement)
        renderer.dispose()
      }
    }
  }, [isLoaded])

  return (
    <div className="relative w-full h-full">
      {/* 3D Canvas 容器 */}
      <div ref={mountRef} className="w-full h-full" />

      {/* 加载界面 */}
      {!isLoaded && (
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col justify-center items-center z-50 transition-opacity duration-500">
          <div className="text-2xl mb-5 text-white font-semibold animate-pulse">Loading Gallery...</div>
          <div className="w-80 h-1.5 bg-white/20 rounded-full overflow-hidden mb-2.5">
            <div
              className="h-full bg-gradient-to-r from-red-400 to-teal-400 transition-all duration-300 shadow-lg shadow-white/50"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <div className="text-sm text-white/80">{Math.round(loadingProgress)}%</div>
        </div>
      )}

      {/* 控制提示 */}
      {isLoaded && (
        <div className="fixed bottom-5 left-5 bg-black/70 text-white p-4 rounded-lg text-sm leading-relaxed backdrop-blur-md border border-white/10 transition-opacity duration-500">
          <div className="font-bold mb-2">Controls:</div>
          <div>🖱️ Drag: Rotate view</div>
          <div>🔍 Scroll: Zoom in/out</div>
          <div>⌨️ Space: Reset view</div>
        </div>
      )}
    </div>
  )
}
