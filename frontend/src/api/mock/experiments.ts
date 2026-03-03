import type { Experiment } from '@/types'

export const mockExperiments: Experiment[] = [
  {
    id: 'exp_001',
    name: 'SEO Tech Niche Test',
    type: 'seo',
    status: 'active',
    config: {
      seo_config: {
        target_keywords: ['tech', 'gadgets', 'electronics'],
        content_frequency: 5,
        target_platforms: ['blog', 'medium'],
        auto_publish: true,
        affiliate_networks: ['amazon', 'ebay']
      }
    },
    start_date: '2026-03-01T00:00:00Z',
    created_by: 'usr_001',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-03T00:00:00Z'
  },
  {
    id: 'exp_002',
    name: 'GEO Product Optimization',
    type: 'geo',
    status: 'active',
    config: {
      geo_config: {
        target_queries: ['best wireless earbuds', 'top smartphones 2024'],
        generation_model: 'gpt-4-turbo',
        optimization_goals: ['ctr', 'engagement']
      }
    },
    start_date: '2026-02-28T00:00:00Z',
    created_by: 'usr_001',
    created_at: '2026-02-28T00:00:00Z',
    updated_at: '2026-03-03T00:00:00Z'
  },
  {
    id: 'exp_003',
    name: 'AI Shopping Assistant',
    type: 'ai_agent',
    status: 'paused',
    config: {
      ai_agent_config: {
        agent_type: 'recommendation_bot',
        product_categories: ['electronics', 'fashion'],
        target_demographics: ['millennials', 'gen_z'],
        commission_rate: 0.05
      }
    },
    start_date: '2026-02-20T00:00:00Z',
    end_date: '2026-02-28T00:00:00Z',
    created_by: 'usr_002',
    created_at: '2026-02-20T00:00:00Z',
    updated_at: '2026-03-02T00:00:00Z'
  },
  {
    id: 'exp_004',
    name: 'Affiliate SaaS Platform',
    type: 'affiliate_saas',
    status: 'draft',
    config: {
      affiliate_saas_config: {
        merchant_domains: ['store.example.com', 'shop.demo.com'],
        commission_tiers: [
          { min_amount: 0, max_amount: 1000, commission_rate: 0.05 },
          { min_amount: 1000, max_amount: 5000, commission_rate: 0.08 },
          { min_amount: 5000, commission_rate: 0.12 }
        ],
        cookie_duration: 30,
        approval_workflow: 'automatic'
      }
    },
    created_by: 'usr_001',
    created_at: '2026-03-02T00:00:00Z',
    updated_at: '2026-03-02T00:00:00Z'
  },
  {
    id: 'exp_005',
    name: 'Fashion SEO Campaign',
    type: 'seo',
    status: 'completed',
    config: {
      seo_config: {
        target_keywords: ['summer fashion', 'trendy outfits'],
        content_frequency: 3,
        auto_publish: true,
        affiliate_networks: ['shopstyle', 'rewardstyle']
      }
    },
    start_date: '2026-02-01T00:00:00Z',
    end_date: '2026-02-28T00:00:00Z',
    created_by: 'usr_002',
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-28T00:00:00Z'
  },
  {
    id: 'exp_006',
    name: 'Home Goods GEO Test',
    type: 'geo',
    status: 'active',
    config: {
      geo_config: {
        target_queries: ['best furniture deals', 'home decor ideas'],
        generation_model: 'claude-3-opus',
        optimization_goals: ['ranking', 'traffic']
      }
    },
    start_date: '2026-03-01T00:00:00Z',
    created_by: 'usr_001',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-03T00:00:00Z'
  }
]
