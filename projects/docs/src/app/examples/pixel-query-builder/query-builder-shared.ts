import {
  createEmptyQuery,
  createQueryGroup,
  createQueryRule,
  PixelQueryBuilderConfig,
  PixelQueryGroup,
} from 'pixel-ui';

export const docsQueryBuilderConfig: PixelQueryBuilderConfig = {
  maxDepth: 3,
  defaultCondition: 'and',
  fields: {
    opportunityId: { name: 'Opportunity ID', type: 'string', icon: 'tag' },
    expectedAmount: { name: 'Expected Amount', type: 'number', icon: 'payments' },
    stage: {
      name: 'Stage',
      type: 'multiselect',
      icon: 'list',
      options: [
        { name: 'Prospecting', value: 'prospecting' },
        { name: 'Qualification', value: 'qualification' },
        { name: 'Proposal', value: 'proposal' },
        { name: 'Negotiation', value: 'negotiation' },
      ],
    },
    region: {
      name: 'Region',
      type: 'category',
      icon: 'public',
      options: [
        { name: 'USA', value: 'usa' },
        { name: 'EMEA', value: 'emea' },
        { name: 'APAC', value: 'apac' },
      ],
    },
    closeDate: { name: 'Close Date', type: 'date', icon: 'calendar_today' },
    active: { name: 'Active', type: 'boolean', icon: 'toggle_on' },
  },
};

export function createDocsSampleQuery(): PixelQueryGroup {
  const root = createEmptyQuery('and');
  const amountRule = createQueryRule({
    field: 'expectedAmount',
    operator: 'gt',
    value: 100_000,
  });
  const stageRule = createQueryRule({
    field: 'stage',
    operator: 'in',
    value: ['prospecting', 'qualification', 'proposal'],
  });
  const dateGroup = createQueryGroup('or', [
    createQueryRule({
      field: 'closeDate',
      operator: 'between',
      value: ['2024-01-01', '2024-12-31'],
    }),
  ]);

  return {
    ...root,
    rules: [amountRule, stageRule, dateGroup],
  };
}
