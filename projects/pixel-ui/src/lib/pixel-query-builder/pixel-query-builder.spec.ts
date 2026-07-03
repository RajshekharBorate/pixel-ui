import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  addQueryRule,
  createEmptyQuery,
  createQueryGroup,
  createQueryRule,
  exportQuery,
  importQuery,
  isQueryGroup,
  parseQueryExportJson,
  removeQueryNode,
  serializeQueryExport,
} from './pixel-query-builder.utils';
import { isQueryValid, validateQuery } from './pixel-query-builder.validator';
import { buildQuerySummaryTree, summaryTreeToText } from './pixel-query-summary.utils';
import type { PixelQueryBuilderConfig, PixelQueryGroup } from './pixel-query-builder.types';

const demoConfig: PixelQueryBuilderConfig = {
  fields: {
    age: { name: 'Age', type: 'number' },
    gender: {
      name: 'Gender',
      type: 'category',
      options: [
        { name: 'Male', value: 'm' },
        { name: 'Female', value: 'f' },
      ],
    },
  },
};

describe('pixel-query-builder helpers', () => {
  it('creates and exports a flat query', () => {
    let root = createEmptyQuery();
    root = addQueryRule(root, root.id, createQueryRule({ field: 'age', operator: 'lte', value: 30 }));
    root = addQueryRule(
      root,
      root.id,
      createQueryRule({ field: 'gender', operator: 'equals', value: 'm' }),
    );

    expect(exportQuery(root)).toEqual({
      condition: 'and',
      rules: [
        { field: 'age', operator: 'lte', value: 30 },
        { field: 'gender', operator: 'equals', value: 'm' },
      ],
    });
  });

  it('imports exported queries with fresh ids', () => {
    const exported = {
      condition: 'and' as const,
      rules: [{ field: 'age', operator: 'equals', value: 42 }],
    };
    const imported = importQuery(exported, demoConfig);
    expect(imported.rules).toHaveLength(1);
    expect(isQueryGroup(imported)).toBe(true);
  });

  it('serializes and parses portable query JSON', () => {
    const exported = {
      condition: 'or' as const,
      rules: [
        { field: 'age', operator: 'lte', value: 30 },
        {
          condition: 'and' as const,
          rules: [{ field: 'gender', operator: 'equals', value: 'm' }],
        },
      ],
    };
    const json = serializeQueryExport(exported);
    const parsed = parseQueryExportJson(json);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.export).toEqual(exported);
      expect(importQuery(parsed.export, demoConfig).rules).toHaveLength(2);
    }
  });

  it('rejects invalid import JSON', () => {
    expect(parseQueryExportJson('{ invalid')).toEqual({
      ok: false,
      error: 'Invalid JSON. Check the syntax and try again.',
    });
    expect(parseQueryExportJson('[]').ok).toBe(false);
  });

  it('validates incomplete rules', () => {
    const root = createEmptyQuery();
    const withRule = addQueryRule(root, root.id);
    const result = validateQuery(withRule, demoConfig);
    expect(result.valid).toBe(false);
    expect(result.ruleIssues.length).toBeGreaterThan(0);
  });

  it('validates complete rules', () => {
    const root = createEmptyQuery();
    const withRule = addQueryRule(
      root,
      root.id,
      createQueryRule({ field: 'age', operator: 'gte', value: 18 }),
    );
    expect(isQueryValid(withRule, demoConfig)).toBe(true);
  });

  it('exports queries missing rules arrays safely', () => {
    const malformed = { condition: 'and' } as PixelQueryGroup;
    expect(exportQuery(malformed)).toEqual({ condition: 'and', rules: [] });
  });

  it('flags empty root query when required', () => {
    const result = validateQuery(createEmptyQuery(), { ...demoConfig, allowEmpty: false });
    expect(result.empty).toBe(true);
    expect(result.valid).toBe(false);
  });

  it('allows empty root query when optional', () => {
    expect(validateQuery(createEmptyQuery(), { ...demoConfig, allowEmpty: true }).valid).toBe(true);
  });

  it('flags empty nested rulesets even when root query is optional', () => {
    const emptyNested = createQueryGroup('or', []);
    const root = {
      ...createEmptyQuery(),
      rules: [createQueryRule({ field: 'age', operator: 'gte', value: 18 }), emptyNested],
    };
    const result = validateQuery(root, { ...demoConfig, allowEmpty: true });
    expect(result.groupIssues.some((issue) => issue.groupId === emptyNested.id)).toBe(true);
    expect(result.valid).toBe(false);
  });

  it('removes nested groups', () => {
    const root = createEmptyQuery();
    const nested = createQueryGroup('or');
    const withNested = {
      ...root,
      rules: [nested],
    };
    const next = removeQueryNode(withNested, nested.id);
    expect(next.rules).toHaveLength(0);
  });

  it('formats basic summary text with readable joiners and values', () => {
    let root = createEmptyQuery();
    root = addQueryRule(
      root,
      root.id,
      createQueryRule({ field: 'age', operator: 'lte', value: 30 }),
    );
    root = addQueryRule(
      root,
      root.id,
      createQueryRule({ field: 'gender', operator: 'equals', value: 'm' }),
    );

    const summary = summaryTreeToText(buildQuerySummaryTree(root, demoConfig));
    expect(summary).toBe('Age less than or equal 30 and Gender equals "Male"');
  });

  it('wraps nested groups in parentheses for basic summary text', () => {
    const nested = createQueryGroup('or', [
      createQueryRule({ field: 'age', operator: 'gte', value: 18 }),
    ]);
    const root = { ...createEmptyQuery(), rules: [nested] };
    const summary = summaryTreeToText(buildQuerySummaryTree(root, demoConfig));
    expect(summary).toBe('(Age greater than or equal 18)');
  });
});

@Component({
  standalone: true,
  template: `<div>placeholder</div>`,
})
class PlaceholderComponent {}

describe('pixel-query-builder component smoke', () => {
  let fixture: ComponentFixture<PlaceholderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaceholderComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(PlaceholderComponent);
    fixture.detectChanges();
  });

  it('creates placeholder host', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
