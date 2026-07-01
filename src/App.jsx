import { animate, stagger } from 'animejs'
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  ChevronLeft,
  CheckCircle2,
  Clock3,
  Filter,
  Gem,
  Images,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  PackageCheck,
  Play,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Video,
  X,
} from 'lucide-react'
import { contact, featuredProduct, products } from './data/products'

const isDarkAsset = (src = '') => src.includes('/edited-images/')

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const HOMEPAGE_DEPTH_VIDEO = '/assets/videos/optimized/lama-jade-depth-openart.mp4'
const HOMEPAGE_DEPTH_POSTER = '/assets/video-frames/optimized/lama-jade-start-frame.avif'
const ALL_FILTER = 'all'
const VI_COLLATOR = new Intl.Collator('vi', { sensitivity: 'base' })
const CONTACT_HREF = contact.zalo || `mailto:${contact.email}`
const CONTACT_LINK_PROPS = contact.zalo ? { target: '_blank', rel: 'noreferrer' } : {}
const CONTACT_ACTION_LABEL = contact.zalo ? 'Liên hệ tư vấn' : 'Gửi yêu cầu qua email'
const ContactIcon = contact.zalo ? MessageCircle : Mail

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const getMediaKey = (media) => `${media.type}:${media.src}`

const getOptimizedImageSrc = (src = '', width = 1200) => {
  if (!src.includes('/assets/product-gallery/images/')) return ''
  return src
    .replace('/assets/product-gallery/images/', `/assets/product-gallery/optimized/${width}/`)
    .replace(/\.(png|jpe?g)$/i, '.avif')
}

const getOptimizedImageSrcSet = (src = '') => {
  const small = getOptimizedImageSrc(src, 720)
  const large = getOptimizedImageSrc(src, 1200)
  return small && large ? `${small} 720w, ${large} 1200w` : ''
}

const getRoutePath = (route) => {
  if (route.name === 'home') return '/'
  if (route.name === 'collection') return '/collection'
  if (route.name === 'about') return '/about'
  if (route.name === 'contact') return '/contact'
  if (route.name === 'product' && route.id) return `/product/${route.id}`
  return '/404'
}

const getRouteSeo = (route, product) => {
  if (route.name === 'collection') {
    return {
      title: 'Bộ sưu tập chuỗi hạt và thiên châu | Lama Beads',
      description: 'Khám phá bộ sưu tập chuỗi hạt, vòng tay và thiên châu Dzi được Lama Beads chọn lọc từ Tây Tạng, Nepal và Bhutan.',
    }
  }

  if (route.name === 'product' && product) {
    return {
      title: `${product.name} | Lama Beads`,
      description: `${product.shortDescription} Xem ảnh thật, chất liệu, ý nghĩa và gợi ý bảo quản trước khi chọn.`,
    }
  }

  if (route.name === 'about') {
    return {
      title: 'Về Lama Beads | Chọn hạt và hoàn thiện thủ công',
      description: 'Tìm hiểu cách Lama Beads chọn thiên châu, bồ đề và đá tự nhiên theo chất hạt, sắc vân và cảm giác khi đeo.',
    }
  }

  if (route.name === 'contact') {
    return {
      title: 'Liên hệ tư vấn | Lama Beads',
      description: 'Liên hệ Lama Beads để xem thêm ảnh thật, hỏi chất liệu, nguồn hạt, kích thước và tình trạng từng mẫu trước khi chọn.',
    }
  }

  if (route.name === 'notfound') {
    return {
      title: 'Không tìm thấy trang | Lama Beads',
      description: 'Trang bạn đang tìm không tồn tại. Quay lại trang chủ hoặc xem bộ sưu tập hiện có của Lama Beads.',
    }
  }

  return {
    title: 'Lama Beads | Chuỗi hạt và thiên châu chọn lọc',
    description: 'Lama Beads giới thiệu chuỗi hạt, thiên châu Dzi và trang sức tâm linh chọn lọc từ Tây Tạng, Nepal và Bhutan.',
  }
}

const setMetaTag = (selector, attrName, attrValue, content) => {
  let tag = document.head.querySelector(selector)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attrName, attrValue)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

const updateDocumentSeo = (route, product) => {
  const seo = getRouteSeo(route, product)
  const canonicalHref = `https://lamabeads.com${getRoutePath(route)}`
  let canonical = document.head.querySelector('link[rel="canonical"]')

  document.title = seo.title
  setMetaTag('meta[name="description"]', 'name', 'description', seo.description)
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', seo.title)
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', seo.description)
  setMetaTag('meta[property="og:type"]', 'property', 'og:type', route.name === 'product' ? 'product' : 'website')
  setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalHref)

  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }

  canonical.setAttribute('href', canonicalHref)
}

const createProductMedia = (product) => [
  ...(product.galleryImages || []).map((src, index) => ({
    type: 'image',
    src,
    poster: src,
    label: index === 0 ? 'Ảnh chính' : `Ảnh chi tiết ${index + 1}`,
    description: index === 0 ? 'Góc nhìn tổng thể của sản phẩm.' : 'Góc cận để xem rõ vân, chất liệu và độ bóng.',
  })),
  ...(product.videos || []).map((video, index) => ({
    type: 'video',
    src: video.src,
    poster: video.poster || product.previewImage,
    label: video.label || `Video ${index + 1}`,
    duration: video.duration || '',
    description: video.description || 'Video giúp xem rõ độ bóng, chuyển động và cảm giác khi đeo.',
  })),
]

const getProductMediaStats = (product) => {
  const imageCount = product.galleryImages?.length || 0
  const videoCount = product.videos?.length || 0
  const summary = [
    imageCount ? `${imageCount} ảnh` : '',
    videoCount ? `${videoCount} video` : '',
  ].filter(Boolean).join(' · ')

  return {
    imageCount,
    videoCount,
    summary: summary || 'Chưa có ảnh',
    videoLabel: videoCount ? `${videoCount} video cận cảnh` : '',
  }
}

const formatMediaCount = (mediaItems) => {
  const imageCount = mediaItems.filter((item) => item.type === 'image').length
  const videoCount = mediaItems.filter((item) => item.type === 'video').length
  return [
    imageCount ? `${imageCount} ảnh` : '',
    videoCount ? `${videoCount} video` : '',
  ].filter(Boolean).join(' · ')
}

const getSearchText = (product) => [
  product.name,
  product.category,
  product.origin,
  product.meaning,
  product.materials,
  product.shortDescription,
  ...(product.highlights || []),
].join(' ').toLowerCase()

const sortProductList = (items, sortMode) => {
  const sorted = [...items]

  if (sortMode === 'name') {
    return sorted.sort((a, b) => VI_COLLATOR.compare(a.name, b.name))
  }

  if (sortMode === 'origin') {
    return sorted.sort((a, b) => VI_COLLATOR.compare(a.origin, b.origin) || VI_COLLATOR.compare(a.name, b.name))
  }

  return sorted
}

function parseRoute(pathname = window.location.pathname) {
  const path = ((pathname || '/') + '').split('?')[0].split('#')[0].replace(/\/+$/, '') || '/'

  if (path === '/' || path === '/index.html') {
    return { name: 'home' }
  }

  if (path === '/collection') {
    return { name: 'collection' }
  }

  if (path === '/about') {
    return { name: 'about' }
  }

  if (path === '/contact') {
    return { name: 'contact' }
  }

  if (path.startsWith('/product/')) {
    const [, productId] = path.split('/').filter(Boolean)
    return { name: 'product', id: productId || null }
  }

  return { name: 'notfound' }
}

function createPath(path) {
  if (!path) return '/'
  const normalizedPath = String(path).trim()
  return normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`
}

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

function App() {
  const [route, setRoute] = useState(() => parseRoute())
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(ALL_FILTER)
  const [selectedOrigin, setSelectedOrigin] = useState(ALL_FILTER)
  const [sortMode, setSortMode] = useState('featured')
  const pageRef = useRef(null)
  const mainRef = useRef(null)
  const routeProgressRef = useRef(null)

  const openProduct = useCallback(
    (product) => {
      if (!product?.id) return
      const targetPath = createPath(`/product/${product.id}`)
      if (targetPath !== window.location.pathname) {
        window.history.pushState({}, '', targetPath)
      }
      setRoute(parseRoute(targetPath))
    },
    [],
  )

  const navigate = useCallback((path) => {
    const targetPath = createPath(path)
    if (targetPath !== window.location.pathname) {
      window.history.pushState({}, '', targetPath)
    }
    setMenuOpen(false)
    setRoute(parseRoute(targetPath))
  }, [])

  useEffect(() => {
    const onPopState = () => setRoute(parseRoute())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const categoryOptions = useMemo(
    () => [ALL_FILTER, ...Array.from(new Set(products.map((product) => product.category)))],
    [],
  )
  const originOptions = useMemo(
    () => [ALL_FILTER, ...Array.from(new Set(products.map((product) => product.origin)))],
    [],
  )

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase()
    const matched = products.filter((product) =>
      (!term || getSearchText(product).includes(term)) &&
      (selectedCategory === ALL_FILTER || product.category === selectedCategory) &&
      (selectedOrigin === ALL_FILTER || product.origin === selectedOrigin),
    )
    return sortProductList(matched, sortMode)
  }, [query, selectedCategory, selectedOrigin, sortMode])

  const clearCollectionControls = useCallback(() => {
    setQuery('')
    setSelectedCategory(ALL_FILTER)
    setSelectedOrigin(ALL_FILTER)
    setSortMode('featured')
  }, [])

  const selectedProduct =
    route.name === 'product' && route.id
      ? products.find((item) => item.id === route.id) || featuredProduct
      : featuredProduct
  const visibleProductKey = filteredProducts.map((product) => product.id).join('|')
  const relatedProducts = useMemo(
    () => products.filter((item) => item.id !== selectedProduct.id).slice(0, 3),
    [selectedProduct.id],
  )

  useEffect(() => {
    updateDocumentSeo(route, selectedProduct)
  }, [route, selectedProduct])

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

  useScrollReveal(pageRef, [route.name, visibleProductKey])
  useScrollParallax(pageRef, [route.name])

  useEffect(() => {
    if (route.name !== 'collection' && searchOpen) {
      setSearchOpen(false)
    }
  }, [route.name, searchOpen])

  useEffect(() => {
    const main = mainRef.current
    if (!main) return

    main.focus({ preventScroll: true })
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }, [route.name, route.id])

  useEffect(() => {
    if (prefersReducedMotion()) return

    const main = mainRef.current
    const progressShell = routeProgressRef.current
    const progressFill = progressShell?.querySelector('span')

    if (progressShell && progressFill) {
      progressShell.style.opacity = '0'
      progressFill.style.transform = 'scaleX(0)'

      animate(progressShell, {
        opacity: [0, 1, 1, 0],
        duration: 760,
        easing: 'linear',
      })

      animate(progressFill, {
        scaleX: [0, 0.74, 1],
        duration: 720,
        easing: 'outCubic',
      })
    }

    if (main) {
      animate(main, {
        opacity: [0, 1],
        translateY: [14, 0],
        filter: ['blur(5px)', 'blur(0px)'],
        duration: 360,
        easing: 'outCubic',
      })
    }
  }, [route.name, route.id])

  useEffect(() => {
    const root = pageRef.current
    if (!root || prefersReducedMotion()) return

    const cues = Array.from(root.querySelectorAll('.motion-cue'))
    if (!cues.length) return

    animate(cues, {
      translateX: [0, 5, 0],
      duration: 560,
      easing: 'outCubic',
      delay: stagger(44),
    })
  }, [route.name, route.id, visibleProductKey])

  return (
    <>
      <div className="app-shell js-animate" ref={pageRef}>
        <Header
          query={query}
          setQuery={setQuery}
          searchOpen={searchOpen}
          setSearchOpen={setSearchOpen}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          onNavigate={navigate}
          showSearch={route.name === 'collection'}
          currentRoute={route.name}
        />
        <div className="route-progress" aria-hidden="true" ref={routeProgressRef}>
          <span />
        </div>
        <main ref={mainRef} tabIndex="-1" aria-label="Nội dung chính">
          {route.name === 'home' ? (
            <HomePage products={products} onExplore={() => navigate('/collection')} onSelect={openProduct} />
          ) : route.name === 'collection' ? (
            <Collection
              products={filteredProducts}
              totalCount={products.length}
              query={query}
              setQuery={setQuery}
              categories={categoryOptions}
              origins={originOptions}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedOrigin={selectedOrigin}
              setSelectedOrigin={setSelectedOrigin}
              sortMode={sortMode}
              setSortMode={setSortMode}
              onSelect={openProduct}
              onClearSearch={clearCollectionControls}
            />
          ) : route.name === 'about' ? (
            <>
              <TrustBand />
              <StoryBand />
            </>
          ) : route.name === 'contact' ? (
            <ContactBand />
          ) : route.name === 'product' ? (
            <DetailSection
              product={selectedProduct}
              relatedProducts={relatedProducts}
              onSelect={openProduct}
              onBack={() => navigate('/collection')}
            />
          ) : (
            <NotFoundPage onNavigate={navigate} />
          )}
        </main>
        <Footer onNavigate={navigate} />
      </div>
      {route.name === 'product' && (
        <MobileContactCta productName={selectedProduct.name} />
      )}
    </>
  )
}

function MobileContactCta({ productName }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const updateVisibility = () => {
      const threshold = Math.min(620, window.innerHeight * 0.72)
      setIsVisible(window.scrollY > threshold)
    }

    updateVisibility()
    window.addEventListener('scroll', updateVisibility, { passive: true })
    window.addEventListener('resize', updateVisibility)

    return () => {
      window.removeEventListener('scroll', updateVisibility)
      window.removeEventListener('resize', updateVisibility)
    }
  }, [productName])

  return (
    <a
      className={`mobile-sticky-cta ${isVisible ? 'is-visible' : ''}`}
      href={CONTACT_HREF}
      aria-label={`Gửi yêu cầu tư vấn về ${productName}`}
      {...CONTACT_LINK_PROPS}
    >
      <ContactIcon size={18} />
      <span>{CONTACT_ACTION_LABEL}</span>
    </a>
  )
}

function HomePage({ products, onExplore, onSelect }) {
  const featuredProducts = products.slice(0, 4)

  return (
    <>
      <ProductDepthScene onExplore={onExplore} />
      <section className="collection section">
        <div className="section-heading reveal-up">
          <div>
            <p className="section-kicker">Bộ sưu tập nổi bật</p>
            <h2>Một số mẫu tiêu biểu</h2>
          </div>
        </div>
        <p className="collection-note reveal-up">
          Một vài mẫu nổi bật để bạn cảm nhận chất liệu, màu sắc và tinh thần của Lama Beads trước khi xem toàn bộ bộ sưu tập.
        </p>
        <div
          className="product-grid reveal-stagger parallax-layer"
          data-parallax-speed="0.16"
          data-parallax-axis="y"
          data-parallax-direction="reverse"
          data-parallax-depth="0.9"
          data-parallax-rotate="0.08"
          data-parallax-rotate-axis="both"
        >
          {featuredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              depthIndex={index}
              onSelect={() => onSelect(product)}
            />
          ))}
        </div>
        <div className="section-cta-row">
          <button className="text-link collection-link" onClick={onExplore}>
            Xem toàn bộ bộ sưu tập
            <ArrowRight className="motion-cue" size={16} />
          </button>
        </div>
      </section>
    </>
  )
}

function ProductDepthScene({ onExplore }) {
  const sceneRef = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    const root = sceneRef.current
    const video = videoRef.current
    if (!root || !video || prefersReducedMotion()) return

    const getProgress = () => {
      const rect = root.getBoundingClientRect()
      const stickyOffset = window.innerWidth <= 760 ? 64 : 68
      const range = Math.max(1, rect.height - window.innerHeight)
      return clamp((stickyOffset - rect.top) / range, 0, 1)
    }

    let rafId = 0
    const syncVideoToScroll = () => {
      const progress = getProgress()
      const eased = 1 - Math.pow(1 - progress, 3)
      root.style.setProperty('--depth-progress', eased.toFixed(3))
      root.style.setProperty('--depth-video-scale', (1.01 + eased * 0.035).toFixed(3))
      root.style.setProperty('--depth-focus-x', `${(70 - eased * 14).toFixed(2)}%`)
      root.style.setProperty('--depth-vignette-opacity', (0.25 + eased * 0.32).toFixed(3))
      root.style.setProperty('--depth-sheen-opacity', (0.34 + eased * 0.24).toFixed(3))
      root.style.setProperty('--depth-sheen-x', `${((eased - 0.5) * 10).toFixed(2)}%`)

      if (Number.isFinite(video.duration) && video.duration > 0) {
        const targetTime = clamp(eased * video.duration, 0, Math.max(0, video.duration - 0.04))
        if (Math.abs(video.currentTime - targetTime) > 0.035) {
          video.currentTime = targetTime
        }
      }

      rafId = 0
    }

    const requestSync = () => {
      if (rafId) return
      rafId = requestAnimationFrame(syncVideoToScroll)
    }

    video.pause()
    video.load()
    requestSync()
    video.addEventListener('loadedmetadata', requestSync)
    window.addEventListener('scroll', requestSync, { passive: true })
    window.addEventListener('resize', requestSync, { passive: true })

    return () => {
      video.removeEventListener('loadedmetadata', requestSync)
      window.removeEventListener('scroll', requestSync)
      window.removeEventListener('resize', requestSync)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <section className="depth-scene cinematic-hero" id="top" ref={sceneRef} aria-label="Lama Beads">
      <div className="depth-stage">
        <div className="depth-video-frame" aria-hidden="true">
          <video
            ref={videoRef}
            src={HOMEPAGE_DEPTH_VIDEO}
            poster={HOMEPAGE_DEPTH_POSTER}
            muted
            playsInline
            preload="metadata"
          />
          <span className="depth-video-sheen" />
          <span className="depth-progress">
            <span />
          </span>
        </div>
        <div className="depth-copy">
          <p className="section-kicker">Lama Beads</p>
          <h1>Ngắm sâu từng lớp vân</h1>
          <p>
            Từ bề mặt hạt đến những lớp vân bên trong, mỗi chuyển động nhỏ của ánh sáng
            đều làm hiện rõ chất đá, độ bóng và cảm giác riêng của từng món.
          </p>
          <div className="hero-actions reveal-stagger">
            <button className="button primary" onClick={onExplore}>
              Xem bộ sưu tập
            </button>
            <a className="text-link depth-contact-link" href={CONTACT_HREF} {...CONTACT_LINK_PROPS}>
              {CONTACT_ACTION_LABEL}
              <ContactIcon size={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function NotFoundPage({ onNavigate }) {
  return (
    <section className="section not-found-page">
      <div className="section-heading reveal-up">
        <div>
          <p className="section-kicker">Không tìm thấy</p>
          <h1>Không tìm thấy trang này</h1>
        </div>
      </div>
      <p className="collection-note reveal-up">Bạn có thể quay về trang chủ hoặc xem lại bộ sưu tập hiện có.</p>
      <div className="section-cta-row">
        <button className="button primary" onClick={() => onNavigate('/')}>
          Trang chủ
        </button>
        <button className="button secondary" onClick={() => onNavigate('/collection')}>
          Xem bộ sưu tập
        </button>
      </div>
    </section>
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
  showSearch,
  currentRoute,
}) {
  const nav = [
    ['Trang chủ', '/', 'home'],
    ['Bộ sưu tập', '/collection', 'collection'],
    ['Về chúng tôi', '/about', 'about'],
    ['Liên hệ', '/contact', 'contact'],
  ]

  return (
    <header className="site-header">
      <button className="icon-button mobile-only" aria-label="Mở menu" onClick={() => setMenuOpen(true)}>
        <Menu size={24} />
      </button>
      <button className="brand" onClick={() => onNavigate('/')} aria-label="Lama Beads home">
        Lama Beads
      </button>
      <nav className="desktop-nav" aria-label="Chính">
        {nav.map(([label, target, routeName]) => (
          <button
            key={target}
            className={currentRoute === routeName ? 'is-active' : ''}
            aria-current={currentRoute === routeName ? 'page' : undefined}
            onClick={() => onNavigate(target)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="header-actions">
        {showSearch && (
          <>
            {searchOpen && (
              <label className="search-field">
                <Search size={16} />
                <input
                  autoFocus
                  value={query}
                  aria-label="Tìm trong bộ sưu tập"
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
          </>
        )}
      </div>
      {menuOpen && (
        <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="mobile-menu-top">
            <span className="brand mobile-brand">Lama Beads</span>
            <button className="icon-button" aria-label="Đóng menu" onClick={() => setMenuOpen(false)}>
              <X size={22} />
            </button>
          </div>
          {nav.map(([label, target, routeName]) => (
            <button
              key={target}
              className={`mobile-menu-link ${currentRoute === routeName ? 'is-active' : ''}`}
              aria-current={currentRoute === routeName ? 'page' : undefined}
              onClick={() => onNavigate(target)}
            >
              {label}
              <ArrowRight className="motion-cue" size={18} />
            </button>
          ))}
        </div>
      )}
    </header>
  )
}

function Collection({
  products,
  totalCount,
  query,
  setQuery,
  categories,
  origins,
  selectedCategory,
  setSelectedCategory,
  selectedOrigin,
  setSelectedOrigin,
  sortMode,
  setSortMode,
  onSelect,
  onClearSearch,
}) {
  const activeFilterCount = [query, selectedCategory !== ALL_FILTER, selectedOrigin !== ALL_FILTER]
    .filter(Boolean).length
  const collectionStats = [
    ['Tổng mẫu', `${totalCount} mẫu`],
    ['Hiển thị', `${products.length} mẫu`],
    ['Hình ảnh', 'Ảnh thật của từng mẫu'],
  ]

  return (
    <section className="collection section" id="collection">
      <div className="section-heading reveal-up">
        <div>
          <p className="section-kicker">Bộ sưu tập</p>
          <h1>Mỗi chuỗi hạt là một câu chuyện</h1>
        </div>
        <button className="text-link" onClick={onClearSearch} disabled={!activeFilterCount}>
          {activeFilterCount ? 'Xóa bộ lọc' : 'Tất cả sản phẩm'} <ArrowRight className="motion-cue" size={16} />
        </button>
      </div>
      <p className="collection-note reveal-up">
        Dùng bộ lọc để tìm nhanh mẫu hợp chất liệu, nguồn gốc hoặc phong cách bạn đang tìm.
        Chọn một sản phẩm để xem ảnh cận, chất liệu và gợi ý bảo quản.
      </p>
      <div className="collection-summary reveal-up" aria-label="Tóm tắt bộ sưu tập">
        {collectionStats.map(([label, value]) => (
          <span key={label}>
            <strong>{value}</strong>
            <small>{label}</small>
          </span>
        ))}
      </div>
      <div className="collection-tools reveal-up">
        <label className="collection-search">
          <Search size={17} />
          <span>Tìm sản phẩm</span>
          <input
            value={query}
            aria-label="Tìm sản phẩm trong bộ sưu tập"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="filter-group" aria-label="Lọc theo dòng sản phẩm">
          <span className="filter-label">
            <Filter size={16} />
            Dòng sản phẩm
          </span>
          <div className="filter-chips">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={category === selectedCategory ? 'filter-chip is-active' : 'filter-chip'}
                onClick={() => setSelectedCategory(category)}
              >
                {category === ALL_FILTER ? 'Tất cả' : category}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group" aria-label="Lọc theo nguồn gốc">
          <span className="filter-label">
            <MapPin size={16} />
            Nguồn
          </span>
          <div className="filter-chips">
            {origins.map((origin) => (
              <button
                key={origin}
                type="button"
                className={origin === selectedOrigin ? 'filter-chip is-active' : 'filter-chip'}
                onClick={() => setSelectedOrigin(origin)}
              >
                {origin === ALL_FILTER ? 'Tất cả' : origin}
              </button>
            ))}
          </div>
        </div>
        <label className="sort-control">
          <SlidersHorizontal size={16} />
          <span>Sắp xếp</span>
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
            <option value="featured">Gợi ý</option>
            <option value="name">Tên A-Z</option>
            <option value="origin">Nguồn gốc</option>
          </select>
        </label>
      </div>
      <p className="collection-result-count">
        Đang hiển thị {products.length} / {totalCount} mẫu
      </p>
      {products.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có mẫu nào khớp với bộ lọc này.</p>
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
              onSelect={() => onSelect(product)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

const OptimizedImage = forwardRef(function OptimizedImage({
  src,
  alt,
  className,
  loading = 'lazy',
  decoding = 'async',
  width,
  height,
  sizes,
  fetchPriority,
}, ref) {
  const optimizedSrcSet = getOptimizedImageSrcSet(src)

  return (
    <picture>
      {optimizedSrcSet && <source type="image/avif" srcSet={optimizedSrcSet} sizes={sizes} />}
      <img
        ref={ref}
        className={className}
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        width={width}
        height={height}
        sizes={sizes}
        fetchPriority={fetchPriority}
      />
    </picture>
  )
})

function ProductImageFrame({ src, alt, className = 'product-image', loading = 'lazy', sizes = '(max-width: 860px) 45vw, 25vw' }) {
  return (
    <span className={`${className} ${isDarkAsset(src) ? 'dark-source' : ''}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        loading={loading}
        width="900"
        height="776"
        sizes={sizes}
      />
    </span>
  )
}

function ProductCard({ product, active = false, onSelect, depthIndex = 0 }) {
  const cardTilt = usePointerTilt({ intensity: 12, lift: 6 })
  const cardDepth = `${6 + (depthIndex % 3) * 8}px`
  const mediaStats = getProductMediaStats(product)

  return (
    <button
      className={`product-card reveal-card ${active ? 'is-active' : ''}`}
      data-testid={`product-card-${product.id}`}
      style={{ '--card-depth': cardDepth, '--card-angle': `${((depthIndex % 2) ? '-1.25deg' : '0.9deg')}` }}
      onClick={onSelect}
      onPointerMove={cardTilt.onPointerMove}
      onPointerLeave={cardTilt.onPointerLeave}
    >
      <span className="product-card-media">
        <ProductImageFrame src={product.previewImage} alt={product.name} />
        <span className="product-media-badge">
          <Camera size={14} />
          {mediaStats.summary}
        </span>
      </span>
      <span className="product-copy">
        <span className="product-kicker">{product.category}</span>
        <strong>{product.name}</strong>
        <span className="product-description">{product.shortDescription}</span>
        <span className="product-card-meta">
          <span>{product.origin}</span>
          <span>{product.availability}</span>
        </span>
      </span>
      <span className="product-card-action">
        Xem chi tiết
        <ArrowRight className="motion-cue" size={16} />
      </span>
    </button>
  )
}

function DetailSection({ product, relatedProducts, onSelect, onBack }) {
  const mediaItems = useMemo(() => createProductMedia(product), [product])
  const mediaStats = useMemo(() => getProductMediaStats(product), [product])
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  const activeMedia = mediaItems[activeMediaIndex] || mediaItems[0]
  const mainMediaRef = useRef(null)
  const sectionHeadingRef = useRef(null)
  const detailSectionRef = useRef(null)

  useEffect(() => {
    setActiveMediaIndex(0)
  }, [product.id])

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
    if (!mainMediaRef.current || prefersReducedMotion()) return

    animate(mainMediaRef.current, {
      opacity: [0, 1],
      scale: [0.97, 1],
      duration: 320,
      easing: 'outCubic',
    })
  }, [activeMedia])

  const specs = [
    [Gem, 'Chất liệu', product.materials],
    [BadgeCheck, 'Tình trạng', product.availability],
    [Clock3, 'Giá', product.priceNote],
    [PackageCheck, 'Kích thước', product.sizeNote],
    [MapPin, 'Nguồn gốc', product.origin],
    [Sparkles, 'Ý nghĩa', product.meaning],
    [Shield, 'Bảo quản', product.care],
    [PackageCheck, 'Giao nhận', product.shippingNote],
  ]
  const hasProductVideos = mediaStats.videoCount > 0
  const mediaNoteTitle = hasProductVideos
    ? 'Xem kỹ bằng ảnh và video trước khi chọn'
    : 'Xem kỹ từng góc trước khi chọn'
  const mediaNoteCopy = hasProductVideos
    ? 'Bạn có thể xem ảnh cận, video xoay chậm và góc vân rõ hơn để cảm nhận bề mặt, độ bóng và dáng đeo.'
    : 'Nếu bạn quan tâm một mẫu, Lama Beads có thể gửi thêm ảnh dưới ánh sáng tự nhiên, góc cận vân và ảnh đặt trên tay để bạn yên tâm hơn trước khi quyết định.'
  const assurances = [
    [BadgeCheck, 'Xem kỹ trước khi chọn', product.inspection],
    [Camera, hasProductVideos ? 'Ảnh và video cận cảnh' : 'Ảnh cận theo từng góc', mediaNoteCopy],
    [PackageCheck, 'Đóng gói & bảo quản', 'Mỗi mẫu đều có gợi ý bảo quản riêng để dây, hạt và phụ kiện bền hơn khi sử dụng.'],
  ]

  return (
    <section className="detail section" id="detail" ref={detailSectionRef}>
      <button className="back-link" onClick={onBack}>
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
            {mediaItems.map((media, index) => (
              <button
                key={getMediaKey(media)}
                className={index === activeMediaIndex ? 'thumb media-thumb is-active' : 'thumb media-thumb'}
                onClick={() => setActiveMediaIndex(index)}
                aria-pressed={index === activeMediaIndex}
                aria-label={`${media.type === 'video' ? 'Xem video' : 'Xem trước hình'} ${product.name}: ${media.label}`}
                type="button"
              >
                <OptimizedImage
                  src={media.poster || media.src}
                  alt=""
                  loading="lazy"
                  width="220"
                  height="220"
                  sizes="88px"
                />
                {media.type === 'video' && (
                  <span className="thumb-play" aria-hidden="true">
                    <Play size={16} />
                  </span>
                )}
              </button>
            ))}
          </div>
          <figure
            className={`main-image main-media ${activeMedia.type === 'video' ? 'is-video' : ''} ${
              isDarkAsset(activeMedia.src) || isDarkAsset(activeMedia.poster) ? 'dark-source' : ''
            }`}
          >
            <div className="media-toolbar" aria-label="Thông tin hình ảnh sản phẩm">
              <span>
                <Images size={15} />
                {mediaStats.imageCount} ảnh
              </span>
              {mediaStats.videoCount > 0 && (
                <span>
                  <Video size={15} />
                  {mediaStats.videoLabel}
                </span>
              )}
            </div>
            {activeMedia.type === 'video' ? (
              <video
                ref={mainMediaRef}
                className="main-image-photo"
                src={activeMedia.src}
                poster={activeMedia.poster}
                key={getMediaKey(activeMedia)}
                controls
                playsInline
                preload="metadata"
              />
            ) : (
              <OptimizedImage
                ref={mainMediaRef}
                className="main-image-photo"
                src={activeMedia.src}
                alt={`${product.name} - ${activeMedia.label}`}
                key={getMediaKey(activeMedia)}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                width="1200"
                height="1200"
                sizes="(max-width: 860px) 100vw, 58vw"
              />
            )}
            <figcaption className="media-caption">
              <span>{activeMedia.label}</span>
              {activeMedia.type === 'video' && activeMedia.duration && <small>{activeMedia.duration}</small>}
            </figcaption>
          </figure>
          <p className="media-context">
            {activeMedia.description}
          </p>
        </div>
        <article className="detail-copy">
          <p className="detail-category">{product.category}</p>
          <h1 data-testid="detail-title">{product.name}</h1>
          <p className="detail-intro">{product.fullDescription}</p>
          <div className="detail-meta">
            <span>Mã: {product.id}</span>
            <span>{formatMediaCount(mediaItems)}</span>
            <span>{product.origin}</span>
          </div>
          <div className="detail-media-note">
            <Camera size={19} />
            <div>
              <strong>{mediaNoteTitle}</strong>
              <p>{mediaNoteCopy}</p>
            </div>
          </div>
          <div className="detail-highlights">
            {(product.highlights || []).map((highlight) => (
              <span key={highlight}>
                <CheckCircle2 size={16} />
                {highlight}
              </span>
            ))}
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
          <div className="detail-assurance">
            {assurances.map(([Icon, title, description]) => (
              <article key={title}>
                <Icon size={18} />
                <div>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="detail-actions reveal-stagger">
            <a className="button primary wide" href={CONTACT_HREF} {...CONTACT_LINK_PROPS}>
              {CONTACT_ACTION_LABEL} <ContactIcon size={18} />
            </a>
          </div>
        </article>
      </div>
      <div
        className="media-related related-only reveal-stagger parallax-layer"
        data-parallax-speed="0.12"
        data-parallax-axis="y"
        data-parallax-direction="reverse"
        data-parallax-depth="0.5"
        data-parallax-rotate="0.05"
        data-parallax-rotate-axis="x"
      >
        <div className="related">
          <h3>Có thể bạn cũng thích</h3>
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
  const mediaStats = getProductMediaStats(item)

  return (
    <button
      className="related-card"
      data-testid={`related-card-${item.id}`}
      style={{ '--card-depth': cardDepth, '--card-angle': `${((depthIndex % 2) ? '-1.15deg' : '0.85deg')}` }}
      onClick={() => onSelect(item)}
      onPointerMove={relatedTilt.onPointerMove}
      onPointerLeave={relatedTilt.onPointerLeave}
    >
      <ProductImageFrame
        src={item.previewImage}
        alt={item.name}
        className="related-image"
        sizes="(max-width: 860px) 100vw, 20vw"
      />
      <span>{item.name}</span>
      <small>{item.origin} · {mediaStats.summary}</small>
      <ArrowRight className="motion-cue" size={15} />
    </button>
  )
}

function TrustBand() {
  const values = [
    {
      title: 'Chọn hạt kỹ lưỡng',
      description: 'Từng hạt được chọn theo độ sâu của vân, bề mặt, màu sắc và cảm giác khi cầm trên tay.',
    },
    {
      title: 'Hoàn thiện thủ công',
      description: 'Dây, móc và chi tiết phối được hoàn thiện cẩn thận để giữ dáng và bền hơn khi đeo.',
    },
    {
      title: 'Tư vấn theo từng người',
      description: 'Gợi ý mẫu, cách phối và cách bảo quản dựa trên phong cách, cổ tay và mục đích sử dụng.',
    },
  ]

  return (
    <section className="trust-band section reveal-stagger" id="trust">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Cách chúng tôi chọn hạt</p>
          <h1>Giữ tinh thần truyền thống trong cách đeo hiện đại</h1>
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
        <OptimizedImage
          src="/assets/product-gallery/images/generated-images/Kk18f1S3N3Q3hV1HfpaE3.png"
          alt="Cận cảnh thiên châu trên nền gỗ"
          loading="lazy"
          width="1200"
          height="840"
          sizes="(max-width: 860px) 100vw, 46vw"
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
        <h2>Tôn trọng chất liệu. Giữ lại cảm giác riêng.</h2>
        <p>
          Lama Beads chọn thiên châu, bồ đề và đá tự nhiên theo chất hạt, sắc vân và sự hài hòa khi phối thành chuỗi.
          Mỗi món hướng đến vẻ đẹp tĩnh, bền và có thể đồng hành lâu dài.
        </p>
        <div className="story-highlights">
          <p>
            <span>Nguồn hạt</span> Tây Tạng, Nepal, Bhutan
          </p>
          <p>
            <span>Quy trình</span> Chọn hạt, làm sạch, hoàn thiện bề mặt và sắp lại theo dáng đeo
          </p>
          <p>
            <span>Tư vấn</span> Gợi ý theo phong cách, cổ tay và mục đích sử dụng
          </p>
        </div>
        <a className="button secondary" href={CONTACT_HREF} {...CONTACT_LINK_PROPS}>
          {CONTACT_ACTION_LABEL}
        </a>
      </div>
    </section>
  )
}

function ContactBand() {
  const contactCards = [
    [MapPin, 'Nguồn hạt', contact.regions, null],
    [Mail, 'Email', contact.email, `mailto:${contact.email}`],
    ...(contact.zalo ? [[MessageCircle, 'Nhắn tư vấn', 'Zalo / WhatsApp', contact.zalo]] : []),
    [Clock3, 'Giờ làm việc', '09:00 - 18:00', null],
  ]
  const consultationSteps = [
    'Gửi ảnh mẫu bạn thích hoặc mô tả phong cách đang tìm.',
    'Lama Beads gợi ý mẫu, kích thước và ý nghĩa hợp với bạn.',
    'Xem thêm ảnh cận, tình trạng mẫu và cách bảo quản trước khi quyết định.',
  ]

  return (
    <section className="contact-page section reveal-up" id="contact">
      <div className="contact-hero">
        <p className="section-kicker">Liên hệ</p>
        <h1>Xem kỹ bằng ảnh thật trước khi chọn.</h1>
        <p>
          Nếu bạn chưa chắc mẫu nào hợp cổ tay, phong cách hoặc ý nghĩa mình đang tìm,
          cứ gửi yêu cầu để Lama Beads gợi ý theo chất liệu, nguồn hạt, kích thước và cách đeo.
        </p>
        <a className="button primary contact-cta" href={CONTACT_HREF} {...CONTACT_LINK_PROPS}>
          {CONTACT_ACTION_LABEL} <ContactIcon size={18} />
        </a>
      </div>
      <div className="contact-card-grid">
        {contactCards.map(([Icon, title, value, href]) => {
          const content = (
            <>
              <Icon size={22} />
              <span>
                <strong>{title}</strong>
                <small>{value}</small>
              </span>
            </>
          )

          return href ? (
            <a key={title} className="contact-item" href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined}>
              {content}
            </a>
          ) : (
            <div key={title} className="contact-item">
              {content}
            </div>
          )
        })}
      </div>
      <div className="consultation-flow">
        <div>
          <p className="section-kicker">Quy trình tư vấn</p>
          <h3>Từ mẫu bạn thích đến lựa chọn phù hợp</h3>
        </div>
        <ol>
          {consultationSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
      <div className="conversion-strip">
        <div>
          <p>Bạn chưa rõ mẫu nào hợp với mình?</p>
          <small>Gửi ảnh phong cách bạn thích hoặc nhu cầu đang tìm, Lama Beads sẽ gợi ý mẫu phù hợp.</small>
        </div>
      </div>
    </section>
  )
}

function Footer({ onNavigate }) {
  return (
    <footer className="footer">
      <div>
        <strong>Lama Beads</strong>
        <p>Chuỗi hạt và thiên châu được chọn lọc từ Tây Tạng, Nepal và Bhutan.</p>
      </div>
      <div className="footer-links">
        <a href={`mailto:${contact.email}`}>{contact.email}</a>
        {contact.zalo && (
          <a href={contact.zalo} target="_blank" rel="noreferrer">
            Nhắn Zalo
          </a>
        )}
        <button onClick={() => onNavigate('/')}>
          Lên đầu trang
        </button>
      </div>
    </footer>
  )
}

export default App
