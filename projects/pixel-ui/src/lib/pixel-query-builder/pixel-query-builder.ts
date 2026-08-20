import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelTooltipDirective from '../pixel-tooltip/pixel-tooltip';
import { toQueryButtonSize } from './pixel-query-builder-size';
import { cloneQueryTree, createEmptyQuery, exportQuery, importQuery, normalizeQueryGroup, parseQueryExportJson, serializeQueryExport } from './pixel-query-builder.utils';
import { queryToSummary, validateQuery } from './pixel-query-builder.validator';
import { buildQuerySummaryTree } from './pixel-query-summary.utils';
import { PixelQueryBuilderStore } from './pixel-query-builder.store';
import type {
  PixelQueryBuilderConfig,
  PixelQueryBuilderLabels,
  PixelQueryBuilderSize,
  PixelQueryBuilderVariant,
  PixelQueryChangeEvent,
  PixelQueryExport,
  PixelQueryGroup,
  PixelQuerySummaryMode,
  PixelQuerySummaryPreview,
} from './pixel-query-builder.types';
import {
  formatQueryBuilderLabel,
  mergePixelQueryBuilderLabels,
} from './pixel-query-builder.types';
import PixelQueryGroupComponent from './pixel-query-group';
import PixelQuerySummaryComponent from './pixel-query-summary';
import { PIXEL_DATE_LOCALE } from '../shared/datetime/pixel-date-adapter';
import {
  injectDateFieldIoContext,
  resolveDateFieldLocale,
} from '../shared/datetime/pixel-date-field-io';

let nextQueryBuilderId = 0;

@Component({
  selector: 'pixel-query-builder',
  imports: [PixelButtonComponent, PixelTooltipDirective, PixelQueryGroupComponent, PixelQuerySummaryComponent],
  templateUrl: './pixel-query-builder.html',
  styleUrl: './pixel-query-builder.scss',
  providers: [
    PixelQueryBuilderStore,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PixelQueryBuilderComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PixelQueryBuilderComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-query-builder',
    '[attr.data-size]': 'size()',
    '[attr.data-variant]': 'variant()',
    '[class.pixel-query-builder--disabled]': 'isDisabled()',
    '[class.pixel-query-builder--readonly]': 'readOnly()',
    '[attr.data-summary-preview]': 'summaryPreview()',
    '[attr.data-summary-mode]': 'resolvedSummaryMode()',
    '[class.pixel-query-builder--summary-collapsed]': 'summaryCollapsed()',
    '[attr.aria-disabled]': 'isDisabled() ? "true" : null',
  },
})
export default class PixelQueryBuilderComponent implements ControlValueAccessor, Validator {
  protected readonly store = inject(PixelQueryBuilderStore);
  private readonly injectedDateLocale = inject(PIXEL_DATE_LOCALE, { optional: true });
  private readonly dateFieldIo = injectDateFieldIoContext();

  protected readonly fallbackId = `pixel-query-builder-${nextQueryBuilderId++}`;

  readonly config = input.required<PixelQueryBuilderConfig>();
  readonly query = model<PixelQueryGroup | undefined>(undefined);
  readonly size = input<PixelQueryBuilderSize>('md');
  readonly variant = input<PixelQueryBuilderVariant>('ruleset');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  /** When true, an empty root query is invalid and shows "A ruleset cannot be empty." */
  readonly required = input(false, { transform: booleanAttribute });
  readonly showSummary = input(true, { transform: booleanAttribute });
  readonly addRuleLabel = input('Rule');
  readonly addGroupLabel = input('Ruleset');
  readonly emptyGroupMessage = input('A ruleset cannot be empty.');
  /**
   * @component pixel-query-builder
   * Title for the query preview card (badge + section aria-label).
   * @type {string}
   * @default 'Query preview'
   */
  readonly summaryLabel = input('Query preview');
  /**
   * @component pixel-query-builder
   * Partial override map for builder chrome copy.
   * @type {Partial<PixelQueryBuilderLabels>}
   * @default {}
   * @description Merged with {@link DEFAULT_PIXEL_QUERY_BUILDER_LABELS}. Use `{n}` for rule counts.
   * Does not replace `summaryLabel`, `addRuleLabel`, `addGroupLabel`, or `emptyGroupMessage`.
   */
  readonly labels = input<Partial<PixelQueryBuilderLabels>>({});
  /**
   * @component pixel-query-builder
   * BCP-47 locale for date values in rule summaries and query preview.
   * @type {string | undefined}
   * @default undefined
   * @description Precedence: this input → `config.dateLocale` → `PIXEL_DATE_LOCALE` → browser Intl.
   */
  readonly dateLocale = input<string | undefined>(undefined);
  /** `basic` / `advanced` lock the preview; `both` shows a toggle (use `[(summaryMode)]` for the active mode). */
  readonly summaryPreview = input<PixelQuerySummaryPreview>('advanced');
  readonly summaryMode = model<PixelQuerySummaryMode>('advanced');

  readonly queryUpdated = output<PixelQueryChangeEvent>();
  readonly validChange = output<boolean>();

  private readonly formDisabled = signal(false);
  /** Prevents external→store sync while we push store→model. */
  private syncingFromStore = false;
  /** Blocks store→model until parent query is hydrated or standalone init completes. */
  private readonly storeToModelEnabled = signal(false);

  private onChange: (value: PixelQueryGroup) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly rootGroupId = computed(() => this.store.query().id);
  protected readonly summary = computed(() => this.store.summary());
  protected readonly summaryTree = computed(() =>
    buildQuerySummaryTree(this.store.query(), this.mergedConfig(), this.dateFieldIo),
  );
  protected readonly showSummaryModeToggle = computed(() => this.summaryPreview() === 'both');
  protected readonly resolvedSummaryMode = computed((): PixelQuerySummaryMode => {
    const preview = this.summaryPreview();
    if (preview === 'basic' || preview === 'advanced') {
      return preview;
    }
    return this.summaryMode();
  });
  protected readonly valid = computed(() => this.store.valid());
  protected readonly ruleCount = computed(() => this.store.ruleCount());
  protected readonly buttonSize = computed(() => toQueryButtonSize(this.size()));
  protected readonly summaryCollapsed = signal(false);
  protected readonly summaryBodyId = computed(() => `${this.fallbackId}-summary-body`);
  protected readonly l = computed(() =>
    mergePixelQueryBuilderLabels({ ...this.config().labels, ...this.labels() }),
  );
  protected readonly summaryCollapseTooltip = computed(() =>
    this.summaryCollapsed() ? this.l().expandQueryPreview : this.l().collapseQueryPreview,
  );
  protected readonly ruleCountLabel = computed(() => {
    const n = this.ruleCount();
    const tpl = n === 1 ? this.l().ruleCountOne : this.l().ruleCountMany;
    return formatQueryBuilderLabel(tpl, { n });
  });

  protected readonly mergedConfig = computed<PixelQueryBuilderConfig>(() => {
    const base = this.config();
    const labels = mergePixelQueryBuilderLabels({ ...base.labels, ...this.labels() });
    const dateLocale = resolveDateFieldLocale(
      this.dateLocale() ?? base.dateLocale,
      this.injectedDateLocale ?? undefined,
    );

    return {
      ...base,
      allowEmpty: this.required() ? (base.allowEmpty ?? false) : true,
      labels,
      dateLocale,
      messages: {
        addRule: this.addRuleLabel(),
        addRuleset: this.addGroupLabel(),
        emptyGroup: base.messages?.emptyGroup ?? this.emptyGroupMessage(),
        ...base.messages,
      },
    };
  });

  constructor() {
    this.store.setDateFieldIo(this.dateFieldIo);
    this.store.listenQueryChanges(() => {
      if (!this.storeToModelEnabled()) {
        return;
      }
      this.publishStoreState();
    });

    effect(() => {
      this.store.configure(this.mergedConfig());
    });

    effect(() => {
      this.mergedConfig();
      untracked(() => {
        if (this.storeToModelEnabled()) {
          this.onValidatorChange();
        }
      });
    });

    effect(() => {
      this.store.setDisabled(this.isDisabled());
    });

    effect(() => {
      this.store.setReadOnly(this.readOnly());
    });

    // External model / form → store (skip echoes from store→model).
    effect(() => {
      if (this.syncingFromStore) {
        return;
      }
      const incoming = this.query();
      untracked(() => {
        if (incoming !== undefined) {
          const normalized = normalizeQueryGroup(incoming);
          if (!queriesEqual(normalized, this.store.query())) {
            this.store.setQuery(normalized);
            this.onValidatorChange();
          }
          this.storeToModelEnabled.set(true);
        }
      });
    });

    // Store mutations → two-way query model (CVA publish is synchronous via listenQueryChanges).
    effect(() => {
      if (!this.storeToModelEnabled()) {
        return;
      }
      const internal = this.store.query();
      untracked(() => {
        const current = this.query();
        if (current !== undefined && queriesEqual(internal, normalizeQueryGroup(current))) {
          return;
        }

        this.syncingFromStore = true;
        this.query.set(cloneQueryTree(internal));
        this.syncingFromStore = false;
      });
    });

    afterNextRender(() => {
      if (this.query() === undefined) {
        this.storeToModelEnabled.set(true);
      }
    });
  }

  writeValue(value: PixelQueryGroup | null): void {
    this.storeToModelEnabled.set(true);
    this.store.setQuery(normalizeQueryGroup(value ?? createEmptyQuery()));
    this.onValidatorChange();
  }

  registerOnChange(fn: (value: PixelQueryGroup) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  validate(_control: AbstractControl): ValidationErrors | null {
    const result = validateQuery(this.store.query(), this.mergedConfig());
    if (result.valid) {
      return null;
    }
    if (this.required() && result.empty) {
      return { required: true };
    }
    return {
      invalidQuery: true,
      issues: result.ruleIssues.length + result.groupIssues.length,
    };
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  protected toggleSummaryCollapsed(): void {
    this.summaryCollapsed.update((value) => !value);
  }

  /** Returns the portable JSON export for the current query. */
  getExportJson(pretty = true): string {
    return serializeQueryExport(exportQuery(this.store.query()), pretty);
  }

  /** Loads a query from portable JSON. Returns `false` when parsing fails. */
  importFromJson(json: string): boolean {
    const result = parseQueryExportJson(json);
    if (!result.ok) {
      return false;
    }
    this.loadExportedQuery(result.export);
    return true;
  }

  /** Loads a query from a portable export object. */
  importFromExport(exported: PixelQueryExport): void {
    this.loadExportedQuery(exported);
  }

  private loadExportedQuery(exported: PixelQueryExport): void {
    const query = importQuery(exported, this.mergedConfig());
    this.store.loadQuery(query);
  }

  private publishStoreState(): void {
    const query = this.store.query();
    const config = this.mergedConfig();
    const validation = validateQuery(query, config);
    const event: PixelQueryChangeEvent = {
      query,
      export: exportQuery(query),
      valid: validation.valid,
      summary: queryToSummary(query, config),
    };
    this.queryUpdated.emit(event);
    this.validChange.emit(validation.valid);
    this.onChange(query);
    this.onValidatorChange();
  }
}

function queriesEqual(a: PixelQueryGroup, b: PixelQueryGroup): boolean {
  return JSON.stringify(exportQuery(a)) === JSON.stringify(exportQuery(b));
}
