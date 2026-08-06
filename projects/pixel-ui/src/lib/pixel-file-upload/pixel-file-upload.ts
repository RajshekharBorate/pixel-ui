import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  NgControl,
  ValidationErrors,
  Validator,
  Validators,
} from '@angular/forms';
import { merge } from 'rxjs';
import PixelButtonComponent from '../pixel-button/pixel-button';
import PixelSkeletonComponent from '../pixel-loader/pixel-skeleton';
import PixelTooltipDirective from '../pixel-tooltip/pixel-tooltip';
// Type-only imports — no runtime cost; the service is loaded lazily only when autoTransfer is used.
import type { PixelUploadService } from '../services/file-transfer/upload.service';
import type { PixelUploadTask } from '../services/file-transfer/file-transfer.types';
import {
  type PixelFileRejection,
  type PixelFileSelectEvent,
  type PixelFileUploadLabels,
  type PixelFileUploadSize,
  type PixelFileUploadValidationMessages,
  type PixelFileUploadVariant,
  type PixelUploadedFile,
  DEFAULT_PIXEL_FILE_UPLOAD_LABELS,
  fileIcon,
  formatFileSize,
  generateFileId,
  isFileAccepted,
  pixelFileUploadFormatLabel,
} from './pixel-file-upload.types';

export type {
  PixelFileRejection,
  PixelFileSelectEvent,
  PixelFileUploadLabels,
  PixelFileUploadSize,
  PixelFileUploadValidationMessages,
  PixelFileUploadVariant,
  PixelUploadedFile,
};

export { DEFAULT_PIXEL_FILE_UPLOAD_LABELS, pixelFileUploadFormatLabel };

const DEFAULT_VALIDATION_MESSAGES: Required<Pick<PixelFileUploadValidationMessages, 'required' | 'fileInvalid'>> = {
  required: 'Please select a file.',
  fileInvalid: 'One or more files are invalid.',
};

let nextUploadId = 0;

/**
 * File upload component. Two variants:
 *
 * - **`dropzone`** — Drag-and-drop zone with click-to-browse. Shows file list below.
 * - **`button`** — Compact trigger button. File list rendered beneath it.
 *
 * Implements `ControlValueAccessor`; form value is `File | null` (single) or `File[]` (multiple).
 *
 * @example
 * ```html
 * <pixel-file-upload label="Documents" accept=".pdf,.docx" [multiple]="true" [(value)]="files" />
 * ```
 */
@Component({
  selector: 'pixel-file-upload',
  imports: [PixelButtonComponent, PixelSkeletonComponent, PixelTooltipDirective],
  templateUrl: './pixel-file-upload.html',
  styleUrl: './pixel-file-upload.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pixel-file-upload-host',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[class.pixel-file-upload-host--disabled]': 'isDisabled()',
  },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PixelFileUploadComponent), multi: true },
    { provide: NG_VALIDATORS,     useExisting: forwardRef(() => PixelFileUploadComponent), multi: true },
  ],
})
export default class PixelFileUploadComponent implements ControlValueAccessor, Validator {
  protected readonly fallbackId = `pixel-upload-${++nextUploadId}`;
  private readonly injector  = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInputRef');

  // ── Internal state ──────────────────────────────────────────────────────────
  protected readonly files       = signal<readonly PixelUploadedFile[]>([]);
  protected readonly isDragOver  = signal(false);
  protected readonly isFocused   = signal(false);
  private readonly formDisabled  = signal(false);
  private readonly controlShowsError = signal(false);
  private readonly controlErrors     = signal<ValidationErrors | null>(null);
  private previews: Map<string, string> = new Map(); // id → object URL

  // ── autoTransfer wiring ──────────────────────────────────────────────────────
  /** Upload service captured lazily once autoTransfer first queues a file. */
  private readonly uploadEngine = signal<PixelUploadService | null>(null);
  /** Maps a list-item id → its transfer task id. */
  private readonly itemToTask = new Map<string, string>();

  private onChange: (v: File | File[] | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;

  // ── Inputs ──────────────────────────────────────────────────────────────────

  /** Visual variant. */
  readonly variant = input<PixelFileUploadVariant>('dropzone');

  /** Density scale. */
  readonly size = input<PixelFileUploadSize>('md');

  /** Controlled value (for standalone use). */
  readonly value = input<File | File[] | null>(null);

  /** Accepted MIME types or extensions e.g. `"image/*, .pdf"`. Empty = all. */
  readonly accept = input('');

  /** Allow selecting multiple files. */
  readonly multiple = input(false, { transform: booleanAttribute });

  /** Maximum file size per file in bytes. 0 = no limit. */
  readonly maxSize = input(0, { transform: numberAttribute });

  /** Maximum total number of files. 0 = no limit. */
  readonly maxFiles = input(0, { transform: numberAttribute });

  /** Maximum combined size of all selected files in bytes. 0 = no limit. */
  readonly maxTotalSize = input(0, { transform: numberAttribute });

  /**
   * Consumer-supplied validators run per file after the built-in checks. Each returns
   * an error message string when invalid, or null when valid.
   */
  readonly validators = input<readonly ((file: File) => string | null)[]>([]);

  /** Visible label shown above the upload area. */
  readonly label = input('');

  /** Hint text below the upload area. */
  readonly helperText = input('');

  /** Custom text shown inside the dropzone (first line). When empty, falls back to
   * `dropTextMultiple` / `dropTextSingle` based on `multiple`. */
  readonly dropText = input('');

  /**
   * Default dropzone copy when `multiple` and `dropText` is empty.
   *
   * @type {string}
   * @default 'Drag files here or click to browse'
   */
  readonly dropTextMultiple = input('Drag files here or click to browse');

  /**
   * Default dropzone copy when single-file and `dropText` is empty.
   *
   * @type {string}
   * @default 'Drag a file here or click to browse'
   */
  readonly dropTextSingle = input('Drag a file here or click to browse');

  /** Custom label for the trigger button (button variant). When empty, falls back to
   * `buttonLabelMultiple` / `buttonLabelSingle`. */
  readonly buttonLabel = input('');

  /**
   * Default button label when `multiple` and `buttonLabel` is empty.
   *
   * @type {string}
   * @default 'Choose files'
   */
  readonly buttonLabelMultiple = input('Choose files');

  /**
   * Default button label when single-file and `buttonLabel` is empty.
   *
   * @type {string}
   * @default 'Choose file'
   */
  readonly buttonLabelSingle = input('Choose file');

  /**
   * Partial i18n overrides for ARIA names and per-file rejection messages.
   *
   * @type {Partial<PixelFileUploadLabels>}
   * @default {}
   */
  readonly labels = input<Partial<PixelFileUploadLabels>>({});

  /** Show image thumbnails for image files. */
  readonly showPreview = input(true, { transform: booleanAttribute });

  /** Marks the control as required (also auto-detected from a bound FormControl). */
  readonly required = input(false, { transform: booleanAttribute });

  /** Messages shown for each validation error key when the control is invalid and touched/dirty. */
  readonly validationMessages = input<PixelFileUploadValidationMessages>({});

  /** Disables interaction. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Show skeleton placeholder while loading. */
  readonly showSkeleton = input(false, { transform: booleanAttribute });

  /**
   * When true, accepted files are automatically queued on PixelFileTransferService
   * (the UI-independent transfer engine). The service is resolved lazily so consumers
   * that leave this off never pull in HttpClient.
   */
  readonly autoTransfer = input(false, { transform: booleanAttribute });

  /** Upload URL passed to the transfer engine when autoTransfer is on. */
  readonly transferUrl = input('');

  // ── Outputs ─────────────────────────────────────────────────────────────────

  /** Emits every time the file selection changes (including removals). */
  readonly filesChange = output<PixelFileSelectEvent>();

  /** Emits the transfer task ids created when autoTransfer queues accepted files. */
  readonly transferQueued = output<string[]>();

  // ── Effects ─────────────────────────────────────────────────────────────────

  private readonly syncExternalValue = effect(() => {
    const v = this.value();
    untracked(() => {
      if (this.resolveFormControl()) return;
      if (v === null) { this.clearAll(); return; }
      const fileList = Array.isArray(v) ? v : [v];
      this.applyFiles(fileList.map((f) => ({ id: generateFileId(), file: f, preview: null, error: null })));
    });
  });

  private readonly syncControlErrors = effect((onCleanup) => {
    const control = untracked(() => this.resolveFormControl());
    if (!control) { untracked(() => { this.controlShowsError.set(false); this.controlErrors.set(null); }); return; }
    const sync = () => {
      this.controlErrors.set(control.errors);
      this.controlShowsError.set(Boolean(control.invalid && (control.touched || control.dirty)));
    };
    sync();
    const sub = merge(control.statusChanges, control.valueChanges, control.events).subscribe(sync);
    onCleanup(() => sub.unsubscribe());
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      // Revoke any object URLs created for previews to avoid memory leaks.
      this.previews.forEach((url) => URL.revokeObjectURL(url));
      this.previews.clear();
    });
  }

  // ── Computed ─────────────────────────────────────────────────────────────────

  protected readonly isDisabled  = computed(() => this.disabled() || this.formDisabled());
  protected readonly hasError    = computed(() => this.controlShowsError());
  protected readonly fileCount   = computed(() => this.files().length);
  protected readonly hasFiles    = computed(() => this.fileCount() > 0);
  protected readonly showLabel   = computed(() => !!this.label().trim());

  /**
   * Resolved validation message — mirrors pixel-input. Returns the user-facing copy for the
   * first matching error key (required first, then fileInvalid, then any custom key), falling
   * back to sensible defaults. Empty string when not in an error state.
   */
  protected readonly resolvedValidationMessage = computed(() => {
    if (!this.controlShowsError()) return '';
    const errors = this.controlErrors();
    if (!errors) return '';
    const messages: PixelFileUploadValidationMessages = { ...DEFAULT_VALIDATION_MESSAGES, ...this.validationMessages() };
    for (const key of ['required', 'fileInvalid', ...Object.keys(errors)]) {
      if (errors[key] != null) {
        const msg = messages[key]?.trim();
        if (msg) return msg;
      }
    }
    return '';
  });

  protected readonly showHelper = computed(
    () => !!this.helperText().trim() && !this.resolvedValidationMessage(),
  );

  /**
   * True when the field is required — either via the `[required]` input OR because the
   * bound NgControl has `Validators.required` set. This mirrors pixel-input's pattern so
   * the user never needs to pass `[required]="true"` when the form control already declares it.
   */
  protected readonly isRequiredField = computed(() => {
    if (this.required()) return true;
    return this.isControlRequired(this.resolveFormControl());
  });

  protected readonly l = computed(() => ({
    ...DEFAULT_PIXEL_FILE_UPLOAD_LABELS,
    ...this.labels(),
  }));

  protected readonly resolvedDropText = computed(() =>
    this.dropText() ||
    (this.multiple() ? this.dropTextMultiple() : this.dropTextSingle()),
  );

  protected readonly resolvedButtonLabel = computed(() =>
    this.buttonLabel() ||
    (this.multiple() ? this.buttonLabelMultiple() : this.buttonLabelSingle()),
  );

  protected readonly acceptHint = computed(() => {
    const a = this.accept().trim();
    if (!a) return this.l().allFileTypes;
    return a.split(',').map((t) => t.trim()).join(', ');
  });

  protected readonly maxSizeHint = computed(() =>
    this.maxSize() > 0
      ? pixelFileUploadFormatLabel(this.l().maxSizeHint, {
          size: formatFileSize(this.maxSize()),
        })
      : '',
  );

  protected readonly skeletonHeight = computed(() => {
    if (this.variant() === 'button') return '2.5rem';
    switch (this.size()) {
      case 'xs': return '6rem';
      case 'sm': return '7rem';
      case 'lg': return '11rem';
      default:   return '9rem';
    }
  });

  // ── ControlValueAccessor ────────────────────────────────────────────────────

  writeValue(value: unknown): void {
    if (value === null || value === undefined) { this.clearAll(); return; }
    const list = Array.isArray(value) ? value as File[] : [value as File];
    this.applyFiles(list.map((f) => ({ id: generateFileId(), file: f, preview: null, error: null })));
  }

  registerOnChange(fn: (v: File | File[] | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.formDisabled.set(d); }

  // ── Validator ───────────────────────────────────────────────────────────────

  validate(control: AbstractControl): ValidationErrors | null {
    // Required: no files selected and the control is required (input or form validator).
    if (this.isControlRequired(control) && this.files().length === 0) {
      return { required: true };
    }
    // File-level validation errors (type / size).
    const invalid = this.files().filter((f) => f.error);
    if (invalid.length) return { fileInvalid: true };
    return null;
  }

  registerOnValidatorChange(fn: () => void): void { this.onValidatorChange = fn; }

  // ── File input ───────────────────────────────────────────────────────────────

  protected openFilePicker(): void {
    if (this.isDisabled()) return;
    this.fileInputRef()?.nativeElement.click();
  }

  protected onNativeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const list  = Array.from(input.files ?? []);
    input.value = ''; // reset so same file can be re-selected
    this.processFiles(list);
  }

  // ── Drag and drop ────────────────────────────────────────────────────────────

  protected onDragOver(event: DragEvent): void {
    if (this.isDisabled()) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  protected onDrop(event: DragEvent): void {
    if (this.isDisabled()) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const list = Array.from(event.dataTransfer?.files ?? []);
    this.processFiles(list);
    this.onTouched();
  }

  // ── File management ──────────────────────────────────────────────────────────

  protected removeFile(id: string): void {
    const preview = this.previews.get(id);
    if (preview) { URL.revokeObjectURL(preview); this.previews.delete(id); }
    const next = this.files().filter((f) => f.id !== id);
    this.applyFiles(next);
    this.onTouched();
    this.commitValue();
  }

  protected clearAll(): void {
    this.previews.forEach((url) => URL.revokeObjectURL(url));
    this.previews.clear();
    this.files.set([]);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  protected formatSize(bytes: number): string { return formatFileSize(bytes); }
  protected fileIcon(mime: string): string     { return fileIcon(mime); }

  protected isImage(file: File): boolean {
    return file.type.startsWith('image/') && this.showPreview();
  }

  protected previewUrl(id: string): string | null {
    return this.previews.get(id) ?? null;
  }

  protected actionLabel(
    kind: 'retry' | 'cancel' | 'remove',
    name: string,
  ): string {
    const l = this.l();
    const template = kind === 'retry' ? l.retry : kind === 'cancel' ? l.cancel : l.remove;
    return pixelFileUploadFormatLabel(template, { name });
  }

  protected maxFilesHintText(): string {
    const n = this.maxFiles();
    return pixelFileUploadFormatLabel(this.l().maxFilesHint, {
      n,
      plural: n !== 1 ? 's' : '',
    });
  }

  private processFiles(incoming: readonly File[]): void {
    const accepted: PixelUploadedFile[] = [];
    const rejected: PixelFileRejection[] = [];
    const currentCount = this.multiple() ? this.files().length : 0;
    // Running total includes already-selected files (multi mode) for the combined cap.
    let runningTotal = this.multiple()
      ? this.files().reduce((sum, f) => sum + f.file.size, 0)
      : 0;
    const validators = this.validators();

    incoming.forEach((file, i) => {
      const errors: string[] = [];

      if (this.accept() && !isFileAccepted(file, this.accept())) {
        errors.push(
          pixelFileUploadFormatLabel(this.l().fileTypeNotAllowed, { accept: this.accept() }),
        );
      }
      if (this.maxSize() > 0 && file.size > this.maxSize()) {
        errors.push(
          pixelFileUploadFormatLabel(this.l().fileExceedsMaxSize, {
            size: formatFileSize(this.maxSize()),
          }),
        );
      }
      if (this.maxFiles() > 0 && currentCount + accepted.length + i + 1 > this.maxFiles()) {
        const n = this.maxFiles();
        errors.push(
          pixelFileUploadFormatLabel(this.l().maxFilesAllowed, {
            n,
            plural: n !== 1 ? 's' : '',
          }),
        );
      }
      if (this.maxTotalSize() > 0 && runningTotal + file.size > this.maxTotalSize()) {
        errors.push(
          pixelFileUploadFormatLabel(this.l().totalSizeExceeds, {
            size: formatFileSize(this.maxTotalSize()),
          }),
        );
      }
      // Consumer-supplied validators (first failing message wins).
      for (const v of validators) {
        const msg = v(file);
        if (msg) { errors.push(msg); break; }
      }

      if (!errors.length) runningTotal += file.size;

      if (errors.length) {
        rejected.push({ file, errors });
      } else {
        accepted.push({ id: generateFileId(), file, preview: null, error: null });
      }
    });

    // Generate previews for image files
    accepted.forEach((item) => {
      if (item.file.type.startsWith('image/') && this.showPreview()) {
        const url = URL.createObjectURL(item.file);
        this.previews.set(item.id, url);
      }
    });

    const next = this.multiple()
      ? [...this.files(), ...accepted]
      : accepted.slice(0, 1);

    this.applyFiles(next);
    this.commitValue();

    this.filesChange.emit({ accepted, rejected });

    // Opt-in: hand accepted files to the file-transfer engine for queued upload.
    if (this.autoTransfer() && accepted.length) {
      this.delegateToTransfer(accepted);
    }
  }

  /**
   * Lazily resolves PixelFileTransferService and queues the accepted items. Resolution
   * is lazy (via the existing Injector) so consumers that never set [autoTransfer] don't
   * pull in HttpClient. Records each item→task mapping so the list can show live progress,
   * and emits the created task ids via (transferQueued).
   */
  private delegateToTransfer(items: readonly PixelUploadedFile[]): void {
    import('../services/file-transfer/file-transfer.service').then(({ PixelFileTransferService }) => {
      const transfer = this.injector.get(PixelFileTransferService);
      // Capture the upload service so the template can react to its task signal.
      this.uploadEngine.set(transfer.uploads);
      const ids = items.map((item) => {
        const taskId = transfer.upload(item.file, { url: this.transferUrl() || undefined });
        this.itemToTask.set(item.id, taskId);
        return taskId;
      });
      this.transferQueued.emit(ids);
    });
  }

  /** The transfer task tied to a list item, or undefined when autoTransfer is off. */
  protected transferTask(itemId: string): PixelUploadTask | undefined {
    const engine = this.uploadEngine();
    if (!engine) return undefined;
    const taskId = this.itemToTask.get(itemId);
    return taskId ? engine.tasks().find((t) => t.id === taskId) : undefined;
  }

  protected cancelTransfer(itemId: string): void {
    const id = this.itemToTask.get(itemId);
    if (id) this.uploadEngine()?.cancelUpload(id);
  }

  protected retryTransfer(itemId: string): void {
    const id = this.itemToTask.get(itemId);
    if (id) this.uploadEngine()?.retryUpload(id);
  }

  private applyFiles(items: readonly PixelUploadedFile[]): void {
    this.files.set(items);
  }

  private commitValue(): void {
    const files = this.files().map((f) => f.file);
    const value: File | File[] | null = this.multiple()
      ? files
      : (files[0] ?? null);
    this.onChange(value);
  }

  private resolveFormControl(): AbstractControl | null {
    return this.injector.get(NgControl, null, { optional: true, self: true })?.control ?? null;
  }

  private isControlRequired(control: AbstractControl | null): boolean {
    return Boolean(this.required() || control?.hasValidator?.(Validators.required));
  }
}
