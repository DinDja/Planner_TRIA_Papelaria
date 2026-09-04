'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

type InfiniteBookProps = {
  ready?: boolean
}

function createPageTexture(side: 'front' | 'back') {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 640

  const context = canvas.getContext('2d')
  if (!context) return null

  context.fillStyle = '#ddd6c6'
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.strokeStyle = '#d1bdb8'
  context.lineWidth = 3
  context.strokeRect(30, 30, 452, 580)

  context.fillStyle = '#6a634d'
  context.font = '600 18px Georgia, serif'
  context.fillText(side === 'front' ? 'PLANOS' : 'MEMÓRIAS', 52, 76)

  const lineWidths =
    side === 'front'
      ? [342, 296, 366, 318, 250, 350, 282, 372, 324, 268, 354, 306, 224, 340]
      : [278, 354, 316, 370, 244, 330, 286, 362, 300, 346, 260, 320, 374, 236]

  lineWidths.forEach((width, index) => {
    const y = 112 + index * 31
    context.fillStyle = index === 0 || index === 7 ? '#b76f06' : '#d1bdb8'
    context.fillRect(52, y, width, index === 0 || index === 7 ? 5 : 3)
  })

  context.fillStyle = '#6a634d'
  context.font = '16px Georgia, serif'
  context.textAlign = 'center'
  context.fillText(side === 'front' ? '01' : '∞', 256, 585)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

export function InfiniteBook({ ready = true }: InfiniteBookProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80)
    camera.position.set(0, 8.5, 12)

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    } catch {
      return
    }

    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.setAttribute('aria-hidden', 'true')
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.touchAction = 'pan-y'
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.enablePan = false
    controls.enableZoom = false
    controls.rotateSpeed = 0.42
    controls.minPolarAngle = 0.55
    controls.maxPolarAngle = 1.36
    controls.minAzimuthAngle = -0.7
    controls.maxAzimuthAngle = 0.7
    controls.target.set(0, 0, 0.15)

    scene.add(new THREE.HemisphereLight(0xfffbef, 0x655f58, 2.2))

    const keyLight = new THREE.DirectionalLight(0xfff3d8, 4.2)
    keyLight.position.set(2.5, 9, 7)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(1024, 1024)
    keyLight.shadow.camera.near = 1
    keyLight.shadow.camera.far = 28
    keyLight.shadow.camera.left = -7
    keyLight.shadow.camera.right = 7
    keyLight.shadow.camera.top = 7
    keyLight.shadow.camera.bottom = -7
    keyLight.shadow.bias = -0.0004
    scene.add(keyLight)

    const rimLight = new THREE.PointLight(0xc9b7ff, 10, 24)
    rimLight.position.set(-6, 3, 5)
    scene.add(rimLight)

    const book = new THREE.Group()
    book.rotation.x = -0.16
    book.rotation.z = -0.035
    scene.add(book)

    const bookWidth = 4.35
    const bookHeight = 5.8
    const coverThickness = 0.13
    const pageThickness = 0.38

    const coverMaterial = new THREE.MeshStandardMaterial({
      color: 0x272421,
      roughness: 0.48,
      metalness: 0.04,
    })
    const pageEdgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8cdae,
      roughness: 0.95,
    })
    const frontTexture = createPageTexture('front')
    const backTexture = createPageTexture('back')
    const frontMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: frontTexture,
      roughness: 0.9,
    })
    const backMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: backTexture,
      roughness: 0.9,
    })

    const spineGeometry = new THREE.BoxGeometry(0.74, bookHeight + 0.28, coverThickness)
    const spine = new THREE.Mesh(spineGeometry, coverMaterial)
    spine.position.z = -coverThickness / 2
    spine.castShadow = true
    book.add(spine)

    const rightCoverGeometry = new THREE.BoxGeometry(bookWidth, bookHeight + 0.28, coverThickness)
    rightCoverGeometry.translate(bookWidth / 2, 0, 0)
    const rightCover = new THREE.Mesh(rightCoverGeometry, coverMaterial)
    rightCover.position.set(0.36, 0, -coverThickness / 2)
    rightCover.rotation.y = 0.055
    rightCover.castShadow = true
    rightCover.receiveShadow = true
    book.add(rightCover)

    const leftCoverGeometry = new THREE.BoxGeometry(bookWidth, bookHeight + 0.28, coverThickness)
    leftCoverGeometry.translate(-bookWidth / 2, 0, 0)
    const leftCover = new THREE.Mesh(leftCoverGeometry, coverMaterial)
    leftCover.position.set(-0.36, 0, -coverThickness / 2)
    leftCover.rotation.y = -0.055
    leftCover.castShadow = true
    leftCover.receiveShadow = true
    book.add(leftCover)

    const pageBlockMaterials = [
      pageEdgeMaterial,
      pageEdgeMaterial,
      pageEdgeMaterial,
      pageEdgeMaterial,
      frontMaterial,
      pageEdgeMaterial,
    ]

    const rightBlockGeometry = new THREE.BoxGeometry(bookWidth - 0.18, bookHeight, pageThickness)
    rightBlockGeometry.translate((bookWidth - 0.18) / 2, 0, pageThickness / 2)
    const rightBlock = new THREE.Mesh(rightBlockGeometry, pageBlockMaterials)
    rightBlock.position.set(0.28, 0, 0)
    rightBlock.rotation.y = 0.025
    rightBlock.receiveShadow = true
    book.add(rightBlock)

    const leftBlockGeometry = new THREE.BoxGeometry(bookWidth - 0.18, bookHeight, pageThickness)
    leftBlockGeometry.translate(-(bookWidth - 0.18) / 2, 0, pageThickness / 2)
    const leftBlock = new THREE.Mesh(leftBlockGeometry, [
      pageEdgeMaterial,
      pageEdgeMaterial,
      pageEdgeMaterial,
      pageEdgeMaterial,
      backMaterial,
      pageEdgeMaterial,
    ])
    leftBlock.position.set(-0.28, 0, 0)
    leftBlock.rotation.y = -0.025
    leftBlock.receiveShadow = true
    book.add(leftBlock)

    const animatedPages: THREE.Mesh[] = []
    const pageGeometry = new THREE.BoxGeometry(bookWidth - 0.18, bookHeight, 0.018)
    pageGeometry.translate((bookWidth - 0.18) / 2, 0, 0)

    for (let index = 0; index < 5; index += 1) {
      const page = new THREE.Mesh(pageGeometry, [
        pageEdgeMaterial,
        pageEdgeMaterial,
        pageEdgeMaterial,
        pageEdgeMaterial,
        frontMaterial,
        backMaterial,
      ])
      page.position.set(0, 0, pageThickness + 0.025)
      page.castShadow = true
      page.receiveShadow = true
      page.userData = { phaseOffset: index / 5 }
      book.add(page)
      animatedPages.push(page)
    }

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 18),
      new THREE.ShadowMaterial({ color: 0x171411, opacity: 0.16 }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -3.18
    floor.receiveShadow = true
    scene.add(floor)

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const timer = new THREE.Timer()
    timer.connect(document)
    let frame = 0
    let visible = true

    const easeInOut = (value: number) =>
      value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2

    const setStaticPages = () => {
      animatedPages.forEach((page, index) => {
        page.visible = index === 0
        if (index === 0) {
          page.rotation.set(0, -Math.PI * 0.42, 0.08)
          page.position.set(0.02, 0, pageThickness + 0.62)
        }
      })
    }

    const render = (timestamp?: number) => {
      frame = requestAnimationFrame(render)
      timer.update(timestamp)
      if (!visible) return

      const elapsed = timer.getElapsed()
      if (reduceMotion.matches) {
        setStaticPages()
        book.position.y = 0
      } else {
        const globalPhase = (elapsed * 0.22) % 1
        animatedPages.forEach((page) => {
          const localPhase = (globalPhase + (page.userData.phaseOffset as number)) % 1
          const visibleThreshold = 0.76

          if (localPhase >= visibleThreshold) {
            page.visible = false
            return
          }

          page.visible = true
          const progress = localPhase / visibleThreshold
          const eased = easeInOut(progress)
          page.rotation.y = 0.025 + (-Math.PI - 0.05) * eased
          page.rotation.z = Math.sin(progress * Math.PI) * 0.12
          page.position.x = 0.28 - 0.56 * eased
          page.position.z = pageThickness + 0.025 + Math.sin(progress * Math.PI) * 0.62
        })
        book.position.y = Math.sin(elapsed * 1.15) * 0.06
      }

      controls.update()
      renderer.render(scene, camera)
    }

    const resize = () => {
      const width = Math.max(container.clientWidth, 1)
      const height = Math.max(container.clientHeight, 1)
      camera.aspect = width / height
      camera.fov = width < 500 ? 44 : 38
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    visibilityObserver.observe(container)

    resize()
    render()

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      controls.dispose()
      timer.dispose()

      const geometries = new Set<THREE.BufferGeometry>()
      const materials = new Set<THREE.Material>()
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        geometries.add(object.geometry)
        const objectMaterials = Array.isArray(object.material) ? object.material : [object.material]
        objectMaterials.forEach((material) => materials.add(material))
      })
      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((material) => material.dispose())
      frontTexture?.dispose()
      backTexture?.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Livro aberto com páginas virando continuamente"
      className="h-full w-full cursor-grab active:cursor-grabbing"
      style={{
        opacity: ready ? 1 : 0,
        filter: ready ? 'blur(0px)' : 'blur(18px)',
        transform: ready ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.92)',
        transition:
          'opacity 1.1s cubic-bezier(0.16,1,0.3,1) 180ms, filter 1.1s cubic-bezier(0.16,1,0.3,1) 180ms, transform 1.1s cubic-bezier(0.16,1,0.3,1) 180ms',
      }}
    />
  )
}
