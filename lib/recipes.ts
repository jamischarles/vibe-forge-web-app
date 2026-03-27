// ── Recipe Categories & Building Blocks ─────────────────────────────────────
//
// LEGO-style reusable pieces that snap together to form app recipes.
// Each building block is a mini breadboard fragment with places + affordances.

import type { Affordance } from './vf-types'

type AffordanceType = Affordance['type']

// ── Recipe Category ─────────────────────────────────────────────────────────

export interface RecipeCategory {
  id: string
  name: string
  description: string
  icon: string
  suggestedBlockIds: string[]
}

// ── Building Block ──────────────────────────────────────────────────────────

export interface BuildingBlock {
  id: string
  name: string
  description: string
  icon: string
  tags: string[]
  places: {
    label: string
    affordances: { label: string; type: AffordanceType }[]
  }[]
  connections: {
    fromLabel: string
    toLabel: string
    label?: string
  }[]
}

// ── Categories ──────────────────────────────────────────────────────────────

export const RECIPE_CATEGORIES: RecipeCategory[] = [
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    description: 'Online stores and marketplaces',
    icon: '🛒',
    suggestedBlockIds: ['auth', 'product-catalog', 'shopping-cart', 'checkout', 'search', 'user-profile'],
  },
  {
    id: 'saas',
    name: 'SaaS Dashboard',
    description: 'Data-driven business tools',
    icon: '📊',
    suggestedBlockIds: ['auth', 'dashboard', 'settings', 'search', 'user-profile', 'notifications'],
  },
  {
    id: 'social',
    name: 'Social App',
    description: 'Community and social networking',
    icon: '💬',
    suggestedBlockIds: ['auth', 'feed', 'user-profile', 'messaging', 'notifications', 'search'],
  },
  {
    id: 'content',
    name: 'Content Platform',
    description: 'Blogs, media, publishing',
    icon: '📝',
    suggestedBlockIds: ['auth', 'feed', 'content-editor', 'search', 'user-profile'],
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    description: 'Two-sided platforms',
    icon: '🏪',
    suggestedBlockIds: ['auth', 'product-catalog', 'search', 'shopping-cart', 'checkout', 'messaging', 'user-profile'],
  },
  {
    id: 'custom',
    name: 'Custom Recipe',
    description: 'Start from scratch, pick any blocks',
    icon: '🧪',
    suggestedBlockIds: [],
  },
]

// ── Building Blocks ─────────────────────────────────────────────────────────

export const BUILDING_BLOCKS: BuildingBlock[] = [
  {
    id: 'auth',
    name: 'Auth Flow',
    description: 'Login, sign-up, and password recovery',
    icon: '🔐',
    tags: ['security', 'onboarding', 'identity'],
    places: [
      { label: 'Login', affordances: [{ label: 'Email', type: 'field' }, { label: 'Password', type: 'field' }, { label: 'Sign In', type: 'button' }, { label: 'Forgot Password', type: 'link' }, { label: 'Sign Up', type: 'link' }] },
      { label: 'Sign Up', affordances: [{ label: 'Name', type: 'field' }, { label: 'Email', type: 'field' }, { label: 'Password', type: 'field' }, { label: 'Create Account', type: 'button' }] },
      { label: 'Reset Password', affordances: [{ label: 'Email', type: 'field' }, { label: 'Send Reset Link', type: 'button' }] },
    ],
    connections: [
      { fromLabel: 'Login', toLabel: 'Sign Up', label: 'sign up' },
      { fromLabel: 'Login', toLabel: 'Reset Password', label: 'forgot password' },
    ],
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Overview with key metrics and quick actions',
    icon: '📈',
    tags: ['analytics', 'overview', 'home'],
    places: [
      { label: 'Dashboard', affordances: [{ label: 'Metrics Cards', type: 'display' }, { label: 'Activity Chart', type: 'display' }, { label: 'Quick Actions', type: 'button' }, { label: 'Recent Items', type: 'display' }] },
    ],
    connections: [],
  },
  {
    id: 'product-catalog',
    name: 'Product Catalog',
    description: 'Browse and view product listings',
    icon: '📦',
    tags: ['products', 'listings', 'browse'],
    places: [
      { label: 'Product Listing', affordances: [{ label: 'Product Grid', type: 'display' }, { label: 'Filters', type: 'toggle' }, { label: 'Sort By', type: 'button' }] },
      { label: 'Product Detail', affordances: [{ label: 'Product Image', type: 'display' }, { label: 'Description', type: 'display' }, { label: 'Price', type: 'display' }, { label: 'Add to Cart', type: 'button' }, { label: 'Reviews', type: 'display' }] },
    ],
    connections: [
      { fromLabel: 'Product Listing', toLabel: 'Product Detail', label: 'view item' },
    ],
  },
  {
    id: 'shopping-cart',
    name: 'Shopping Cart',
    description: 'Manage items before checkout',
    icon: '🛒',
    tags: ['cart', 'purchase', 'items'],
    places: [
      { label: 'Cart', affordances: [{ label: 'Item List', type: 'display' }, { label: 'Quantity', type: 'field' }, { label: 'Remove Item', type: 'button' }, { label: 'Subtotal', type: 'display' }, { label: 'Checkout', type: 'button' }] },
    ],
    connections: [],
  },
  {
    id: 'checkout',
    name: 'Checkout',
    description: 'Payment and order confirmation flow',
    icon: '💳',
    tags: ['payment', 'order', 'purchase'],
    places: [
      { label: 'Shipping Info', affordances: [{ label: 'Address', type: 'field' }, { label: 'Shipping Method', type: 'toggle' }, { label: 'Continue', type: 'button' }] },
      { label: 'Payment', affordances: [{ label: 'Card Number', type: 'field' }, { label: 'Expiry', type: 'field' }, { label: 'Pay Now', type: 'button' }] },
      { label: 'Order Confirmation', affordances: [{ label: 'Order Summary', type: 'display' }, { label: 'Order Number', type: 'display' }, { label: 'Continue Shopping', type: 'link' }] },
    ],
    connections: [
      { fromLabel: 'Shipping Info', toLabel: 'Payment', label: 'continue' },
      { fromLabel: 'Payment', toLabel: 'Order Confirmation', label: 'pay' },
    ],
  },
  {
    id: 'search',
    name: 'Search',
    description: 'Search with filters and results',
    icon: '🔍',
    tags: ['find', 'query', 'filter'],
    places: [
      { label: 'Search Results', affordances: [{ label: 'Search Bar', type: 'field' }, { label: 'Filters', type: 'toggle' }, { label: 'Result List', type: 'display' }, { label: 'Pagination', type: 'button' }] },
    ],
    connections: [],
  },
  {
    id: 'user-profile',
    name: 'User Profile',
    description: 'View and edit user information',
    icon: '👤',
    tags: ['account', 'profile', 'user'],
    places: [
      { label: 'Profile', affordances: [{ label: 'Avatar', type: 'display' }, { label: 'User Info', type: 'display' }, { label: 'Edit Profile', type: 'button' }] },
      { label: 'Edit Profile', affordances: [{ label: 'Name', type: 'field' }, { label: 'Bio', type: 'field' }, { label: 'Avatar Upload', type: 'button' }, { label: 'Save', type: 'button' }] },
    ],
    connections: [
      { fromLabel: 'Profile', toLabel: 'Edit Profile', label: 'edit' },
    ],
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'App and account configuration',
    icon: '⚙️',
    tags: ['config', 'preferences', 'account'],
    places: [
      { label: 'Settings', affordances: [{ label: 'General Tab', type: 'button' }, { label: 'Notifications Tab', type: 'button' }, { label: 'Security Tab', type: 'button' }, { label: 'Save Changes', type: 'button' }] },
    ],
    connections: [],
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Alerts, updates, and activity feed',
    icon: '🔔',
    tags: ['alerts', 'updates', 'activity'],
    places: [
      { label: 'Notifications', affordances: [{ label: 'Notification List', type: 'display' }, { label: 'Mark Read', type: 'button' }, { label: 'Filter By Type', type: 'toggle' }, { label: 'Clear All', type: 'button' }] },
    ],
    connections: [],
  },
  {
    id: 'feed',
    name: 'Feed',
    description: 'Content feed with posts and interactions',
    icon: '📰',
    tags: ['timeline', 'posts', 'social'],
    places: [
      { label: 'Feed', affordances: [{ label: 'Post List', type: 'display' }, { label: 'Create Post', type: 'button' }, { label: 'Like', type: 'button' }, { label: 'Comment', type: 'button' }, { label: 'Share', type: 'button' }] },
    ],
    connections: [],
  },
  {
    id: 'messaging',
    name: 'Messaging',
    description: 'Direct messages and conversations',
    icon: '✉️',
    tags: ['chat', 'dm', 'communication'],
    places: [
      { label: 'Inbox', affordances: [{ label: 'Conversation List', type: 'display' }, { label: 'New Message', type: 'button' }, { label: 'Search Messages', type: 'field' }] },
      { label: 'Conversation', affordances: [{ label: 'Message Thread', type: 'display' }, { label: 'Message Input', type: 'field' }, { label: 'Send', type: 'button' }, { label: 'Attachments', type: 'button' }] },
    ],
    connections: [
      { fromLabel: 'Inbox', toLabel: 'Conversation', label: 'open' },
    ],
  },
  {
    id: 'content-editor',
    name: 'Content Editor',
    description: 'Create and edit rich content',
    icon: '✏️',
    tags: ['editor', 'wysiwyg', 'publish'],
    places: [
      { label: 'Editor', affordances: [{ label: 'Title', type: 'field' }, { label: 'Rich Text Body', type: 'field' }, { label: 'Media Insert', type: 'button' }, { label: 'Save Draft', type: 'button' }, { label: 'Publish', type: 'button' }] },
    ],
    connections: [],
  },
  {
    id: 'onboarding',
    name: 'Onboarding',
    description: 'First-run setup wizard for new users',
    icon: '🚀',
    tags: ['setup', 'wizard', 'first-run'],
    places: [
      { label: 'Welcome', affordances: [{ label: 'Welcome Message', type: 'display' }, { label: 'Get Started', type: 'button' }] },
      { label: 'Setup Preferences', affordances: [{ label: 'Preference Options', type: 'toggle' }, { label: 'Next', type: 'button' }] },
      { label: 'Tour', affordances: [{ label: 'Feature Highlights', type: 'display' }, { label: 'Skip', type: 'link' }, { label: 'Finish', type: 'button' }] },
    ],
    connections: [
      { fromLabel: 'Welcome', toLabel: 'Setup Preferences', label: 'get started' },
      { fromLabel: 'Setup Preferences', toLabel: 'Tour', label: 'next' },
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Charts, reports, and data insights',
    icon: '📊',
    tags: ['reports', 'data', 'charts'],
    places: [
      { label: 'Analytics', affordances: [{ label: 'Date Range Picker', type: 'field' }, { label: 'Charts', type: 'display' }, { label: 'Data Table', type: 'display' }, { label: 'Export Report', type: 'button' }] },
    ],
    connections: [],
  },
  {
    id: 'payments',
    name: 'Payments',
    description: 'Billing history and payment methods',
    icon: '💰',
    tags: ['billing', 'invoices', 'subscription'],
    places: [
      { label: 'Billing', affordances: [{ label: 'Current Plan', type: 'display' }, { label: 'Payment Methods', type: 'display' }, { label: 'Add Payment Method', type: 'button' }, { label: 'Invoice History', type: 'display' }, { label: 'Upgrade Plan', type: 'button' }] },
    ],
    connections: [],
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getBlockById(id: string): BuildingBlock | undefined {
  return BUILDING_BLOCKS.find((b) => b.id === id)
}

export function getCategoryById(id: string): RecipeCategory | undefined {
  return RECIPE_CATEGORIES.find((c) => c.id === id)
}

export function getBlocksForCategory(categoryId: string): BuildingBlock[] {
  const cat = getCategoryById(categoryId)
  if (!cat) return []
  return cat.suggestedBlockIds
    .map((id) => getBlockById(id))
    .filter((b): b is BuildingBlock => !!b)
}

/** Format selected blocks as context string for AI agent prompts */
export function formatBlocksForPrompt(blockIds: string[]): string {
  const blocks = blockIds.map((id) => getBlockById(id)).filter((b): b is BuildingBlock => !!b)
  if (blocks.length === 0) return ''

  return blocks.map((b) => {
    const placesSummary = b.places
      .map((p) => `  - ${p.label}: ${p.affordances.map((a) => a.label).join(', ')}`)
      .join('\n')
    return `• ${b.name}: ${b.description}\n${placesSummary}`
  }).join('\n')
}
