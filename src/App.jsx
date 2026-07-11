import { animate, stagger } from 'animejs'
import { forwardRef, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  ChevronDown,
  ChevronLeft,
  CheckCircle2,
  ClipboardCheck,
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
  Ruler,
  Search,
  SlidersHorizontal,
  Sparkles,
  Video,
  X,
} from 'lucide-react'
import { brand, contact } from './data/brand'
import { featuredProduct, products } from './data/products'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const SITE_URL = brand.siteUrl
const BRAND_NAME = brand.name
const HOMEPAGE_DEPTH_VIDEO = '/assets/videos/optimized/cnp-jade-depth-openart.mp4'
const HOMEPAGE_DEPTH_POSTER = '/assets/video-frames/optimized/cnp-jade-start-frame.avif'
const DEFAULT_SOCIAL_IMAGE = featuredProduct.previewImage
const ALL_FILTER = 'all'
const VI_COLLATOR = new Intl.Collator('vi', { sensitivity: 'base' })
const CONTACT_HREF = contact.zalo || `mailto:${contact.email}`
const CONTACT_LINK_PROPS = contact.zalo ? { target: '_blank', rel: 'noreferrer' } : {}
const CONTACT_ACTION_LABEL = contact.zalo ? 'Liên hệ tư vấn' : 'Gửi yêu cầu qua email'
const ContactIcon = contact.zalo ? MessageCircle : Mail
const COMPLEMENT_CATEGORY_ORDER = ['Hoa tai', 'Vòng cổ', 'Vòng tay', 'Nhẫn', 'Vòng kiềng']
const MATCH_SLOT_LABELS = {
  'Hoa tai': 'Gần gương mặt',
  'Vòng cổ': 'Đường cổ',
  'Vòng tay': 'Cổ tay mềm',
  'Nhẫn': 'Điểm nhấn bàn tay',
  'Vòng kiềng': 'Cổ tay rõ nét',
}
const CATEGORY_GUIDES = {
  'Hoa tai': {
    title: 'Chọn hoa tai theo đường nét gương mặt.',
    text: 'Mẫu nhỏ gọn hợp dùng hằng ngày; dáng rơi hoặc dáng dài sẽ tạo điểm nhấn rõ hơn gần gương mặt.',
    points: ['Xem độ cân hai bên', 'Kiểm tra móc/chốt', 'Ưu tiên sắc ngọc làm sáng da'],
  },
  'Vòng cổ': {
    title: 'Chọn vòng cổ theo cổ áo và điểm nhìn.',
    text: 'Chuỗi ngọc nên cân với cổ áo, độ dài và mặt treo. Một món đủ rõ sẽ đẹp hơn nhiều lớp quá nặng.',
    points: ['Xem chiều dài chuỗi', 'Kiểm tra mặt treo', 'Phối cùng hoa tai gọn'],
  },
  'Vòng tay': {
    title: 'Chọn vòng tay theo cổ tay và nhịp đeo.',
    text: 'Hạt mềm hợp dùng hằng ngày; sắc nổi hoặc khóa sáng phù hợp khi muốn cổ tay có điểm nhấn.',
    points: ['Xem độ đều của hạt', 'Kiểm tra khóa/dây', 'Chọn tông hợp nhẫn hoặc hoa tai'],
  },
  'Nhẫn': {
    title: 'Chọn nhẫn theo bàn tay và độ nổi của viên ngọc.',
    text: 'Nhẫn nên vừa đủ nổi khi cử động tay, nhưng vẫn giữ sự cân bằng với vòng tay hoặc hoa tai đi cùng.',
    points: ['Kiểm tra kích thước', 'Xem độ cao mặt nhẫn', 'Phối cùng chi tiết kim loại tương đồng'],
  },
  'Vòng kiềng': {
    title: 'Chọn vòng kiềng theo dáng cổ tay và sắc ngọc.',
    text: 'Vòng kiềng cần xem kỹ độ trong, vân chuyển màu và dáng tròn vì đây là món nằm rất rõ trên cổ tay.',
    points: ['Xem vân và vùng chuyển màu', 'Kiểm tra dáng vòng', 'Đeo đơn để giữ vẻ sạch'],
  },
}
const TRUST_VALUES = [
  {
    title: 'Ảnh và video theo từng mẫu',
    description: 'Mỗi sản phẩm được trình bày bằng media riêng để bạn xem đúng mẫu, đúng màu và đúng dáng trước khi hỏi thêm.',
  },
  {
    title: 'Kiểm tra điểm quan trọng',
    description: 'Tập trung vào sắc ngọc, vân, bề mặt, khóa/móc, kích thước và cảm giác khi lên người, không chỉ nhìn ảnh đẹp.',
  },
  {
    title: 'Tư vấn theo cách đeo',
    description: 'Gợi ý theo gương mặt, cổ tay, phong cách và món muốn phối cùng để set trang sức không bị quá nhiều chi tiết.',
  },
  {
    title: 'Xác nhận trước khi gửi',
    description: 'Trước khi chốt, mẫu được xác nhận lại bằng ảnh hoặc video cận cùng ghi chú tình trạng và cách bảo quản.',
  },
]
const TRUST_PROCESS_STEPS = [
  ['01', 'Xem mẫu đang quan tâm', 'Chọn sản phẩm, xem ảnh chính, ảnh cận và video nếu mẫu có sẵn.'],
  ['02', 'Hỏi đúng điểm cần kiểm tra', 'Có thể yêu cầu thêm góc vân, bề mặt, khóa/móc, kích thước hoặc ảnh đặt trên tay.'],
  ['03', 'Nhận gợi ý phối cùng', 'Nếu muốn tạo set, mẫu phối được chọn theo tông ngọc, kim loại và vị trí đeo.'],
  ['04', 'Xác nhận trước khi gửi', 'Chốt lại tình trạng, cách bảo quản và đóng gói riêng trước khi giao.'],
]
const PRODUCT_PROFILES = {
  'cnp-001': { color: 'tím nhạt', metal: 'không rõ', mood: ['dịu', 'tối giản'], occasion: ['hằng ngày', 'quà tặng'], placement: 'wrist', weight: 'mềm' },
  'cnp-002': { color: 'xanh', metal: 'bạc', mood: ['thanh lịch', 'mềm'], occasion: ['tiệc nhẹ', 'tư vấn'], placement: 'face', weight: 'nổi' },
  'cnp-003': { color: 'xanh', metal: 'bạc', mood: ['hiện đại', 'gọn'], occasion: ['đi làm', 'tiệc nhẹ'], placement: 'face', weight: 'nổi' },
  'cnp-004': { color: 'cam', metal: 'vàng', mood: ['ấm', 'trẻ'], occasion: ['hằng ngày', 'đi chơi'], placement: 'face', weight: 'vừa' },
  'cnp-005': { color: 'xanh', metal: 'bạc', mood: ['nữ tính', 'tươi'], occasion: ['hằng ngày', 'quà tặng'], placement: 'hand', weight: 'vừa' },
  'cnp-006': { color: 'tím nhạt', metal: 'bạc', mood: ['dịu', 'dễ đeo'], occasion: ['hằng ngày', 'quà tặng'], placement: 'wrist', weight: 'mềm' },
  'cnp-007': { color: 'xanh lam', metal: 'không rõ', mood: ['trong', 'tối giản'], occasion: ['hằng ngày', 'thiền tĩnh'], placement: 'wrist', weight: 'mềm' },
  'cnp-008': { color: 'xanh', metal: 'bạc', mood: ['gọn', 'dễ đeo'], occasion: ['hằng ngày', 'đi làm'], placement: 'face', weight: 'nhỏ' },
  'cnp-009': { color: 'xanh', metal: 'vàng', mood: ['trang trọng', 'trầm'], occasion: ['sự kiện', 'quà tặng'], placement: 'neck', weight: 'nổi' },
  'cnp-010': { color: 'tím nhạt', metal: 'vàng', mood: ['dịu', 'nữ tính'], occasion: ['hằng ngày', 'quà tặng'], placement: 'wrist', weight: 'mềm' },
  'cnp-011': { color: 'xanh', metal: 'bạc', mood: ['tươi', 'tự nhiên'], occasion: ['hằng ngày', 'đi chơi'], placement: 'face', weight: 'vừa' },
  'cnp-012': { color: 'xanh', metal: 'bạc', mood: ['mềm', 'nữ tính'], occasion: ['hằng ngày', 'tiệc nhẹ'], placement: 'face', weight: 'vừa' },
}

const slugifyVietnamese = (value = '') => value
  .toString()
  .trim()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const getCategorySortRank = (category) => {
  const index = COMPLEMENT_CATEGORY_ORDER.indexOf(category)
  return index === -1 ? 99 : index
}

const sortCategories = (categories) => [...categories].sort((first, second) => {
  const rankDelta = getCategorySortRank(first) - getCategorySortRank(second)

  return rankDelta || VI_COLLATOR.compare(first, second)
})

const getCategoryPath = (category) => (
  !category || category === ALL_FILTER ? '/collection' : `/collection/${slugifyVietnamese(category)}`
)

const getCategoryFromSlug = (slug) => {
  const normalizedSlug = slugifyVietnamese(slug)
  return Array.from(new Set(products.map((product) => product.category)))
    .find((category) => slugifyVietnamese(category) === normalizedSlug)
}

const uniqueProfileValues = (items, selector, { exclude = [] } = {}) => {
  const excluded = new Set(exclude)
  return Array.from(new Set(items.flatMap((product) => {
    const value = selector(getProductProfile(product))
    return Array.isArray(value) ? value : [value]
  }).filter((value) => value && !excluded.has(value)))).sort(VI_COLLATOR.compare)
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const getMediaKey = (media) => `${media.type}:${media.src}`

const getProductById = (id) => products.find((product) => product.id === id)

const getProductInquiryHref = (product) => {
  if (contact.zalo) return contact.zalo

  const subject = product?.name
    ? `Tư vấn ${BRAND_NAME} - ${product.name}`
    : `Tư vấn ${BRAND_NAME}`
  const body = product?.name
    ? [
      `Chào ${BRAND_NAME},`,
      '',
      `Mình muốn hỏi thêm về mẫu: ${product.name}`,
      `Mã mẫu: ${product.id}`,
      '',
      'Mình muốn xem thêm ảnh/video, tình trạng mẫu và gợi ý phối cùng.',
    ].join('\n')
    : `Chào ${BRAND_NAME}, mình muốn được tư vấn mẫu trang sức ngọc phù hợp.`

  return `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

const getProductProfile = (product) => PRODUCT_PROFILES[product?.id] || {
  color: product?.category || 'ngọc',
  metal: 'không rõ',
  mood: [],
  occasion: [],
  placement: product?.category || 'other',
  weight: 'vừa',
}

const getCategorySlotLabel = (category) => MATCH_SLOT_LABELS[category] || category

const getPlacementLabel = (product) => getCategorySlotLabel(product?.category || '')

const getSharedValues = (first = [], second = []) => first.filter((value) => second.includes(value))

const getMatchSignals = (baseProduct, candidate) => {
  const baseProfile = getProductProfile(baseProduct)
  const candidateProfile = getProductProfile(candidate)
  const signals = []
  const sharedMood = getSharedValues(candidateProfile.mood, baseProfile.mood)
  const sharedOccasion = getSharedValues(candidateProfile.occasion, baseProfile.occasion)

  if (baseProfile.color === candidateProfile.color) {
    signals.push({ label: 'Sắc ngọc', value: `Cùng tông ${candidateProfile.color}` })
  }

  if (baseProfile.metal !== 'không rõ' && baseProfile.metal === candidateProfile.metal) {
    signals.push({ label: 'Chi tiết', value: `Cùng ánh ${candidateProfile.metal}` })
  }

  if (baseProfile.placement !== candidateProfile.placement) {
    signals.push({ label: 'Vị trí', value: getPlacementLabel(candidate) })
  }

  if (sharedMood[0]) {
    signals.push({ label: 'Cảm giác', value: sharedMood[0] })
  }

  if (sharedOccasion[0]) {
    signals.push({ label: 'Dịp dùng', value: sharedOccasion[0] })
  }

  return signals
}

const getMatchReason = (baseProduct, candidate) => {
  const signals = getMatchSignals(baseProduct, candidate)
  const reason = signals
    .slice(0, 2)
    .map((signal) => signal.value)
    .join(' · ')

  return reason || `Tạo điểm nhấn ở ${getPlacementLabel(candidate).toLowerCase()}`
}

const getMatchScore = (baseProduct, candidate) => {
  if (!baseProduct || !candidate || baseProduct.id === candidate.id) return -1

  const baseProfile = getProductProfile(baseProduct)
  const candidateProfile = getProductProfile(candidate)
  const sharedMoodCount = getSharedValues(candidateProfile.mood, baseProfile.mood).length
  const sharedOccasionCount = getSharedValues(candidateProfile.occasion, baseProfile.occasion).length
  const complementsPlacement = baseProfile.placement !== candidateProfile.placement
  const balancesWeight = (
    (baseProfile.weight === 'nổi' && candidateProfile.weight !== 'nổi') ||
    (candidateProfile.weight === 'nổi' && baseProfile.weight !== 'nổi')
  )
  let score = 0

  if (baseProduct.category !== candidate.category) score += 4
  if (complementsPlacement) score += 3
  if (baseProfile.color === candidateProfile.color) score += 5
  if (baseProfile.metal !== 'không rõ' && baseProfile.metal === candidateProfile.metal) score += 3
  if (baseProfile.weight === candidateProfile.weight) score += 1
  if (balancesWeight) score += 2
  score += sharedMoodCount * 2
  score += sharedOccasionCount * 1.4

  return score
}

const getMatchedProducts = (baseProduct, limit = 4) => {
  const usedCategories = new Set()
  const candidates = products
    .filter((candidate) => candidate.id !== baseProduct?.id)
    .map((candidate) => ({
      product: candidate,
      score: getMatchScore(baseProduct, candidate),
      reason: getMatchReason(baseProduct, candidate),
      signals: getMatchSignals(baseProduct, candidate),
    }))
    .sort((a, b) => (
      b.score - a.score ||
      COMPLEMENT_CATEGORY_ORDER.indexOf(a.product.category) - COMPLEMENT_CATEGORY_ORDER.indexOf(b.product.category) ||
      VI_COLLATOR.compare(a.product.name, b.product.name)
    ))

  const picked = candidates.filter((item) => {
    if (item.product.category === baseProduct?.category) return false
    if (usedCategories.has(item.product.category)) return false
    usedCategories.add(item.product.category)
    return true
  })

  if (picked.length >= limit) return picked.slice(0, limit)

  return [
    ...picked,
    ...candidates.filter((item) => !picked.some((pickedItem) => pickedItem.product.id === item.product.id)),
  ].slice(0, limit)
}

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

const toAbsoluteUrl = (path = '') => {
  if (!path) return `${SITE_URL}/`
  return path.startsWith('http') ? path : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

const getRoutePath = (route) => {
  if (route.name === 'home') return '/'
  if (route.name === 'collection') return getCategoryPath(route.category)
  if (route.name === 'concierge') return '/concierge'
  if (route.name === 'matching') return '/matching'
  if (route.name === 'care') return '/care'
  if (route.name === 'about') return '/about'
  if (route.name === 'contact') return '/contact'
  if (route.name === 'product' && route.id) return `/product/${route.id}`
  return '/404'
}

const getRouteSeo = (route, product) => {
  if (route.name === 'collection') {
    const category = route.category
    return {
      title: category ? `${category} ngọc | ${BRAND_NAME}` : `Bộ sưu tập trang sức ngọc | ${BRAND_NAME}`,
      description: category
        ? `Xem các mẫu ${category.toLowerCase()} ngọc của ${BRAND_NAME} với ảnh thật, video, chất liệu và gợi ý phối món phù hợp.`
        : `Khám phá bộ sưu tập hoa tai, vòng tay, vòng cổ, nhẫn và vòng kiềng ngọc của ${BRAND_NAME}.`,
      image: DEFAULT_SOCIAL_IMAGE,
      imageAlt: category ? `${category} ngọc ${BRAND_NAME}` : `Bộ sưu tập trang sức ngọc ${BRAND_NAME}`,
    }
  }

  if (route.name === 'product' && product) {
    return {
      title: `${product.name} | ${BRAND_NAME}`,
      description: `${product.shortDescription} Xem ảnh thật, chất liệu, ý nghĩa, gợi ý phối món và cách bảo quản trước khi chọn.`,
      image: product.previewImage,
      imageAlt: product.name,
    }
  }

  if (route.name === 'concierge') {
    return {
      title: `Tư vấn riêng | ${BRAND_NAME}`,
      description: `Gửi yêu cầu tư vấn để ${BRAND_NAME} gợi ý mẫu ngọc theo dáng đeo, phong cách và món muốn phối cùng.`,
      image: DEFAULT_SOCIAL_IMAGE,
      imageAlt: `Tư vấn chọn trang sức ngọc ${BRAND_NAME}`,
    }
  }

  if (route.name === 'matching') {
    return {
      title: `Phối món trang sức ngọc | ${BRAND_NAME}`,
      description: 'Xem gợi ý phối hoa tai, vòng cổ, vòng tay, nhẫn và vòng kiềng theo màu ngọc, chi tiết kim loại và cảm giác đeo.',
      image: DEFAULT_SOCIAL_IMAGE,
      imageAlt: `Gợi ý phối món trang sức ngọc ${BRAND_NAME}`,
    }
  }

  if (route.name === 'care') {
    return {
      title: `Chăm sóc và kiểm tra ngọc | ${BRAND_NAME}`,
      description: `Cách ${BRAND_NAME} kiểm tra ảnh, video, tình trạng mẫu, đóng gói và hướng dẫn bảo quản trang sức ngọc.`,
      image: DEFAULT_SOCIAL_IMAGE,
      imageAlt: `Kiểm tra và chăm sóc trang sức ngọc ${BRAND_NAME}`,
    }
  }

  if (route.name === 'about') {
    return {
      title: `Câu chuyện ${BRAND_NAME} | Chọn ngọc có cảm giác riêng`,
      description: `Tìm hiểu cách ${BRAND_NAME} chọn trang sức ngọc theo màu sắc, dáng đeo, độ bóng và cảm giác khi sử dụng.`,
      image: DEFAULT_SOCIAL_IMAGE,
      imageAlt: `Câu chuyện ${BRAND_NAME}`,
    }
  }

  if (route.name === 'contact') {
    return {
      title: `Liên hệ tư vấn | ${BRAND_NAME}`,
      description: `Liên hệ ${BRAND_NAME} để xem thêm ảnh thật, hỏi chất liệu, kích thước, dáng đeo và tình trạng từng mẫu trước khi chọn.`,
      image: DEFAULT_SOCIAL_IMAGE,
      imageAlt: `Liên hệ ${BRAND_NAME}`,
    }
  }

  if (route.name === 'notfound') {
    return {
      title: `Không tìm thấy trang | ${BRAND_NAME}`,
      description: `Trang bạn đang tìm không tồn tại. Quay lại trang chủ hoặc xem bộ sưu tập hiện có của ${BRAND_NAME}.`,
      image: DEFAULT_SOCIAL_IMAGE,
      imageAlt: BRAND_NAME,
    }
  }

  return {
    title: `${BRAND_NAME} | Trang sức ngọc chọn lọc`,
    description: `${BRAND_NAME} giới thiệu hoa tai, vòng tay, vòng cổ, nhẫn và vòng kiềng ngọc với ảnh và video sản phẩm.`,
    image: DEFAULT_SOCIAL_IMAGE,
    imageAlt: `Trang sức ngọc ${BRAND_NAME}`,
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

const setOptionalMetaTag = (selector, attrName, attrValue, content) => {
  const existing = document.head.querySelector(selector)
  if (!content) {
    existing?.remove()
    return
  }
  setMetaTag(selector, attrName, attrValue, content)
}

const updateStructuredData = (route, product, seo, canonicalHref) => {
  let script = document.head.querySelector('#cnp-structured-data')
  if (!script) {
    script = document.createElement('script')
    script.id = 'cnp-structured-data'
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }

  const organization = {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: BRAND_NAME,
    url: SITE_URL,
    email: contact.email,
  }
  const website = {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: BRAND_NAME,
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'vi-VN',
  }
  const currentPage = {
    '@type': 'WebPage',
    '@id': `${canonicalHref}#webpage`,
    url: canonicalHref,
    name: seo.title,
    description: seo.description,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    inLanguage: 'vi-VN',
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: toAbsoluteUrl(seo.image),
    },
  }

  const graph = [organization, website, currentPage]

  if (route.name === 'product' && product) {
    graph.push({
      '@type': 'Product',
      '@id': `${canonicalHref}#product`,
      name: product.name,
      description: seo.description,
      image: (product.galleryImages?.length ? product.galleryImages : [product.previewImage]).map(toAbsoluteUrl),
      brand: { '@id': `${SITE_URL}/#organization` },
      category: product.category,
      material: product.materials,
      url: canonicalHref,
      additionalProperty: [
        { '@type': 'PropertyValue', name: 'Tình trạng', value: product.availability },
        { '@type': 'PropertyValue', name: 'Ý nghĩa', value: product.meaning },
        { '@type': 'PropertyValue', name: 'Kiểm tra trước khi chọn', value: product.inspection },
      ],
    })
  }

  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph,
  })
}

const updateDocumentSeo = (route, product) => {
  const seo = getRouteSeo(route, product)
  const canonicalHref = `${SITE_URL}${getRoutePath(route)}`
  const imageHref = toAbsoluteUrl(seo.image)
  let canonical = document.head.querySelector('link[rel="canonical"]')

  document.title = seo.title
  setMetaTag('meta[name="description"]', 'name', 'description', seo.description)
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', seo.title)
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', seo.description)
  setMetaTag('meta[property="og:type"]', 'property', 'og:type', route.name === 'product' ? 'product' : 'website')
  setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalHref)
  setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', BRAND_NAME)
  setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', brand.locale)
  setMetaTag('meta[property="og:image"]', 'property', 'og:image', imageHref)
  setMetaTag('meta[property="og:image:alt"]', 'property', 'og:image:alt', seo.imageAlt || seo.title)
  setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', seo.title)
  setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', seo.description)
  setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', imageHref)
  setOptionalMetaTag('meta[property="product:category"]', 'property', 'product:category', route.name === 'product' ? product?.category : '')

  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }

  canonical.setAttribute('href', canonicalHref)
  updateStructuredData(route, product, seo, canonicalHref)
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

  if (sortMode === 'category') {
    return sorted.sort((a, b) => (
      getCategorySortRank(a.category) - getCategorySortRank(b.category) ||
      VI_COLLATOR.compare(a.name, b.name)
    ))
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

  if (path.startsWith('/collection/')) {
    const [, categorySlug] = path.split('/').filter(Boolean)
    const category = getCategoryFromSlug(categorySlug)
    return category ? { name: 'collection', category } : { name: 'notfound' }
  }

  if (path === '/concierge') {
    return { name: 'concierge' }
  }

  if (path === '/matching') {
    return { name: 'matching' }
  }

  if (path === '/care') {
    return { name: 'care' }
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
        filter: ['blur(2px)', 'blur(0px)'],
        duration,
        easing: 'outCubic',
      })

      if (isStagger) {
        animate(Array.from(node.children), {
          opacity: [0, 1],
          translateY: [14, 0],
          rotateX: [2, 0],
          filter: ['blur(2px)', 'blur(0px)'],
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
        threshold: 0.08,
        rootMargin: '0px 0px 12% 0px',
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
        if (rect.top < window.innerHeight * 0.98 && rect.bottom > 0) {
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
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const initialRoute = parseRoute()
    return initialRoute.name === 'collection' ? initialRoute.category || ALL_FILTER : ALL_FILTER
  })
  const [selectedOrigin, setSelectedOrigin] = useState(ALL_FILTER)
  const [selectedColor, setSelectedColor] = useState(ALL_FILTER)
  const [selectedMetal, setSelectedMetal] = useState(ALL_FILTER)
  const [selectedMood, setSelectedMood] = useState(ALL_FILTER)
  const [sortMode, setSortMode] = useState('featured')
  const deferredQuery = useDeferredValue(query)
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
    () => [ALL_FILTER, ...sortCategories(Array.from(new Set(products.map((product) => product.category))))],
    [],
  )
  const originOptions = useMemo(
    () => [ALL_FILTER, ...Array.from(new Set(products.map((product) => product.origin)))],
    [],
  )
  const colorOptions = useMemo(
    () => [ALL_FILTER, ...uniqueProfileValues(products, (profile) => profile.color)],
    [],
  )
  const metalOptions = useMemo(
    () => [ALL_FILTER, ...uniqueProfileValues(products, (profile) => profile.metal, { exclude: ['không rõ'] })],
    [],
  )
  const moodOptions = useMemo(
    () => [ALL_FILTER, ...uniqueProfileValues(products, (profile) => profile.mood)],
    [],
  )

  useEffect(() => {
    if (route.name !== 'collection') return
    const routeCategory = route.category || ALL_FILTER
    setSelectedCategory((current) => (current === routeCategory ? current : routeCategory))
  }, [route.name, route.category])

  const filteredProducts = useMemo(() => {
    const term = deferredQuery.trim().toLowerCase()
    const matched = products.filter((product) => {
      const profile = getProductProfile(product)

      return (
        (!term || getSearchText(product).includes(term)) &&
        (selectedCategory === ALL_FILTER || product.category === selectedCategory) &&
        (selectedOrigin === ALL_FILTER || product.origin === selectedOrigin) &&
        (selectedColor === ALL_FILTER || profile.color === selectedColor) &&
        (selectedMetal === ALL_FILTER || profile.metal === selectedMetal) &&
        (selectedMood === ALL_FILTER || profile.mood.includes(selectedMood))
      )
    })
    return sortProductList(matched, sortMode)
  }, [deferredQuery, selectedCategory, selectedOrigin, selectedColor, selectedMetal, selectedMood, sortMode])

  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category)
    if (route.name === 'collection') {
      navigate(getCategoryPath(category))
    }
  }, [navigate, route.name])

  const clearCollectionControls = useCallback(() => {
    setQuery('')
    setSelectedCategory(ALL_FILTER)
    setSelectedOrigin(ALL_FILTER)
    setSelectedColor(ALL_FILTER)
    setSelectedMetal(ALL_FILTER)
    setSelectedMood(ALL_FILTER)
    setSortMode('featured')
    if (route.name === 'collection' && route.category) {
      navigate('/collection')
    }
  }, [navigate, route.category, route.name])

  const selectedProduct =
    route.name === 'product' && route.id
      ? products.find((item) => item.id === route.id) || featuredProduct
      : featuredProduct
  const visibleProductKey = filteredProducts.map((product) => product.id).join('|')
  const matchedProducts = useMemo(() => getMatchedProducts(selectedProduct, 4), [selectedProduct])

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
              colors={colorOptions}
              metals={metalOptions}
              moods={moodOptions}
              selectedCategory={selectedCategory}
              setSelectedCategory={handleCategoryChange}
              selectedOrigin={selectedOrigin}
              setSelectedOrigin={setSelectedOrigin}
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              selectedMetal={selectedMetal}
              setSelectedMetal={setSelectedMetal}
              selectedMood={selectedMood}
              setSelectedMood={setSelectedMood}
              sortMode={sortMode}
              setSortMode={setSortMode}
              onSelect={openProduct}
              onClearSearch={clearCollectionControls}
            />
          ) : route.name === 'concierge' ? (
            <ConciergePage onNavigate={navigate} />
          ) : route.name === 'matching' ? (
            <MatchingPage products={products} onSelect={openProduct} />
          ) : route.name === 'care' ? (
            <CarePage onNavigate={navigate} />
          ) : route.name === 'about' ? (
            <AboutPage onNavigate={navigate} />
          ) : route.name === 'contact' ? (
            <ContactBand />
          ) : route.name === 'product' ? (
            <DetailSection
              product={selectedProduct}
              matchedProducts={matchedProducts}
              onSelect={openProduct}
              onBack={() => navigate('/collection')}
            />
          ) : (
            <NotFoundPage onNavigate={navigate} />
          )}
        </main>
        <Footer onNavigate={navigate} />
      </div>
    </>
  )
}

function HomePage({ products, onExplore, onSelect }) {
  const heroProduct = getProductById('cnp-009') || products[0]
  const signatureProducts = [heroProduct, ...products.filter((product) => product.id !== heroProduct.id)].slice(0, 5)

  return (
    <>
      <ProductDepthScene product={heroProduct} onExplore={onExplore} onSelect={onSelect} />
      <HomeSignature products={signatureProducts} onExplore={onExplore} onSelect={onSelect} />
      <TrustBand compact />
    </>
  )
}

function HomeSignature({ products, onExplore, onSelect }) {
  return (
    <section className="home-signature section">
      <div className="home-signature-heading reveal-up">
        <h2>Mỗi món ngọc là một câu chuyện</h2>
        <button className="text-link collection-link" onClick={onExplore}>
          Xem bộ sưu tập
          <ArrowRight className="motion-cue" size={16} />
        </button>
      </div>
      <div className="signature-rail reveal-stagger" aria-label="Mẫu nổi bật">
        {products.map((product, index) => (
          <button
            className={`signature-card ${index === 0 ? 'is-large' : ''}`}
            key={product.id}
            onClick={() => onSelect(product)}
            data-testid={`signature-card-${product.id}`}
            type="button"
          >
            <ProductImageFrame
              src={product.previewImage}
              alt={product.name}
              className="signature-image"
              sizes={index === 0 ? '(max-width: 860px) 100vw, 48vw' : '(max-width: 860px) 45vw, 16vw'}
            />
            <span>
              <small>{product.category}</small>
              <strong>{product.name}</strong>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

function ConciergePage({ onNavigate }) {
  const preferenceGroups = [
    {
      label: 'Mình muốn tìm',
      options: ['Hoa tai', 'Vòng tay', 'Vòng cổ', 'Nhẫn'],
    },
    {
      label: 'Phong cách',
      options: ['Thanh lịch', 'Dịu nhẹ', 'Nổi bật', 'Dễ đeo mỗi ngày'],
    },
    {
      label: 'Cần thêm',
      options: ['Ảnh cận', 'Video xoay', 'Gợi ý phối', 'Kiểm tra kích thước'],
    },
  ]
  const [selectedPreferences, setSelectedPreferences] = useState(() => ({
    'Mình muốn tìm': 'Hoa tai',
    'Phong cách': 'Thanh lịch',
    'Cần thêm': 'Ảnh cận',
  }))

  const selectPreference = (groupLabel, option) => {
    setSelectedPreferences((current) => ({
      ...current,
      [groupLabel]: option,
    }))
  }

  return (
    <section className="luxury-page section concierge-page">
      <div className="luxury-page-hero reveal-up">
        <div>
          <h1>Tư vấn riêng, chọn ít nhưng đúng.</h1>
          <p>
            Nếu bạn chưa chắc mẫu nào hợp dáng đeo, màu da hoặc món muốn phối cùng,
            {BRAND_NAME} sẽ gợi ý bằng ảnh thật, video và ghi chú ngắn gọn.
          </p>
          <div className="luxury-hero-actions">
            <a className="button primary" href={getProductInquiryHref()} {...CONTACT_LINK_PROPS}>
              Gửi yêu cầu tư vấn <ContactIcon size={18} />
            </a>
            <button className="text-link" onClick={() => onNavigate('/collection')}>
              Xem bộ sưu tập <ArrowRight className="motion-cue" size={16} />
            </button>
          </div>
        </div>
        <div className="consult-panel" aria-label="Gợi ý thông tin tư vấn">
          {preferenceGroups.map((group) => (
            <div className="preference-row" key={group.label}>
              <span>{group.label}</span>
              <div>
                {group.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={selectedPreferences[group.label] === option ? 'is-selected' : ''}
                    onClick={() => selectPreference(group.label, option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="concierge-flow reveal-stagger">
        {[
          ['01', 'Gửi cảm giác bạn muốn', 'Một mẫu đang thích, dịp cần đeo hoặc phong cách bạn muốn giữ.'],
          ['02', 'Xem ảnh/video thật', `${BRAND_NAME} gửi góc cận, dáng đeo, tình trạng mẫu và điểm cần kiểm tra.`],
          ['03', 'Chốt mẫu phù hợp', 'Chọn món chính và món phối cùng nếu bạn muốn hoàn thiện một set nhỏ.'],
        ].map(([number, title, text]) => (
          <article className="numbered-note" key={number}>
            <span>{number}</span>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <div className="concierge-media-row reveal-up">
        <ProductImageFrame
          src="/assets/product-gallery/images/cnp-products/cnp-002-01.jpg"
          alt="Hoa tai ngọc xanh dáng rơi"
          className="concierge-media"
          sizes="(max-width: 860px) 100vw, 38vw"
        />
        <div>
          <h2>Không cần chọn vội.</h2>
          <p>
            Với trang sức ngọc, khác biệt thường nằm ở sắc ngọc, độ bóng, kích thước và cảm giác khi lên người.
            Tư vấn tốt nên giúp bạn nhìn rõ những điểm đó trước khi quyết định.
          </p>
        </div>
      </div>
    </section>
  )
}

function MatchingPage({ products, onSelect }) {
  const [selectedId, setSelectedId] = useState('cnp-003')
  const selectedProduct = products.find((product) => product.id === selectedId) || products[0]
  const matchedSet = useMemo(() => getMatchedProducts(selectedProduct, 4), [selectedProduct])
  const selectedProfile = getProductProfile(selectedProduct)

  return (
    <section className="luxury-page section matching-page">
      <div className="luxury-page-hero matching-hero reveal-up">
        <div>
          <h1>Phối món theo sắc ngọc, không theo may rủi.</h1>
          <p>
            Chọn một món chính, hệ thống sẽ gợi ý món phối cùng dựa trên tông màu,
            chi tiết kim loại, cảm giác đeo và vị trí trên cơ thể.
          </p>
          <a className="button secondary" href="#match-builder">
            Tìm món phối cùng
          </a>
        </div>
        <div className="match-selector" aria-label="Chọn mẫu chính để phối">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              className={product.id === selectedProduct.id ? 'is-selected' : ''}
              onClick={() => setSelectedId(product.id)}
            >
              <span>{product.category}</span>
              <strong>{product.name}</strong>
            </button>
          ))}
        </div>
      </div>
      <div className="match-builder reveal-stagger" id="match-builder">
        <button className="match-base-card" type="button" onClick={() => onSelect(selectedProduct)}>
          <ProductImageFrame
            src={selectedProduct.previewImage}
            alt={selectedProduct.name}
            className="match-base-image"
            loading="eager"
            sizes="(max-width: 860px) 100vw, 34vw"
          />
          <span>
            <small>Món chính</small>
            <strong>{selectedProduct.name}</strong>
            <em>{selectedProduct.shortDescription}</em>
            <span className="match-base-tags" aria-label="Đặc điểm món chính">
              <b>{selectedProfile.color}</b>
              {selectedProfile.metal !== 'không rõ' && <b>{selectedProfile.metal}</b>}
              {selectedProfile.mood.slice(0, 2).map((mood) => <b key={mood}>{mood}</b>)}
            </span>
          </span>
        </button>
        <div className="match-set">
          {matchedSet.map((match) => (
            <MatchProductCard
              key={match.product.id}
              item={match.product}
              reason={match.reason}
              signals={match.signals}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function CarePage({ onNavigate }) {
  const careNotes = [
    ['Kiểm tra trước khi gửi', 'Gửi ảnh/video xác nhận để bạn xem lại sắc ngọc, bề mặt, khóa/móc và tình trạng mẫu.'],
    ['Đóng gói riêng', 'Mỗi món được giữ riêng để hạn chế ma sát, trầy mặt ngọc hoặc cong móc trong quá trình vận chuyển.'],
    ['Bảo quản sau khi đeo', 'Lau khô bằng khăn mềm, tránh va đập mạnh, nước hoa và mỹ phẩm bám trực tiếp lên chi tiết kim loại.'],
  ]

  return (
    <section className="luxury-page section care-page">
      <div className="luxury-page-hero care-hero reveal-up">
        <div>
          <h1>Niềm tin nằm ở những góc cận.</h1>
          <p>
            Trang sức ngọc nên được xem kỹ trước khi chọn: sắc, vân, độ bóng, khóa/móc,
            kích thước và cách đóng gói đều cần rõ ràng.
          </p>
          <button className="button secondary" onClick={() => onNavigate('/concierge')}>
            Hỏi thêm về một mẫu
          </button>
        </div>
        <ProductImageFrame
          src="/assets/product-gallery/images/cnp-products/cnp-003-01.jpg"
          alt="Hoa tai ngọc xanh được chụp cận chất liệu"
          className="care-hero-image"
          loading="eager"
          sizes="(max-width: 860px) 100vw, 38vw"
        />
      </div>
      <div className="care-checklist reveal-stagger">
        {careNotes.map(([title, text]) => (
          <article className="care-note" key={title}>
            <CheckCircle2 size={18} />
            <div>
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </div>
      <AssuranceProcess />
      <div className="care-ritual reveal-up">
        <h2>Cách giữ độ bóng hằng ngày</h2>
        <ol>
          <li>Đeo sau khi đã dùng nước hoa hoặc mỹ phẩm.</li>
          <li>Tháo khi rửa tay, tắm, ngủ hoặc làm việc dễ va chạm.</li>
          <li>Cất riêng trong túi mềm hoặc hộp riêng, tránh để chung với vật sắc cạnh.</li>
        </ol>
      </div>
    </section>
  )
}

function AboutPage({ onNavigate }) {
  return (
    <>
      <section className="luxury-page section about-page">
        <div className="luxury-page-hero about-hero reveal-up">
          <div>
            <h1>{BRAND_NAME} chọn ngọc theo cảm giác khi lên người.</h1>
            <p>
              Một món trang sức đẹp không chỉ nằm ở màu sắc. Nó còn nằm ở dáng đeo,
              độ sáng, sự cân bằng với gương mặt, cổ tay và cách bạn muốn xuất hiện.
            </p>
            <button className="text-link" onClick={() => onNavigate('/concierge')}>
              Bắt đầu tư vấn riêng <ArrowRight className="motion-cue" size={16} />
            </button>
          </div>
          <ProductImageFrame
            src="/assets/product-gallery/images/cnp-products/cnp-009-01.jpg"
            alt={`Chuỗi ngọc xanh phối mặt của ${BRAND_NAME}`}
            className="about-hero-image"
            loading="eager"
            sizes="(max-width: 860px) 100vw, 38vw"
          />
        </div>
      </section>
      <TrustBand />
      <AssuranceProcess />
      <StoryBand />
    </>
  )
}

function ProductDepthScene({ product, onExplore, onSelect }) {
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
    <section className="depth-scene cinematic-hero" id="top" ref={sceneRef} aria-label={BRAND_NAME}>
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
          <h1>Ngắm sâu từng lớp vân</h1>
          <p>Trang sức ngọc được chọn theo sắc, vân và cảm giác khi lên người.</p>
          <div className="hero-actions reveal-stagger">
            <button className="button primary" onClick={onExplore}>
              Xem bộ sưu tập
            </button>
          </div>
        </div>
        {product && (
          <button className="hero-product-glimpse" type="button" onClick={() => onSelect(product)}>
            <ProductImageFrame
              src={product.previewImage}
              alt={product.name}
              className="hero-glimpse-image"
              sizes="112px"
            />
            <span>
              <small>{product.category}</small>
              <strong>{product.name}</strong>
            </span>
            <ArrowRight size={15} />
          </button>
        )}
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
    ['Tư vấn', '/concierge', 'concierge'],
    ['Phối món', '/matching', 'matching'],
    ['Chăm sóc', '/care', 'care'],
    ['Câu chuyện', '/about', 'about'],
  ]

  return (
    <header className="site-header">
      <button className="icon-button mobile-only" aria-label="Mở menu" onClick={() => setMenuOpen(true)}>
        <Menu size={24} />
      </button>
      <button className="brand" onClick={() => onNavigate('/')} aria-label={`${BRAND_NAME} home`}>
        {BRAND_NAME}
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
            <span className="brand mobile-brand">{BRAND_NAME}</span>
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
  colors,
  metals,
  moods,
  selectedCategory,
  setSelectedCategory,
  selectedOrigin,
  setSelectedOrigin,
  selectedColor,
  setSelectedColor,
  selectedMetal,
  setSelectedMetal,
  selectedMood,
  setSelectedMood,
  sortMode,
  setSortMode,
  onSelect,
  onClearSearch,
}) {
  const collectionRef = useRef(null)
  const activeFilterCount = [
    query,
    selectedCategory !== ALL_FILTER,
    selectedOrigin !== ALL_FILTER,
    selectedColor !== ALL_FILTER,
    selectedMetal !== ALL_FILTER,
    selectedMood !== ALL_FILTER,
    sortMode !== 'featured',
  ]
    .filter(Boolean).length
  const showOriginFilter = origins.length > 2
  const isEditorialView = products.length > 0 && activeFilterCount === 0 && sortMode === 'featured'
  const isCategoryView = selectedCategory !== ALL_FILTER
  const editorialLead = isEditorialView
    ? products.find((product) => product.id === 'cnp-003') || products[0]
    : null
  const editorialGroups = useMemo(() => {
    if (!isEditorialView) return []
    return categories
      .filter((category) => category !== ALL_FILTER)
      .map((category) => ({
        category,
        items: products.filter((product) => product.category === category && product.id !== editorialLead?.id),
      }))
      .filter((group) => group.items.length > 0)
  }, [categories, editorialLead?.id, isEditorialView, products])
  const collectionStats = [
    ['Tất cả mẫu', `${totalCount} mẫu`],
    ['Đang xem', `${products.length} mẫu`],
    ['Bộ lọc', activeFilterCount ? `${activeFilterCount} đang bật` : 'Chưa lọc'],
    ['Media', 'Ảnh & video'],
  ]
  const collectionTitle = isCategoryView ? selectedCategory : 'Mỗi món ngọc là một câu chuyện'
  const collectionCopy = isCategoryView
    ? `Xem riêng các mẫu ${selectedCategory.toLowerCase()} với ảnh thật, video và gợi ý phối cùng theo sắc ngọc.`
    : 'Chọn dáng ngọc hợp với phong cách của bạn. Mỗi mẫu có ảnh thật, video và ghi chú riêng.'
  const categoryGuide = isCategoryView ? CATEGORY_GUIDES[selectedCategory] : null

  useEffect(() => {
    const root = collectionRef.current
    if (!root || prefersReducedMotion()) return

    const items = Array.from(root.querySelectorAll('.collection-feature, .category-product-card, .product-card'))
    if (!items.length) return

    animate(items, {
      opacity: [0, 1],
      translateY: [18, 0],
      filter: ['blur(8px)', 'blur(0px)'],
      duration: 420,
      easing: 'outCubic',
      delay: stagger(34),
    })
  }, [visibleProductsKey(products), isEditorialView])

  return (
    <section className="collection section" id="collection" ref={collectionRef}>
      <div className="section-heading reveal-up">
        <div>
          <h1>{collectionTitle}</h1>
        </div>
        <button className="text-link" onClick={onClearSearch} disabled={!activeFilterCount}>
          {activeFilterCount ? 'Xóa bộ lọc' : 'Tất cả mẫu'} <ArrowRight className="motion-cue" size={16} />
        </button>
      </div>
      <p className="collection-note reveal-up">
        {collectionCopy}
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
          <span>Tìm mẫu</span>
          <input
            value={query}
            aria-label="Tìm mẫu trong bộ sưu tập"
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
                aria-current={category === selectedCategory ? 'page' : undefined}
              >
                {category === ALL_FILTER ? 'Tất cả' : category}
              </button>
            ))}
          </div>
        </div>
        <FilterChipGroup
          icon={<Gem size={16} />}
          label="Sắc ngọc"
          options={colors}
          value={selectedColor}
          onChange={setSelectedColor}
          allLabel="Tất cả"
        />
        <FilterChipGroup
          icon={<BadgeCheck size={16} />}
          label="Chi tiết"
          options={metals}
          value={selectedMetal}
          onChange={setSelectedMetal}
          allLabel="Tất cả"
        />
        <FilterChipGroup
          icon={<Sparkles size={16} />}
          label="Cảm giác"
          options={moods}
          value={selectedMood}
          onChange={setSelectedMood}
          allLabel="Tất cả"
        />
        {showOriginFilter && (
          <div className="filter-group" aria-label="Lọc theo bộ sưu tập">
            <span className="filter-label">
              <MapPin size={16} />
              Bộ sưu tập
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
        )}
        <label className="sort-control">
          <SlidersHorizontal size={16} />
          <span>Sắp xếp</span>
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
            <option value="featured">Gợi ý</option>
            <option value="name">Tên A-Z</option>
            <option value="category">Dòng sản phẩm</option>
          </select>
        </label>
      </div>
      <p className="collection-result-count">
        Đang hiển thị {products.length} / {totalCount} mẫu
      </p>
      {categoryGuide && (
        <CategoryGuide category={selectedCategory} guide={categoryGuide} />
      )}
      {products.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có mẫu nào khớp với bộ lọc này.</p>
          <button className="button secondary" onClick={onClearSearch}>
            Xem lại bộ sưu tập
          </button>
        </div>
      ) : isEditorialView ? (
        <div className="collection-editorial">
          <FeaturedProductPanel product={editorialLead} onSelect={onSelect} />
          <div className="category-sections reveal-stagger">
            {editorialGroups.map((group) => (
              <CategoryProductRow
                key={group.category}
                category={group.category}
                products={group.items}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      ) : (
        <div
          className="product-grid collection-focus-grid reveal-stagger parallax-layer"
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

const visibleProductsKey = (items) => items.map((product) => product.id).join('|')

function CategoryGuide({ category, guide }) {
  return (
    <aside className="category-guide reveal-up" aria-label={`Gợi ý chọn ${category.toLowerCase()}`}>
      <div>
        <p className="section-kicker">{category}</p>
        <h2>{guide.title}</h2>
        <p>{guide.text}</p>
      </div>
      <ul>
        {guide.points.map((point) => (
          <li key={point}>
            <CheckCircle2 size={16} />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}

function FilterChipGroup({ icon, label, options, value, onChange, allLabel = 'Tất cả' }) {
  if (!options?.length) return null

  return (
    <div className="filter-group compact-filter" aria-label={`Lọc theo ${label.toLowerCase()}`}>
      <span className="filter-label">
        {icon}
        {label}
      </span>
      <div className="filter-chips">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={option === value ? 'filter-chip is-active' : 'filter-chip'}
            onClick={() => onChange(option)}
            aria-pressed={option === value}
          >
            {option === ALL_FILTER ? allLabel : option}
          </button>
        ))}
      </div>
    </div>
  )
}

function FeaturedProductPanel({ product, onSelect }) {
  if (!product) return null
  const mediaStats = getProductMediaStats(product)

  return (
    <button className="collection-feature" type="button" onClick={() => onSelect(product)}>
      <ProductImageFrame
        src={product.previewImage}
        alt={product.name}
        className="collection-feature-image"
        loading="eager"
        sizes="(max-width: 860px) 100vw, 58vw"
      />
      <span className="collection-feature-copy">
        <small>{product.category}</small>
        <strong>{product.name}</strong>
        <span>{product.shortDescription}</span>
        <em>{mediaStats.summary}</em>
      </span>
    </button>
  )
}

function CategoryProductRow({ category, products, onSelect }) {
  return (
    <section className="category-section" aria-label={category}>
      <div className="category-section-heading">
        <h2>{category}</h2>
        <span>{products.length} mẫu</span>
      </div>
      <div className="category-product-row">
        {products.map((product) => (
          <button
            key={product.id}
            type="button"
            className="category-product-card"
            data-testid={`category-product-${product.id}`}
            onClick={() => onSelect(product)}
          >
            <ProductImageFrame
              src={product.previewImage}
              alt={product.name}
              className="category-product-image"
              sizes="(max-width: 860px) 45vw, 18vw"
            />
            <span>{product.name}</span>
          </button>
        ))}
      </div>
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
  const [isLoaded, setIsLoaded] = useState(false)
  const optimizedSrcSet = getOptimizedImageSrcSet(src)

  return (
    <picture className={`media-picture ${isLoaded ? 'is-loaded' : ''}`}>
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
        onLoad={() => setIsLoaded(true)}
      />
    </picture>
  )
})

function ProductImageFrame({ src, alt, className = 'product-image', loading = 'lazy', sizes = '(max-width: 860px) 45vw, 25vw' }) {
  const mediaId = src?.match(/cnp-\d{3}/)?.[0]
  const frameClassName = mediaId ? `${className} media-${mediaId}` : className

  return (
    <span className={frameClassName}>
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

function DetailSection({ product, matchedProducts, onSelect, onBack }) {
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

    const specRows = Array.from(root.querySelectorAll('.detail-disclosure'))
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

  useEffect(() => {
    const mediaElement = mainMediaRef.current
    if (activeMedia?.type !== 'video' || !mediaElement) return undefined

    mediaElement.muted = true
    mediaElement.loop = true
    mediaElement.playsInline = true

    const playPromise = mediaElement.play()
    if (playPromise?.catch) {
      playPromise.catch(() => {})
    }

    return () => {
      mediaElement.pause()
    }
  }, [activeMedia])

  const detailFacts = [
    [BadgeCheck, 'Mã mẫu', product.id.toUpperCase()],
    [Gem, 'Chất liệu', product.materials],
    [Camera, 'Media', formatMediaCount(mediaItems)],
    [Clock3, 'Tư vấn', product.availability],
  ]
  const detailSections = [
    ['Chất liệu', product.materials],
    ['Dáng & kích thước', `${product.sizeNote}. ${product.availability}.`],
    ['Ý nghĩa', product.meaning],
    ['Kiểm tra trước khi chọn', product.inspection],
    ['Bảo quản', `${product.care} ${product.shippingNote}`],
  ]
  const hasProductVideos = mediaStats.videoCount > 0
  const inquiryHref = getProductInquiryHref(product)
  const mediaNoteCopy = hasProductVideos
    ? 'Bạn có thể xem ảnh cận, video xoay chậm và góc vân rõ hơn để cảm nhận bề mặt, độ bóng và dáng đeo.'
    : `Nếu bạn quan tâm một mẫu, ${BRAND_NAME} có thể gửi thêm ảnh dưới ánh sáng tự nhiên, góc cận vân và ảnh đặt trên tay để bạn yên tâm hơn trước khi quyết định.`
  const assuranceItems = [
    [Images, 'Media riêng của mẫu', mediaNoteCopy],
    [ClipboardCheck, 'Điểm cần nhìn kỹ', product.inspection],
    [Ruler, 'Kích thước & dáng đeo', product.sizeNote],
    [PackageCheck, 'Trước khi gửi', product.shippingNote],
  ]
  const consultationSteps = [
    `Gửi yêu cầu về ${product.name}.`,
    'Nhận thêm ảnh/video cận nếu bạn cần kiểm tra kỹ hơn.',
    'Xác nhận tình trạng, kích thước và món phối cùng trước khi chốt.',
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
                aria-label={`${media.type === 'video' ? 'Xem video tự phát' : 'Xem trước hình'} ${product.name}: ${media.label}`}
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
            className={`main-image main-media ${activeMedia.type === 'video' ? 'is-video' : ''}`}
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
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                aria-label={`${product.name} - ${activeMedia.label}`}
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
          <div className="detail-facts" aria-label="Thông tin nhanh">
            {detailFacts.map(([Icon, label, value]) => (
              <span key={label}>
                <Icon size={16} />
                <small>{label}</small>
                <strong>{value}</strong>
              </span>
            ))}
          </div>
          <div className="detail-highlights">
            {(product.highlights || []).map((highlight) => (
              <span key={highlight}>
                <CheckCircle2 size={16} />
                {highlight}
              </span>
            ))}
          </div>
          <div className="detail-actions reveal-stagger">
            <a className="button primary wide" href={inquiryHref} {...CONTACT_LINK_PROPS}>
              {CONTACT_ACTION_LABEL} <ContactIcon size={18} />
            </a>
          </div>
        </article>
      </div>
      <div className="detail-information-grid reveal-stagger">
        <div className="detail-assurance-panel">
          <div className="detail-assurance-heading">
            <p className="section-kicker">Trước khi chọn</p>
            <h2>Nhìn kỹ những điểm đáng tiền.</h2>
          </div>
          <div className="detail-assurance-grid">
            {assuranceItems.map(([Icon, title, text]) => (
              <article className="detail-assurance-item" key={title}>
                <Icon size={17} />
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="detail-spec-panel">
          <div className="detail-disclosures">
            {detailSections.map(([title, value], index) => (
              <DisclosureItem key={title} title={title} defaultOpen={index === 0}>
                {value}
              </DisclosureItem>
            ))}
          </div>
          <div className="detail-consultation-mini">
            <strong>Tư vấn riêng cho mẫu này</strong>
            <ol>
              {consultationSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
      <AssuranceProcess compact />
      <div
        className="media-related related-only parallax-layer"
        data-parallax-speed="0.12"
        data-parallax-axis="y"
        data-parallax-direction="reverse"
        data-parallax-depth="0.5"
        data-parallax-rotate="0.05"
        data-parallax-rotate-axis="x"
      >
        <div className="related">
          <h3>Phối cùng món này</h3>
          <p className="related-note">
            Gợi ý dựa trên tông ngọc, chi tiết kim loại và vị trí đeo để tạo một set gọn, không quá nhiều món.
          </p>
          <div className="match-set detail-match-set">
            {matchedProducts.map((match) => (
              <MatchProductCard
                key={match.product.id}
                item={match.product}
                reason={match.reason}
                signals={match.signals}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function DisclosureItem({ title, children, defaultOpen = false }) {
  return (
    <details className="detail-disclosure" open={defaultOpen}>
      <summary>
        <span>{title}</span>
        <ChevronDown size={18} />
      </summary>
      <p>{children}</p>
    </details>
  )
}

function MatchProductCard({ item, reason, signals = [], onSelect }) {
  return (
    <button className="match-product-card" type="button" onClick={() => onSelect(item)}>
      <ProductImageFrame
        src={item.previewImage}
        alt={item.name}
        className="match-product-image"
        sizes="(max-width: 860px) 44vw, 16vw"
      />
      <span>
        <small>{getCategorySlotLabel(item.category)}</small>
        <strong>{item.name}</strong>
        <em>{reason}</em>
        {signals.length > 0 && (
          <span className="match-signal-row" aria-label="Lý do phối hợp">
            {signals.slice(0, 3).map((signal) => (
              <b key={`${item.id}-${signal.label}-${signal.value}`}>
                {signal.label}: {signal.value}
              </b>
            ))}
          </span>
        )}
      </span>
    </button>
  )
}

function TrustBand({ compact = false }) {
  return (
    <section className={`trust-band section reveal-stagger ${compact ? 'is-compact' : ''}`} id="trust">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Niềm tin khi chọn ngọc</p>
          <h1>Ít mẫu hơn. Rõ thông tin hơn.</h1>
        </div>
      </div>
      <div className="trust-grid">
        {TRUST_VALUES.map((value, index) => (
          <TrustCard key={value.title} index={index + 1} title={value.title} description={value.description} />
        ))}
      </div>
    </section>
  )
}

function TrustCard({ index, title, description }) {
  const trustTilt = usePointerTilt({ intensity: 8, lift: 6 })

  return (
    <article
      className="trust-card"
      onPointerMove={trustTilt.onPointerMove}
      onPointerLeave={trustTilt.onPointerLeave}
    >
      <span>{String(index).padStart(2, '0')}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  )
}

function AssuranceProcess({ compact = false }) {
  return (
    <section className={`assurance-process reveal-stagger ${compact ? 'is-compact' : ''}`} aria-label="Quy trình kiểm tra và tư vấn">
      <div className="assurance-process-heading">
        <p className="section-kicker">Quy trình rõ ràng</p>
        <h2>Từ xem mẫu đến xác nhận trước khi gửi.</h2>
      </div>
      <div className="assurance-process-steps">
        {TRUST_PROCESS_STEPS.map(([number, title, text]) => (
          <article key={number}>
            <span>{number}</span>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
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
          src="/assets/product-gallery/images/cnp-products/cnp-003-01.jpg"
          alt={`Cận cảnh trang sức ngọc của ${BRAND_NAME}`}
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
          {BRAND_NAME} chọn từng mẫu ngọc theo màu sắc, dáng đeo, độ bóng và sự hài hòa khi lên người.
          Mỗi món hướng đến vẻ đẹp tinh tế, dễ phối và có thể đồng hành lâu dài.
        </p>
        <div className="story-highlights">
          <p>
            <span>Dòng sản phẩm</span> Hoa tai, vòng tay, vòng cổ, nhẫn, vòng kiềng
          </p>
          <p>
            <span>Quy trình</span> Chọn mẫu, kiểm tra ảnh/video, xác nhận tình trạng trước khi gửi
          </p>
          <p>
            <span>Tư vấn</span> Gợi ý theo phong cách, dáng đeo và món muốn phối cùng
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
    [MapPin, 'Dòng sản phẩm', contact.regions, null],
    [Mail, 'Email', contact.email, `mailto:${contact.email}`],
    ...(contact.zalo ? [[MessageCircle, 'Nhắn tư vấn', 'Zalo / WhatsApp', contact.zalo]] : []),
    [Clock3, 'Giờ làm việc', '09:00 - 18:00', null],
  ]
  const consultationSteps = [
    'Gửi ảnh mẫu bạn thích hoặc mô tả phong cách đang tìm.',
    `${BRAND_NAME} gợi ý mẫu, kích thước và ý nghĩa hợp với bạn.`,
    'Xem thêm ảnh cận, tình trạng mẫu và cách bảo quản trước khi quyết định.',
  ]

  return (
    <section className="contact-page section reveal-up" id="contact">
      <div className="contact-hero">
        <p className="section-kicker">Liên hệ</p>
        <h1>Xem kỹ bằng ảnh thật trước khi chọn.</h1>
        <p>
          Nếu bạn chưa chắc mẫu nào hợp cổ tay, phong cách hoặc món muốn phối cùng,
          cứ gửi yêu cầu để {BRAND_NAME} gợi ý theo chất liệu, kích thước và cách đeo.
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
          <small>Gửi ảnh phong cách bạn thích hoặc nhu cầu đang tìm, {BRAND_NAME} sẽ gợi ý mẫu phù hợp.</small>
        </div>
      </div>
    </section>
  )
}

function Footer({ onNavigate }) {
  return (
    <footer className="footer">
      <div>
        <strong>{BRAND_NAME}</strong>
        <p>Trang sức ngọc được chọn theo màu sắc, dáng đeo và cảm giác khi sử dụng.</p>
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
