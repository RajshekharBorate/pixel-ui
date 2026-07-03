import type {
  PixelQueryBuilderConfig,
  PixelQueryExport,
  PixelQueryExportGroup,
  PixelQueryExportRule,
  PixelQueryGroup,
} from 'pixel-ui';
import { createEmptyQuery, createQueryGroup, createQueryRule } from 'pixel-ui';

export interface DocsCatalogProduct {
  readonly sku: string;
  readonly productName: string;
  readonly category: string;
  readonly brand: string;
  readonly price: number;
  readonly stockQuantity: number;
  readonly status: string;
  readonly onSale: boolean;
}

export const docsEcommerceQueryConfig: PixelQueryBuilderConfig = {
  maxDepth: 3,
  fields: {
    productName: { name: 'Product name', type: 'string', icon: 'inventory_2' },
    category: {
      name: 'Category',
      type: 'category',
      icon: 'category',
      options: [
        { name: 'Electronics', value: 'electronics' },
        { name: 'Fashion', value: 'fashion' },
        { name: 'Home & Garden', value: 'home-garden' },
      ],
    },
    brand: {
      name: 'Brand',
      type: 'multiselect',
      icon: 'sell',
      options: [
        { name: 'Northline', value: 'northline' },
        { name: 'UrbanCraft', value: 'urbancraft' },
        { name: 'PeakGear', value: 'peakgear' },
      ],
    },
    price: { name: 'Price (USD)', type: 'number', icon: 'payments' },
    stockQuantity: { name: 'Stock quantity', type: 'number', icon: 'inventory' },
    status: {
      name: 'Listing status',
      type: 'category',
      icon: 'flag',
      options: [
        { name: 'Active', value: 'active' },
        { name: 'Draft', value: 'draft' },
        { name: 'Archived', value: 'archived' },
      ],
    },
    onSale: { name: 'On sale', type: 'boolean', icon: 'percent' },
  },
};

export const docsEcommerceCatalog: readonly DocsCatalogProduct[] = [
  {
    sku: 'EL-1001',
    productName: 'Wireless noise-cancelling headphones',
    category: 'electronics',
    brand: 'northline',
    price: 189.99,
    stockQuantity: 142,
    status: 'active',
    onSale: true,
  },
  {
    sku: 'EL-1002',
    productName: '4K action camera',
    category: 'electronics',
    brand: 'peakgear',
    price: 249.0,
    stockQuantity: 38,
    status: 'active',
    onSale: false,
  },
  {
    sku: 'FA-2201',
    productName: 'Organic cotton hoodie',
    category: 'fashion',
    brand: 'urbancraft',
    price: 64.5,
    stockQuantity: 210,
    status: 'active',
    onSale: true,
  },
  {
    sku: 'HG-3301',
    productName: 'Ceramic planter set',
    category: 'home-garden',
    brand: 'urbancraft',
    price: 42.0,
    stockQuantity: 0,
    status: 'draft',
    onSale: false,
  },
  {
    sku: 'EL-1003',
    productName: 'Smart home hub',
    category: 'electronics',
    brand: 'northline',
    price: 129.99,
    stockQuantity: 88,
    status: 'archived',
    onSale: false,
  },
];

export function createDocsEcommerceSampleQuery(): PixelQueryGroup {
  const root = createEmptyQuery('and');
  const categoryRule = createQueryRule({
    field: 'category',
    operator: 'equals',
    value: 'electronics',
  });
  const priceGroup = createQueryGroup('or', [
    createQueryRule({ field: 'onSale', operator: 'equals', value: true }),
    createQueryRule({ field: 'price', operator: 'lt', value: 150 }),
  ]);

  return {
    ...root,
    rules: [categoryRule, priceGroup],
  };
}

export function filterDocsCatalog(
  catalog: readonly DocsCatalogProduct[],
  query: PixelQueryExport,
): readonly DocsCatalogProduct[] {
  if (query.rules.length === 0) {
    return [...catalog];
  }
  return catalog.filter((product) => evaluateGroup(product, query));
}

function evaluateGroup(product: DocsCatalogProduct, group: PixelQueryExportGroup): boolean {
  if (group.rules.length === 0) {
    return true;
  }
  const results = group.rules.map((node) =>
    'condition' in node ? evaluateGroup(product, node) : evaluateRule(product, node),
  );
  return group.condition === 'and' ? results.every(Boolean) : results.some(Boolean);
}

function evaluateRule(product: DocsCatalogProduct, rule: PixelQueryExportRule): boolean {
  if (!rule.field || !rule.operator) {
    return true;
  }

  const actual = product[rule.field as keyof DocsCatalogProduct];
  const expected = rule.value;

  switch (rule.operator) {
    case 'equals':
      return compareScalar(actual, expected);
    case 'gt':
      return toNumber(actual) > toNumber(expected);
    case 'lt':
      return toNumber(actual) < toNumber(expected);
    case 'in':
      return Array.isArray(expected) && expected.some((item) => compareScalar(actual, item));
    default:
      return true;
  }
}

function compareScalar(actual: unknown, expected: unknown): boolean {
  if (typeof actual === 'boolean' || typeof expected === 'boolean') {
    return actual === expected;
  }
  if (typeof actual === 'number' || typeof expected === 'number') {
    return toNumber(actual) === toNumber(expected);
  }
  return String(actual ?? '').toLowerCase() === String(expected ?? '').toLowerCase();
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function formatCategoryLabel(value: string): string {
  return (
    docsEcommerceQueryConfig.fields['category'].options?.find((option) => option.value === value)
      ?.name ?? value
  );
}

export function formatStatusLabel(value: string): string {
  return (
    docsEcommerceQueryConfig.fields['status'].options?.find((option) => option.value === value)
      ?.name ?? value
  );
}
