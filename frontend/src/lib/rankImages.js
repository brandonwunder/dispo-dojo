// Maps each rank to its avatar image path and card border color.
// Replace placeholder paths with real AI-generated images as they're created.

export const RANK_IMAGES = {
  initiate:       '/avatars/rank-1-initiate.webp',
  scout:          '/avatars/rank-2-scout.webp',
  shinobi:        '/avatars/rank-3-shinobi.webp',
  shadow:         '/avatars/rank-4-shadow.webp',
  blade:          '/avatars/rank-5-blade.webp',
  jonin:          '/avatars/rank-6-jonin.webp',
  'shadow-master':'/avatars/rank-7-shadow-master.webp',
  kage:           '/avatars/rank-8-kage.webp',
}

export const RANK_BADGE_COLOR = {
  initiate:       '#9ca3af',
  scout:          '#00C6FF',
  shinobi:        '#7F00FF',
  shadow:         '#6b7280',
  blade:          '#3b82f6',
  jonin:          '#E53935',
  'shadow-master':'#374151',
  kage:           '#F6C445',
}

export const RANK_LABELS = {
  initiate: 'Initiate', scout: 'Scout', shinobi: 'Shinobi',
  shadow: 'Shadow', blade: 'Blade', jonin: 'Jonin',
  'shadow-master': 'Shadow Master', kage: 'Kage',
}

export const PLACEHOLDER = '/avatars/placeholder.svg'

/** Returns the avatar image URL for a rank, with placeholder fallback. */
export function getRankImage(rank) {
  const path = RANK_IMAGES[rank] || RANK_IMAGES.initiate
  return path
}
