import type { RoleCategory } from '@/types';

export function inferRoleCategory(socCode: string, socTitle: string): RoleCategory {
  const major = parseInt(socCode.split('-')[0], 10);
  const t = socTitle.toLowerCase();

  if (
    major === 15 || major === 17 ||
    t.includes('developer') || t.includes('software engineer') ||
    t.includes('programmer') || t.includes('devops') || t.includes('data scientist') ||
    t.includes('data engineer') || t.includes('machine learning') || t.includes('systems engineer')
  ) return 'engineer';

  if (
    t.includes('design') || t.includes('art director') || t.includes('graphic') ||
    t.includes('ux ') || t.includes('user experience') || t.includes('user interface') ||
    t.includes('visual') || t.includes('animator') || t.includes('illustrator')
  ) return 'designer';

  if (
    t.includes('market') || t.includes('advertis') || t.includes('brand') ||
    t.includes('content creator') || t.includes('social media') || t.includes('seo') ||
    t.includes('copywriter') || t.includes('growth')
  ) return 'marketer';

  if (
    major === 41 ||
    t.includes('sales') || t.includes('account executive') ||
    t.includes('business development') || t.includes('account manager') ||
    t.includes('business analyst') && t.includes('sales')
  ) return 'sales';

  if (
    t.includes('product manager') || t.includes('program manager') ||
    t.includes('project manager') || t.includes('product owner') ||
    t.includes('scrum master') || t.includes('product lead')
  ) return 'pm';

  // Management major group fallback
  if (major === 11) return 'pm';

  return 'engineer';
}
