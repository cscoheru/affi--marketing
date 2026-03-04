/**
 * Blog Articles Configuration
 * Data for Coffee Enthusiast blog
 */

export interface BlogArticle {
  slug: string
  title: string
  excerpt: string
  category: string
  date: string
  contentFile: string
  hasAffiliateLinks: boolean
}

export const blogArticles: BlogArticle[] = [
  // Review Articles (with Amazon affiliate links)
  {
    slug: 'delonghi-ecam22-110-review',
    title: "Why I Regret Buying the De'Longhi ECAM 22.110 After 3 Months",
    excerpt: "Spoiler: I don't actually regret it. But there are things I wish I knew before dropping $350 on this machine.",
    category: 'Coffee Machine Reviews',
    date: '2026-03-04',
    contentFile: 'review_01_delonghi_regret_medium.txt',
    hasAffiliateLinks: true
  },
  {
    slug: 'delonghi-vs-breville-vs-nespresso',
    title: "De'Longhi vs Breville vs Nespresso: Which Is Worth It?",
    excerpt: "I spent way too much time researching coffee machines. Here's what I learned so you don't have to.",
    category: 'Coffee Machine Reviews',
    date: '2026-03-04',
    contentFile: 'review_02_comparison_medium.txt',
    hasAffiliateLinks: true
  },
  {
    slug: 'coffee-machine-buying-guide',
    title: 'Coffee Machine Buying Guide for Beginners (2024 Edition)',
    excerpt: "I bought three different coffee machines so you don't have to. Here's everything I learned.",
    category: 'Buying Guides',
    date: '2026-03-04',
    contentFile: 'review_03_buying_guide_medium.txt',
    hasAffiliateLinks: true
  },
  // Science Articles (no affiliate links)
  {
    slug: 'how-to-store-coffee-beans',
    title: 'How to Store Coffee Beans: Freezer vs Counter',
    excerpt: "Does storing coffee in the freezer really keep it fresh? Or should you leave it on the counter?",
    category: 'Coffee Basics',
    date: '2026-03-04',
    contentFile: 'science_01_coffee_storage_medium.txt',
    hasAffiliateLinks: false
  },
  {
    slug: 'hard-water-vs-soft-water-coffee',
    title: 'Hard Water vs Soft Water: Does It Affect Your Coffee?',
    excerpt: "You've probably heard coffee snobs talk about water like it's the most important ingredient.",
    category: 'Coffee Basics',
    date: '2026-03-04',
    contentFile: 'science_02_water_hardness_medium.txt',
    hasAffiliateLinks: false
  },
  {
    slug: 'arabica-vs-robusta-coffee',
    title: 'Arabica vs Robusta: What\'s the Difference?',
    excerpt: 'Single-origin is having a moment. Coffee shops act like it\'s the only respectable choice.',
    category: 'Coffee Basics',
    date: '2026-03-04',
    contentFile: 'science_03_arabica_robusta_medium.txt',
    hasAffiliateLinks: false
  },
  {
    slug: 'why-coffee-tastes-bitter',
    title: 'Why Your Coffee Tastes Bitter (And How to Fix It)',
    excerpt: 'Bitter coffee is the universal coffee complaint. But here\'s the thing — some bitterness is actually good.',
    category: 'Troubleshooting',
    date: '2026-03-04',
    contentFile: 'science_04_why_bitter_medium.txt',
    hasAffiliateLinks: false
  },
  {
    slug: 'water-temperature-for-coffee',
    title: 'Perfect Water Temperature for Coffee: Myth vs Fact',
    excerpt: 'Water temperature can make or break your coffee. Get it wrong, and you\'ll be drinking regret.',
    category: 'Coffee Basics',
    date: '2026-03-04',
    contentFile: 'science_05_water_temperature_medium.txt',
    hasAffiliateLinks: false
  },
  {
    slug: 'single-origin-vs-blend-coffee',
    title: 'Single-Origin vs Blend: Which Coffee Should You Buy?',
    excerpt: 'Single-origin is having a moment. Coffee shops act like it\'s the only respectable choice.',
    category: 'Coffee Basics',
    date: '2026-03-04',
    contentFile: 'science_06_single_origin_blend_medium.txt',
    hasAffiliateLinks: false
  },
  {
    slug: 'how-to-clean-coffee-machine',
    title: 'How to Clean Your Coffee Machine (Without Chemicals)',
    excerpt: 'Daily cleaning keeps your coffee tasting fresh. Here\'s how to do it right without harsh chemicals.',
    category: 'Maintenance',
    date: '2026-03-04',
    contentFile: 'science_07_cleaning_machines_medium.txt',
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
