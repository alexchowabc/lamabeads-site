const cleanUrl = (value) => String(value || '').replace(/\/+$/, '')

export const brand = {
  name: import.meta.env.VITE_BRAND_NAME || 'Châu Ngọc Phúc',
  siteUrl: cleanUrl(import.meta.env.VITE_SITE_URL || 'https://chaungocphuc.com'),
  locale: 'vi_VN',
  language: 'vi-VN',
  productLine: 'trang sức ngọc',
  socialImageAlt: 'Trang sức ngọc chọn lọc',
}

export const contact = {
  email: import.meta.env.VITE_CONTACT_EMAIL || 'lamabeads@gmail.com',
  phone: import.meta.env.VITE_CONTACT_PHONE || '',
  zalo: import.meta.env.VITE_CONTACT_URL || '',
  regions: 'Hoa tai · Vòng tay · Vòng cổ · Vòng kiềng',
}
