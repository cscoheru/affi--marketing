/**
 * Blog Articles Configuration
 * Data for Coffee Enthusiast blog
 */

export interface BlogArticle {
  slug: string
  title: string
  excerpt: string
  content: string  // 添加内容字段用于概览
  category: string
  date: string
  contentFile: string
  image: string   // 添加封面图
  author: string
  readTime: string
  hasAffiliateLinks: boolean
}

export const blogArticles: BlogArticle[] = [
  // Review Articles (with Amazon affiliate links)
  {
    slug: 'delonghi-ecam22-110-review',
    title: "Why I Regret Buying the De'Longhi ECAM 22.110 After 3 Months",
    excerpt: "Spoiler: I don't actually regret it. But there are things I wish I knew before dropping $350 on this machine.",
    content: "After three months with the De'Longhi ECAM 22.110, I've learned a lot about what makes a good espresso machine. In this review, I'll share my honest experience with the pros, cons, and whether it's worth the investment for regular coffee lovers like us.",
    category: 'Coffee Machine Reviews',
    date: '2026-03-04',
    contentFile: 'review_01_delonghi_regret_medium.txt',
    image: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=800&q=80',
    author: 'Coffee Enthusiast',
    readTime: '8 min read',
    hasAffiliateLinks: true
  },
  {
    slug: 'delonghi-vs-breville-vs-nespresso',
    title: "De'Longhi vs Breville vs Nespresso: Which Is Worth It?",
    excerpt: "I spent way too much time researching coffee machines. Here's what I learned so you don't have to.",
    content: "Comparing three popular coffee machine brands to help you decide which one fits your lifestyle and budget. From convenience to coffee quality, I break down the key differences.",
    category: 'Coffee Machine Reviews',
    date: '2026-03-04',
    contentFile: 'review_02_comparison_medium.txt',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
    author: 'Coffee Enthusiast',
    readTime: '10 min read',
    hasAffiliateLinks: true
  },
  {
    slug: 'coffee-machine-buying-guide',
    title: 'Coffee Machine Buying Guide for Beginners (2024 Edition)',
    excerpt: "I bought three different coffee machines so you don't have to. Here's everything I learned.",
    content: "A comprehensive guide to buying your first coffee machine. Learn what features matter, what's just marketing fluff, and how to find the perfect machine for your morning routine.",
    category: 'Buying Guides',
    date: '2026-03-04',
    contentFile: 'review_03_buying_guide_medium.txt',
    image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&q=80',
    author: 'Coffee Enthusiast',
    readTime: '12 min read',
    hasAffiliateLinks: true
  },

  // Science Articles (no affiliate links)
  {
    slug: 'how-to-store-coffee-beans',
    title: 'How to Store Coffee Beans: Freezer vs Counter',
    excerpt: "Does storing coffee in the freezer really keep it fresh? Or should you leave it on the counter?",
    content: "Let's settle the coffee storage debate once and for all. I tested different storage methods and consulted coffee experts to find out what actually keeps your beans fresh.",
    category: 'Coffee Basics',
    date: '2026-03-04',
    contentFile: 'science_01_coffee_storage_medium.txt',
    image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80',
    author: 'Coffee Enthusiast',
    readTime: '6 min read',
    hasAffiliateLinks: false
  },
  {
    slug: 'hard-water-vs-soft-water-coffee',
    title: 'Hard Water vs Soft Water: Does It Affect Your Coffee?',
    excerpt: "You've probably heard coffee snobs talk about water like it's the most important ingredient.",
    content: "Water makes up 98% of your coffee. I dug into the science of water hardness and how it affects extraction, taste, and your equipment.",
    category: 'Coffee Basics',
    date: '2026-03-04',
    contentFile: 'science_02_water_hardness_medium.txt',
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&q=80',
    author: 'Coffee Enthusiast',
    readTime: '5 min read',
    hasAffiliateLinks: false
  },
  {
    slug: 'arabica-vs-robusta-coffee',
    title: 'Arabica vs Robusta: What\'s the Difference?',
    excerpt: 'Single-origin is having a moment. Coffee shops act like it\'s the only respectable choice.',
    content: "But are blends actually bad? I explore the differences between Arabica and Robusta beans, and when each one makes sense for your daily brew.",
    category: 'Coffee Basics',
    date: '2026-03-04',
    contentFile: 'science_03_arabica_robusta_medium.txt',
    image: 'https://images.unsplash.com/photo-1524350876685-274059332603?w=800&q=80',
    author: 'Coffee Enthusiast',
    readTime: '7 min read',
    hasAffiliateLinks: false
  },
  {
    slug: 'why-coffee-tastes-bitter',
    title: 'Why Your Coffee Tastes Bitter (And How to Fix It)',
    excerpt: 'Bitter coffee is the universal coffee complaint. But here\'s the thing — some bitterness is actually good.',
    content: "Understanding why your coffee tastes bitter and how to fix it. From extraction time to water temperature, I cover the most common causes and solutions.",
    category: 'Troubleshooting',
    date: '2026-03-04',
    contentFile: 'science_04_why_bitter_medium.txt',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
    author: 'Coffee Enthusiast',
    readTime: '6 min read',
    hasAffiliateLinks: false
  },
  {
    slug: 'water-temperature-for-coffee',
    title: 'Perfect Water Temperature for Coffee: Myth vs Fact',
    excerpt: 'Water temperature can make or break your coffee. Get it wrong, and you\'ll be drinking regret.',
    content: "The ideal water temperature for brewing coffee has been debated for years. I separate myth from fact and help you find the sweet spot for your preferred brewing method.",
    category: 'Coffee Basics',
    date: '2026-03-04',
    contentFile: 'science_05_water_temperature_medium.txt',
    image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=80',
    author: 'Coffee Enthusiast',
    readTime: '5 min read',
    hasAffiliateLinks: false
  },
  {
    slug: 'single-origin-vs-blend-coffee',
    title: 'Single-Origin vs Blend: Which Coffee Should You Buy?',
    excerpt: 'Single-origin is having a moment. Coffee shops act like it\'s the only respectable choice.',
    content: "But are blends actually bad? I explore the pros and cons of single-origin vs blended coffees, and when each one makes sense for your taste and budget.",
    category: 'Coffee Basics',
    date: '2026-03-04',
    contentFile: 'science_06_single_origin_blend_medium.txt',
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80',
    author: 'Coffee Enthusiast',
    readTime: '7 min read',
    hasAffiliateLinks: false
  },
  {
    slug: 'how-to-clean-coffee-machine',
    title: 'How to Clean Your Coffee Machine (Without Chemicals)',
    excerpt: 'Daily cleaning keeps your coffee tasting fresh. Here\'s how to do it right without harsh chemicals.',
    content: "A complete guide to cleaning your coffee machine using natural ingredients. From daily maintenance to deep cleaning, I cover everything you need to know.",
    category: 'Maintenance',
    date: '2026-03-04',
    contentFile: 'science_07_cleaning_machines_medium.txt',
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80',
    author: 'Coffee Enthusiast',
    readTime: '6 min read',
    hasAffiliateLinks: false
  }
]

export const categories = [
  'Coffee Basics',
  'Coffee Machine Reviews',
  'Buying Guides',
  'Troubleshooting',
  'Maintenance'
]
