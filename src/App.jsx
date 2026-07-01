import { animate, stagger } from 'animejs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  ChevronLeft,
  Clock3,
  Gem,
  Image as ImageIcon,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Play,
  Search,
  Shield,
  Sparkles,
  X,
} from 'lucide-react'
import { contact, featuredProduct, products } from './data/products'

const isDarkAsset = (src) => src.includes('/edited-images/')

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function useScrollReveal(rootRef, dependencies = []) {
  useEffect(() => {
    const root = rootRef.current
    if (!root || prefersReducedMotion()) return

    const animateNode = (node) => {
      if (!node || node.dataset.revealed === '1') return
      node.dataset.revealed = '1'

      const isStagger = node.classList.contains('reveal-stagger')
      const isCard = node.classList.contains('reveal-card')
      const revealY = clamp(parseFloat(node.dataset.revealY) || (isCard ? 18 : 16), -120, 120)
      const revealX = clamp(parseFloat(node.dataset.revealRotateX) || (isCard ? 6 : 0), -30, 30)
      const revealZ = clamp(parseFloat(node.dataset.revealRotateZ) || 0, -40, 40)
      const duration = clamp(parseFloat(node.dataset.revealDuration) || (isCard ? 650 : 560), 140, 900)
      const baseTranslateZ = isCard ? 20 : 0

      animate(node, {
        opacity: [0, 1],
        translateY: [revealY, 0],
        rotateX: [revealX, 0],
        rotateY: [clamp(parseFloat(node.dataset.revealRotateY) || 0, -30, 30), 0],
        translateZ: [baseTranslateZ + revealZ, 0],
        filter: ['blur(8px)', 'blur(0px)'],
        duration,
        easing: 'outCubic',
      })

      if (isStagger) {
        animate(Array.from(node.children), {
          opacity: [0, 1],
          translateY: [14, 0],
          rotateX: [2, 0],
          filter: ['blur(6px)', 'blur(0px)'],
          duration: clamp(parseFloat(node.dataset.revealDuration) || 520, 140, 700),
          easing: 'outCubic',
          delay: stagger(64),
        })
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          animateNode(entry.target)
          observer.unobserve(entry.target)
        })
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -10% 0px',
      },
    )

    const revealNodes = Array.from(
      root.querySelectorAll('.reveal-up, .reveal-stagger, .reveal-card'),
    )
    revealNodes.forEach((node) => {
      observer.observe(node)
    })

    requestAnimationFrame(() => {
      revealNodes.forEach((node) => {
        const rect = node.getBoundingClientRect()
        if (rect.top < window.innerHeight * 0.88 && rect.bottom > 0) {
          animateNode(node)
          observer.unobserve(node)
        }
      })
    })

    return () => observer.disconnect()
  }, [rootRef, ...dependencies])
}

function useScrollParallax(rootRef, dependencies = []) {
  useEffect(() => {
    const root = rootRef.current
    if (!root || prefersReducedMotion()) return

    const layers = Array.from(root.querySelectorAll('[data-parallax-speed]'))
    if (!layers.length) return

    let frameId = 0
    const maxShift = 42
    const maxDepth = 28
    const maxRotate = 10

    const applyParallax = () => {
      const viewportHeight = window.innerHeight

      layers.forEach((layer) => {
        const bounds = layer.getBoundingClientRect()

        if (bounds.bottom < -viewportHeight * 0.25 || bounds.top > viewportHeight * 1.35) {
          return
        }

        const speed = clamp(parseFloat(layer.dataset.parallaxSpeed) || 0.08, 0, 2.5)
        const axis = layer.dataset.parallaxAxis || 'y'
        const direction = layer.dataset.parallaxDirection || 'normal'
        const rotateLevel = clamp(parseFloat(layer.dataset.parallaxRotate) || 0, 0, 2)
        const rotateAxis = layer.dataset.parallaxRotateAxis || 'both'
        const depthLevel = clamp(parseFloat(layer.dataset.parallaxDepth) || 0, 0, 2.5)
        const anchor = (viewportHeight - bounds.top) / (viewportHeight + bounds.height)
        const rawShift = (anchor - 0.5) * 2 * maxShift * speed
        const shift = direction === 'reverse' ? -rawShift : rawShift

        const depthShift = (anchor - 0.5) * 2 * maxDepth * depthLevel * speed
        const rawRotate = (anchor - 0.5) * 2 * maxRotate * rotateLevel
        const rotateX = rotateAxis === 'y' ? 0 : rawRotate
        const rotateY = rotateAxis === 'x' ? 0 : -rawRotate

        const x = axis === 'x' ? `${shift.toFixed(2)}px` : '0px'
        const y = axis === 'y' ? `${shift.toFixed(2)}px` : '0px'

        layer.style.setProperty('--scroll-parallax-x', x)
        layer.style.setProperty('--scroll-parallax-y', y)
        layer.style.setProperty('--scroll-parallax-z', `${depthShift.toFixed(2)}px`)
        layer.style.setProperty('--scroll-parallax-rotate-x', `${rotateX.toFixed(2)}deg`)
        layer.style.setProperty('--scroll-parallax-rotate-y', `${rotateY.toFixed(2)}deg`)
      })

      frameId = 0
    }

    const onFrame = () => {
      if (frameId) return
      frameId = requestAnimationFrame(applyParallax)
    }

    window.addEventListener('scroll', onFrame, { passive: true })
    window.addEventListener('resize', onFrame, { passive: true })
    onFrame()

    return () => {
      window.removeEventListener('scroll', onFrame)
      window.removeEventListener('resize', onFrame)
      cancelAnimationFrame(frameId)
    }
  }, [rootRef, ...dependencies])
}

function usePointerTilt({ intensity = 14, lift = 6 } = {}) {
  const frameRef = useRef(0)

  const onPointerMove = useCallback(
    (event) => {
      if (!event.currentTarget || prefersReducedMotion()) return

      const element = event.currentTarget
      const bounds = element.getBoundingClientRect()

      cancelAnimationFrame(frameRef.current)
      frameRef.current = requestAnimationFrame(() => {
        const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2
        const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2

        const rotateX = clamp(-y * intensity, -20, 20)
        const rotateY = clamp(x * intensity, -20, 20)
        const translateZ = clamp((Math.abs(x) + Math.abs(y)) * lift, 0, lift + 6)

        element.style.setProperty('--tilt-x', `${rotateX.toFixed(2)}deg`)
        element.style.setProperty('--tilt-y', `${rotateY.toFixed(2)}deg`)
        element.style.setProperty('--tilt-z', `${translateZ.toFixed(2)}px`)
        element.style.setProperty('--spot-x', `${(50 + x * 45).toFixed(0)}%`)
        element.style.setProperty('--spot-y', `${(50 + y * 45).toFixed(0)}%`)
        element.style.setProperty('--gloss', '1')
      })
    },
    [intensity, lift],
  )

  const onPointerLeave = useCallback((event) => {
    const element = event.currentTarget
    if (!element) return

    cancelAnimationFrame(frameRef.current)
    element.style.setProperty('--tilt-x', '0deg')
    element.style.setProperty('--tilt-y', '0deg')
    element.style.setProperty('--tilt-z', '0px')
    element.style.setProperty('--spot-x', '50%')
    element.style.setProperty('--spot-y', '50%')
    element.style.setProperty('--gloss', '0')
  }, [])

  useEffect(
    () => () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    },
    [],
  )

  return {
    onPointerMove,
    onPointerLeave,
  }
}

function useSpinRotate({
  sensitivity = 0.38,
  clickThreshold = 10,
  resetAngle = 0,
} = {}) {
  const stateRef = useRef({
    isDown: false,
    angle: resetAngle,
    startX: 0,
    lastX: 0,
    totalDelta: 0,
    pointerId: null,
    target: null,
    suppressClick: false,
  })

  const syncAngle = useCallback((target, angle) => {
    if (!target) return
    target.style.setProperty('--spin-rotate', `${((angle % 360) + 360).toFixed(2)}deg`)
  }, [])

  const onPointerMove = useCallback(
    (event) => {
      const state = stateRef.current
      if (!state.isDown || !state.target || state.pointerId !== event.pointerId) return
      const delta = event.clientX - state.lastX
      state.lastX = event.clientX
      state.totalDelta += Math.abs(delta)
      state.angle += delta * sensitivity
      syncAngle(state.target, state.angle)
      state.suppressClick = state.suppressClick || state.totalDelta > clickThreshold
    },
    [sensitivity, clickThreshold, syncAngle],
  )

  const onPointerUp = useCallback(() => {
    const state = stateRef.current
    if (!state.isDown) return

    state.isDown = false
    state.pointerId = null
    state.lastX = 0
    state.totalDelta = 0
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
  }, [onPointerMove])

  const onPointerDown = useCallback(
    (event) => {
      if (prefersReducedMotion() || event.button !== undefined && event.button !== 0) return

      const target = event.currentTarget
      stateRef.current = {
        isDown: true,
        angle: stateRef.current.angle,
        startX: event.clientX,
        lastX: event.clientX,
        totalDelta: 0,
        pointerId: event.pointerId,
        target,
        suppressClick: false,
      }

      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
      window.addEventListener('pointercancel', onPointerUp)
      event.preventDefault()
    },
    [onPointerMove, onPointerUp],
  )

  const onPointerLeave = useCallback(() => {
    onPointerUp()
  }, [onPointerUp])

  const shouldSuppressNextClick = useCallback(() => {
    const state = stateRef.current
    if (!state.suppressClick) return false
    state.suppressClick = false
    return true
  }, [])

  const reset = useCallback((target) => {
    stateRef.current.angle = resetAngle
    syncAngle(target, resetAngle)
  }, [resetAngle, syncAngle])

  useEffect(() => () => onPointerUp(), [onPointerUp])

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
    shouldSuppressNextClick,
    reset,
  }
}

function App() {
  const [selectedProduct, setSelectedProduct] = useState(featuredProduct)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [lightboxImage, setLightboxImage] = useState('')
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const detailRef = useRef(null)
  const detailSectionRef = useRef(null)
  const pageRef = useRef(null)
  const lightboxFrameTilt = usePointerTilt({ intensity: 16, lift: 16 })

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return products
    return products.filter((product) =>
      [product.name, product.category, product.origin, product.meaning]
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [query])

  const showProduct = (product, shouldScroll = true) => {
    setSelectedProduct(product)
    if (shouldScroll) {
      requestAnimationFrame(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }

  const scrollTo = (id) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const openLightbox = (image) => {
    setLightboxImage(image)
    setIsLightboxOpen(true)
  }

  const closeLightbox = () => {
    setIsLightboxOpen(false)
    setLightboxImage('')
  }

  useEffect(() => {
    if (!isLightboxOpen) return

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeLightbox()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isLightboxOpen])

  useEffect(() => {
    const root = pageRef.current
    if (!root || prefersReducedMotion()) return

    animate(root.querySelector('.site-header'), {
      opacity: [0, 1],
      translateY: ['-12px', 0],
      duration: 700,
      easing: 'outQuart',
    })
  }, [])

  useScrollReveal(pageRef, [filteredProducts.length])
  useScrollParallax(pageRef, [filteredProducts.length])

  useEffect(() => {
    const root = pageRef.current
    if (!root || !isLightboxOpen || prefersReducedMotion()) return
    const overlay = root.querySelector('.lightbox')
    const frame = root.querySelector('.lightbox-frame')

    if (!overlay || !frame) return

    animate(overlay, {
      opacity: [0, 1],
      duration: 240,
      easing: 'outCubic',
    })

    animate(frame, {
      opacity: [0, 1],
      scale: [0.94, 1],
      rotateX: [6, 0],
      duration: 420,
      easing: 'outCubic',
    })
  }, [isLightboxOpen])

  return (
    <div className="app-shell js-animate" ref={pageRef}>
      <Header
        query={query}
        setQuery={setQuery}
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        onNavigate={scrollTo}
      />
      <main>
        <Hero onExplore={() => scrollTo('collection')} />
        <Collection
          products={filteredProducts}
          selectedProduct={selectedProduct}
          query={query}
          onSelect={showProduct}
          onClearSearch={() => setQuery('')}
        />
        <DetailSection
          refNode={detailRef}
          sectionRef={detailSectionRef}
          product={selectedProduct}
          onOpenGallery={openLightbox}
          relatedProducts={products.filter((item) => item.id !== selectedProduct.id).slice(0, 3)}
          onSelect={showProduct}
        />
        <TrustBand />
        <StoryBand />
        <ContactBand />
      </main>
      <a className="floating-consult button secondary" href={contact.zalo} target="_blank" rel="noreferrer">
        Tư vấn nhanh
      </a>
      {isLightboxOpen && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={closeLightbox}>
          <button className="lightbox-close icon-button" aria-label="Đóng xem ảnh" onClick={closeLightbox}>
            <X size={22} />
          </button>
          <div
            className="lightbox-frame"
            onClick={(event) => event.stopPropagation()}
            onPointerMove={lightboxFrameTilt.onPointerMove}
            onPointerLeave={lightboxFrameTilt.onPointerLeave}
          >
            <img src={lightboxImage} alt={selectedProduct.name} />
          </div>
        </div>
      )}
      <Footer />
    </div>
  )
}

function Header({
  query,
  setQuery,
  searchOpen,
  setSearchOpen,
  menuOpen,
  setMenuOpen,
  onNavigate,
}) {
  const nav = [
    ['Bộ sưu tập', 'collection'],
    ['Thiên châu', 'detail'],
    ['Cam kết', 'trust'],
    ['Câu chuyện', 'story'],
    ['Liên hệ', 'contact'],
  ]

  return (
    <header className="site-header">
      <button className="icon-button mobile-only" aria-label="Mở menu" onClick={() => setMenuOpen(true)}>
        <Menu size={24} />
      </button>
      <button className="brand" onClick={() => onNavigate('top')} aria-label="Lama Beads home">
        Lama Beads
      </button>
      <nav className="desktop-nav" aria-label="Chính">
        {nav.map(([label, target]) => (
          <button key={target} onClick={() => onNavigate(target)}>
            {label}
          </button>
        ))}
      </nav>
      <div className="header-actions">
        {searchOpen && (
          <label className="search-field">
            <Search size={16} />
            <input
              autoFocus
              value={query}
              placeholder="Tìm chuỗi, Dzi..."
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        )}
        <button
          className="icon-button"
          aria-label={searchOpen ? 'Đóng tìm kiếm' : 'Mở tìm kiếm'}
          onClick={() => setSearchOpen((value) => !value)}
        >
          {searchOpen ? <X size={20} /> : <Search size={20} />}
        </button>
      </div>
      {menuOpen && (
        <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="mobile-menu-top">
            <span className="brand mobile-brand">Lama Beads</span>
            <button className="icon-button" aria-label="Đóng menu" onClick={() => setMenuOpen(false)}>
              <X size={22} />
            </button>
          </div>
          {nav.map(([label, target]) => (
            <button key={target} className="mobile-menu-link" onClick={() => onNavigate(target)}>
              {label}
              <ArrowRight size={18} />
            </button>
          ))}
        </div>
      )}
    </header>
  )
}

function Hero({ onExplore }) {
  const mediaTilt = usePointerTilt({ intensity: 18, lift: 10 })

  return (
    <section className="hero" id="top">
      <span
        className="hero-orb hero-orb-left parallax-layer"
        data-parallax-speed="1.2"
        data-parallax-axis="x"
        data-parallax-depth="1"
        data-parallax-rotate="0.22"
        data-parallax-rotate-axis="both"
        aria-hidden="true"
      />
      <span
        className="hero-orb hero-orb-right parallax-layer"
        data-parallax-speed="0.85"
        data-parallax-axis="x"
        data-parallax-direction="reverse"
        data-parallax-depth="1"
        data-parallax-rotate="0.18"
        data-parallax-rotate-axis="both"
        aria-hidden="true"
      />
      <div
        className="hero-copy reveal-up parallax-layer"
        data-parallax-speed="0.55"
        data-parallax-axis="y"
        data-parallax-direction="reverse"
        data-parallax-depth="0.5"
        data-parallax-rotate="0.16"
        data-parallax-rotate-axis="x"
        data-reveal-rotate-y="8"
        data-reveal-rotate-x="6"
      >
        <p className="section-kicker">Thương hiệu trang sức từ chất liệu thiêng</p>
        <h1>Lama Beads</h1>
        <p>Trang sức chuỗi hạt thiêng từ Tây Tạng, Nepal và Bhutan. Mỗi món được chọn để giữ lại vẻ đẹp tự nhiên, năng lượng an lành và câu chuyện riêng.</p>
        <div className="hero-actions reveal-stagger">
          <button className="button primary" onClick={onExplore}>
            Xem bộ sưu tập
          </button>
          <a className="button secondary" href={contact.zalo} target="_blank" rel="noreferrer">
            Liên hệ tư vấn
          </a>
        </div>
        <p className="hero-note">Giảm nhẹ ánh sáng, tập trung vào đường vân và bề mặt thiên nhiên trên từng hạt.</p>
      </div>
      <div
        className="hero-media-stage parallax-layer"
        data-parallax-speed="0.28"
        data-parallax-axis="x"
        data-parallax-depth="0.45"
        data-parallax-rotate="0.12"
        data-parallax-rotate-axis="both"
      >
        <span className="hero-stage-orbit orbit-a" aria-hidden="true" />
        <span className="hero-stage-orbit orbit-b" aria-hidden="true" />
        <div
          className="hero-media reveal-up"
          data-reveal-rotate-y="-4"
          data-reveal-rotate-x="4"
          data-parallax-speed="0.35"
          data-parallax-axis="y"
          data-parallax-depth="0.8"
          data-parallax-rotate="0.24"
          data-parallax-rotate-axis="y"
          onPointerMove={mediaTilt.onPointerMove}
          onPointerLeave={mediaTilt.onPointerLeave}
          aria-label="Thiên châu Lama Beads"
        >
          <span className="hero-media-glow" aria-hidden="true" />
          <img src="/assets/gamma-export/images/generated-images/Cr9kBe1hknLl2ryOjIzI_.png" alt="Thiên châu Dzi Lama Beads" />
        </div>
      </div>
      <button className="scroll-cue" onClick={onExplore} aria-label="Xuống bộ sưu tập">
        <ArrowRight size={22} />
      </button>
    </section>
  )
}

function Collection({ products, selectedProduct, query, onSelect, onClearSearch }) {
  return (
    <section className="collection section" id="collection">
      <div className="section-heading reveal-up">
        <div>
          <p className="section-kicker">Bộ sưu tập</p>
          <h2>Mỗi chuỗi hạt là một câu chuyện</h2>
        </div>
        <button className="text-link" onClick={onClearSearch}>
          {query ? 'Xem tất cả' : 'Tất cả sản phẩm'} <ArrowRight size={16} />
        </button>
      </div>
      <p className="collection-note reveal-up">
        Lọc theo nhu cầu của bạn, chọn một sản phẩm để xem chi tiết kết cấu, chất liệu và hướng dẫn phối.
      </p>
      {products.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có sản phẩm phù hợp với từ khóa hiện tại.</p>
          <button className="button secondary" onClick={onClearSearch}>
            Xem lại bộ sưu tập
          </button>
        </div>
      ) : (
        <div
          className="product-grid reveal-stagger parallax-layer"
          data-parallax-speed="0.16"
          data-parallax-axis="y"
          data-parallax-direction="reverse"
          data-parallax-depth="0.9"
          data-parallax-rotate="0.08"
          data-parallax-rotate-axis="both"
        >
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              depthIndex={index}
              active={product.id === selectedProduct.id}
              onSelect={() => onSelect(product)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function ProductCard({ product, active, onSelect, depthIndex = 0 }) {
  const cardTilt = usePointerTilt({ intensity: 12, lift: 6 })
  const cardDepth = `${6 + (depthIndex % 3) * 8}px`

  return (
    <button
      className={`product-card reveal-card ${active ? 'is-active' : ''}`}
      data-testid={`product-card-${product.id}`}
      style={{ '--card-depth': cardDepth, '--card-angle': `${((depthIndex % 2) ? '-1.25deg' : '0.9deg')}` }}
      onClick={onSelect}
      onPointerMove={cardTilt.onPointerMove}
      onPointerLeave={cardTilt.onPointerLeave}
    >
      <span className={`product-image ${isDarkAsset(product.previewImage) ? 'dark-source' : ''}`}>
        <img src={product.previewImage} alt={product.name} loading="lazy" />
      </span>
      <span className="product-copy">
        <span>
          <strong>{product.name}</strong>
          <small>{product.category}</small>
          <small className="availability">{product.availability}</small>
        </span>
        <ArrowRight size={17} />
      </span>
    </button>
  )
}

function DetailSection({ refNode, sectionRef, product, relatedProducts, onSelect, onOpenGallery }) {
  const [activeImage, setActiveImage] = useState(product.galleryImages[0])
  const mainImageTilt = usePointerTilt({ intensity: 9, lift: 10 })
  const mainImageSpin = useSpinRotate({
    sensitivity: 0.44,
    clickThreshold: 10,
  })
  const mainImageRef = useRef(null)
  const mainImageFrameRef = useRef(null)
  const sectionHeadingRef = useRef(null)
  const detailSectionRef = sectionRef || refNode
  const hasVideo = product.videos.length > 0

  useEffect(() => {
    setActiveImage(product.galleryImages[0])
    mainImageSpin.reset(mainImageFrameRef.current)
  }, [product])

  useEffect(() => {
    const root = detailSectionRef?.current
    if (!root || prefersReducedMotion()) return

    animate(root.querySelector('.detail-gallery'), {
      opacity: [0, 1],
      translateX: [-18, 0],
      rotateY: [-4, 0],
      translateZ: [18, 0],
      duration: 560,
      easing: 'outCubic',
    })

    animate(root.querySelector('.detail-copy'), {
      opacity: [0, 1],
      translateY: [26, 0],
      rotateX: [4, 0],
      translateZ: [18, 0],
      duration: 540,
      easing: 'outCubic',
    })

    const specRows = Array.from(root.querySelectorAll('.spec-row'))
    if (specRows.length) {
      animate(specRows, {
        opacity: [0, 1],
        filter: ['blur(6px)', 'blur(0px)'],
        translateX: [14, 0],
        rotateY: [2.5, 0],
        duration: 360,
        easing: 'outCubic',
        delay: stagger(60),
      })
    }

    if (sectionHeadingRef.current) {
      animate(sectionHeadingRef.current, {
        opacity: [0, 1],
        translateY: [12, 0],
        duration: 420,
        easing: 'outCubic',
      })
    }
  }, [product.id, detailSectionRef])

  useEffect(() => {
    if (!mainImageRef.current || prefersReducedMotion()) return

    animate(mainImageRef.current, {
      opacity: [0, 1],
      scale: [0.97, 1],
      duration: 320,
      easing: 'outCubic',
    })
  }, [activeImage])

  useEffect(() => {
    mainImageSpin.reset(mainImageFrameRef.current)
  }, [activeImage, mainImageSpin])

  const handleMainImageClick = useCallback(() => {
    if (mainImageSpin.shouldSuppressNextClick()) return
    onOpenGallery(activeImage)
  }, [activeImage, onOpenGallery, mainImageSpin])

  const handleMainImagePointerMove = useCallback(
    (event) => {
      mainImageTilt.onPointerMove(event)
      mainImageSpin.onPointerMove(event)
    },
    [mainImageTilt, mainImageSpin],
  )

  const handleMainImagePointerLeave = useCallback(
    (event) => {
      mainImageTilt.onPointerLeave(event)
      mainImageSpin.onPointerLeave()
    },
    [mainImageTilt, mainImageSpin],
  )

  const specs = [
    [Gem, 'Chất liệu', product.materials],
    [MapPin, 'Nguồn gốc', product.origin],
    [Sparkles, 'Ý nghĩa', product.meaning],
    [Shield, 'Bảo quản', product.care],
  ]

  return (
    <section className="detail section" id="detail" ref={detailSectionRef}>
      <button className="back-link" onClick={() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })}>
        <ChevronLeft size={16} /> Bộ sưu tập
      </button>
      <div className="detail-layout reveal-stagger" ref={sectionHeadingRef}>
        <div
          className="detail-gallery parallax-layer"
          data-parallax-speed="0.18"
          data-parallax-axis="y"
          data-parallax-direction="normal"
          data-parallax-depth="0.7"
          data-parallax-rotate="0.06"
          data-parallax-rotate-axis="both"
        >
          <div className="thumb-rail">
            {product.galleryImages.map((image) => (
              <button
                key={image}
                className={image === activeImage ? 'thumb is-active' : 'thumb'}
                onClick={() => {
                  setActiveImage(image)
                  onOpenGallery(image)
                }}
                aria-label={`Xem hình ${product.name}`}
                type="button"
              >
                <img src={image} alt="" />
              </button>
            ))}
          </div>
          <button
            type="button"
            ref={mainImageFrameRef}
            className={`main-image ${isDarkAsset(activeImage) ? 'dark-source' : ''}`}
            onClick={handleMainImageClick}
            aria-label={`Mở ảnh phóng to ${product.name}`}
            onPointerDown={mainImageSpin.onPointerDown}
            onPointerMove={handleMainImagePointerMove}
            onPointerUp={mainImageSpin.onPointerUp}
            onPointerLeave={handleMainImagePointerLeave}
          >
            <img
              ref={mainImageRef}
              className="main-image-photo"
              src={activeImage}
              alt={product.name}
              key={activeImage}
            />
          </button>
        </div>
        <article className="detail-copy">
          <p className="detail-category">{product.category}</p>
          <h2 data-testid="detail-title">{product.name}</h2>
          <p className="detail-intro">{product.fullDescription}</p>
          <div className="detail-meta">
            <span>Mã: {product.id}</span>
            <span>{product.availability}</span>
            <span>{product.galleryImages.length} ảnh chi tiết</span>
          </div>
          <div className="spec-list">
            {specs.map(([Icon, label, value]) => (
              <div className="spec-row" key={label}>
                <Icon size={20} />
                <strong>{label}</strong>
                <span>{value}</span>
              </div>
            ))}
          </div>
          <div className="detail-actions reveal-stagger">
            <a className="button primary wide" href={contact.zalo} target="_blank" rel="noreferrer">
              Liên hệ tư vấn <MessageCircle size={18} />
            </a>
            <button className="text-link" onClick={() => document.getElementById('media')?.scrollIntoView({ behavior: 'smooth' })}>
              <ImageIcon size={17} /> Xem thêm hình ảnh
            </button>
          </div>
        </article>
      </div>
      <div
        className="media-related reveal-stagger parallax-layer"
        id="media"
        data-parallax-speed="0.12"
        data-parallax-axis="y"
        data-parallax-direction="reverse"
        data-parallax-depth="0.5"
        data-parallax-rotate="0.05"
        data-parallax-rotate-axis="x"
      >
        <div className="detail-photos">
          <div>
            <p className="section-kicker">Hình ảnh chi tiết</p>
            <h3>Góc nhìn gần của {product.name}</h3>
          </div>
          <div className="photo-strip">
            {product.galleryImages.slice(1).map((image) => (
              <button
                key={image}
                className={isDarkAsset(image) ? 'dark-source' : ''}
                onClick={() => {
                  setActiveImage(image)
                  onOpenGallery(image)
                }}
              >
                <img src={image} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
        {hasVideo && (
          <div className="video-card">
            <button className="play-button" aria-label="Phát video">
              <Play size={26} />
            </button>
          </div>
        )}
        <div className="related">
          <h3>Sản phẩm liên quan</h3>
          <div className="related-grid">
            {relatedProducts.map((item, index) => (
              <RelatedCard key={item.id} item={item} onSelect={onSelect} depthIndex={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function RelatedCard({ item, onSelect, depthIndex = 0 }) {
  const relatedTilt = usePointerTilt({ intensity: 10, lift: 8 })
  const cardDepth = `${6 + (depthIndex % 3) * 7}px`

  return (
    <button
      className="related-card"
      data-testid={`related-card-${item.id}`}
      style={{ '--card-depth': cardDepth, '--card-angle': `${((depthIndex % 2) ? '-1.15deg' : '0.85deg')}` }}
      onClick={() => onSelect(item)}
      onPointerMove={relatedTilt.onPointerMove}
      onPointerLeave={relatedTilt.onPointerLeave}
    >
      <img src={item.previewImage} alt={item.name} loading="lazy" />
      <span>{item.name}</span>
      <ArrowRight size={15} />
    </button>
  )
}

function TrustBand() {
  const values = [
    {
      title: 'Lựa chọn nguyên liệu',
      description: 'Hạt được đánh giá theo độ sâu vân, độ ổn định bề mặt và năng lượng tự nhiên.',
    },
    {
      title: 'Gia công thủ công',
      description: 'Dây, móc, lớp phủ và kết cấu được hoàn thiện để giữ form và độ bền lâu.',
    },
    {
      title: 'Tư vấn cá nhân',
      description: 'Nhận gợi ý phối và bảo quản theo phong cách, tuổi thọ, và mục đích sử dụng.',
    },
  ]

  return (
    <section className="trust-band section reveal-stagger" id="trust">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Quy trình của chúng tôi</p>
          <h2>Làm cầu nối giữa truyền thống và thẩm mỹ hôm nay</h2>
        </div>
      </div>
      <div className="trust-grid">
        {values.map((value) => (
          <TrustCard key={value.title} title={value.title} description={value.description} />
        ))}
      </div>
    </section>
  )
}

function TrustCard({ title, description }) {
  const trustTilt = usePointerTilt({ intensity: 8, lift: 6 })

  return (
    <article
      className="trust-card"
      onPointerMove={trustTilt.onPointerMove}
      onPointerLeave={trustTilt.onPointerLeave}
    >
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  )
}

function StoryBand() {
  const storyTilt = usePointerTilt({ intensity: 9, lift: 6 })

  return (
    <section className="story-band reveal-stagger" id="story">
      <span
        className="story-rail parallax-layer"
        data-parallax-speed="0.15"
        data-parallax-axis="y"
        data-parallax-rotate="0.14"
        data-parallax-rotate-axis="x"
        data-parallax-depth="0.7"
        aria-hidden="true"
      />
      <div
        className="story-image"
        data-parallax-speed="0.25"
        data-parallax-axis="x"
        data-parallax-depth="0.4"
        data-parallax-rotate="0.2"
        data-parallax-rotate-axis="both"
        onPointerMove={storyTilt.onPointerMove}
        onPointerLeave={storyTilt.onPointerLeave}
      >
        <img
          src="/assets/gamma-export/images/generated-images/Kk18f1S3N3Q3hV1HfpaE3.png"
          alt="Cận cảnh thiên châu trên nền gỗ"
          loading="lazy"
        />
      </div>
      <div
        className="story-copy parallax-layer"
        data-parallax-speed="0.1"
        data-parallax-axis="x"
        data-parallax-direction="reverse"
        data-parallax-depth="0.35"
        data-parallax-rotate="0.1"
        data-parallax-rotate-axis="y"
      >
        <p className="section-kicker">Câu chuyện & chế tác</p>
        <h2>Tôn trọng truyền thống. Gìn giữ năng lượng.</h2>
        <p>
          Lama Beads chọn lọc các hạt thiên châu, bồ đề và đá tự nhiên theo cảm giác chất liệu, sắc vân và sự phù hợp
          khi phối thành chuỗi. Mỗi món hướng đến vẻ đẹp tĩnh, bền và có thể đồng hành lâu dài.
        </p>
        <div className="story-highlights">
          <p>
            <span>Kho nguyên liệu</span> Tây Tạng, Nepal, Bhutan
          </p>
          <p>
            <span>Quy trình</span> Chọn lọc, làm sạch, tạo độ sáng và sắp xếp theo chiều tay
          </p>
          <p>
            <span>Tư vấn</span> Cá nhân hóa theo phong cách đeo và mục đích sử dụng
          </p>
        </div>
        <a className="button secondary" href={contact.zalo} target="_blank" rel="noreferrer">
          Tìm hiểu thêm
        </a>
      </div>
    </section>
  )
}

function ContactBand() {
  return (
    <section className="contact-band reveal-up" id="contact">
      <div className="contact-item">
        <MapPin size={22} />
        <span>
          <strong>Lama Beads</strong>
          <small>{contact.regions}</small>
        </span>
      </div>
      <a className="contact-item" href={`mailto:${contact.email}`}>
        <Mail size={22} />
        <span>
          <strong>Email</strong>
          <small>{contact.email}</small>
        </span>
      </a>
      <a className="contact-item" href={contact.zalo} target="_blank" rel="noreferrer">
        <MessageCircle size={22} />
        <span>
          <strong>Tư vấn</strong>
          <small>Zalo / WhatsApp</small>
        </span>
      </a>
      <div className="contact-item">
        <Clock3 size={22} />
        <span>
          <strong>Giờ làm việc</strong>
          <small>09:00 - 18:00</small>
        </span>
      </div>
      <a className="button primary contact-cta" href={contact.zalo} target="_blank" rel="noreferrer">
        Liên hệ với chúng tôi
      </a>
      <div className="conversion-strip">
        <div>
          <p>Bạn chưa rõ chọn mẫu nào phù hợp?</p>
          <small>Gửi ảnh phong cách hoặc yêu cầu của bạn, tôi sẽ tư vấn gói trang sức riêng cho bạn.</small>
        </div>
        <a className="button secondary" href={contact.zalo} target="_blank" rel="noreferrer">
          Nhận tư vấn ngay
        </a>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div>
        <strong>Lama Beads</strong>
        <p>Trang sức chuỗi hạt thiêng từ Tây Tạng, Nepal và Bhutan.</p>
      </div>
      <div className="footer-links">
        <a href={`mailto:${contact.email}`}>{contact.email}</a>
        <a href={contact.zalo} target="_blank" rel="noreferrer">
          Zalo tư vấn
        </a>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          Lên đầu trang
        </button>
      </div>
    </footer>
  )
}

export default App
