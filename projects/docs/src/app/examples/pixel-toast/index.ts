import { createDocExample } from '../../shared/example-source.util';
import { ToastActionsExample } from './toast-actions.example';
import { ToastAvatarExample } from './toast-avatar.example';
import { ToastBasicExample } from './toast-basic.example';
import { ToastConfigureExample } from './toast-configure.example';
import { ToastCustomIconExample } from './toast-custom-icon.example';
import { ToastDeclarativeExample } from './toast-declarative.example';
import { ToastDuplicateExample } from './toast-duplicate.example';
import { ToastExpandableExample } from './toast-expandable.example';
import { ToastInlineExample } from './toast-inline.example';
import { ToastLoadingExample } from './toast-loading.example';
import { ToastLongContentExample } from './toast-long-content.example';
import { ToastOfflineOnlineExample } from './toast-offline-online.example';
import { ToastOutlinedExample } from './toast-outlined.example';
import { ToastPersistentExample } from './toast-persistent.example';
import { ToastPositionsExample } from './toast-positions.example';
import { ToastProgressExample } from './toast-progress.example';
import { ToastPromiseExample } from './toast-promise.example';
import { ToastQueueExample } from './toast-queue.example';
import { ToastRetryExample } from './toast-retry.example';
import { ToastSemanticExample } from './toast-semantic.example';
import { ToastUndoExample } from './toast-undo.example';
import { ToastUpdateExample } from './toast-update.example';
import { ToastVariantsExample } from './toast-variants.example';

const TOAST_IMPORTS = [
  'PixelToastService',
  'PixelToastContainerComponent',
  'PixelToastInlineComponent',
  'PixelButtonComponent',
] as const;

export const TOAST_EXAMPLES = [
  createDocExample({
    id: 'basic',
    title: 'Basic toast',
    category: 'Setup',
    description: 'Add pixel-toast-container once in your shell, then inject PixelToastService anywhere.',
    component: ToastBasicExample,
    imports: [...TOAST_IMPORTS],
    html: `<pixel-toast-container />
<pixel-button appearance="solid" (click)="saveDraft()">Save draft</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-basic-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  templateUrl: './basic.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastBasicExample {
  private readonly toast = inject(PixelToastService);

  protected saveDraft(): void {
    this.toast.success('Saved', 'Your draft was stored.');
  }
}`,
  }),
  createDocExample({
    id: 'variants',
    title: 'Visual variants',
    category: 'Variants',
    description: 'Compare soft, solid, and outlined surfaces on the same semantic info toast.',
    component: ToastVariantsExample,
    imports: [...TOAST_IMPORTS],
    html: `<pixel-toast-container />
<div class="row">
  <pixel-button appearance="outline" (click)="show('soft')">Soft</pixel-button>
  <pixel-button appearance="outline" (click)="show('solid')">Solid</pixel-button>
  <pixel-button appearance="outline" (click)="show('outlined')">Outlined</pixel-button>
</div>`,
    typescript: `this.toast.info('Policy saved', 'Compare variants.', { variant: 'soft' });`,
    scss: `.row { display: flex; flex-wrap: wrap; gap: 0.75rem; }`,
  }),
  createDocExample({
    id: 'semantic',
    title: 'Semantic types',
    category: 'Variants',
    description: 'Success, error, warning, and info toasts map to system semantic tokens.',
    component: ToastSemanticExample,
    imports: [...TOAST_IMPORTS],
    html: `<pixel-toast-container />
<div class="row">
  @for (item of semanticTypes; track item.type) {
    <pixel-button appearance="outline" (click)="show(item.type, item.title, item.message)">
      {{ item.title }}
    </pixel-button>
  }
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-semantic-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  templateUrl: './semantic.example.html',
  styleUrl: './semantic.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastSemanticExample {
  private readonly toast = inject(PixelToastService);

  protected readonly semanticTypes = [
    { type: 'success' as const, title: 'Success', message: 'Changes were saved.' },
    { type: 'error' as const, title: 'Error', message: 'Payment could not be processed.' },
    { type: 'warning' as const, title: 'Warning', message: 'Session expires in 5 minutes.' },
    { type: 'info' as const, title: 'Info', message: 'Exports may take up to 24 hours.' },
  ];

  protected show(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string): void {
    this.toast[type](title, message);
  }
}`,
    scss: `.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}`,
  }),
  createDocExample({
    id: 'promise',
    title: 'Promise lifecycle',
    category: 'Lifecycle & async',
    description: 'toast.promise() transitions from loading to success or error automatically.',
    component: ToastPromiseExample,
    imports: [...TOAST_IMPORTS],
    html: `<pixel-toast-container />
<pixel-button appearance="solid" (click)="upload()">Upload file</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-promise-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  templateUrl: './promise.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastPromiseExample {
  private readonly toast = inject(PixelToastService);

  protected upload(): void {
    void this.toast.promise(
      new Promise<void>((resolve) => window.setTimeout(resolve, 1600)),
      {
        loading: 'Uploading file…',
        success: 'Upload complete',
        error: 'Upload failed',
      },
    );
  }
}`,
  }),
  createDocExample({
    id: 'declarative',
    title: 'Declarative pixel-toast',
    category: 'Placement',
    description: 'Render static inline banners with pixel-toast — no service required.',
    component: ToastDeclarativeExample,
    imports: ['PixelToastComponent'],
    html: `<pixel-toast type="warning" variant="outlined" placement="inline" message="Session expires in 5 minutes." [closeButton]="false" />`,
    typescript: `import { PixelToastComponent } from 'pixel-ui';`,
  }),
  createDocExample({
    id: 'inline',
    title: 'Inline via service',
    category: 'Placement',
    description: 'Render toasts in document flow with pixel-toast-inline and toast.inline().',
    component: ToastInlineExample,
    imports: [...TOAST_IMPORTS],
    html: `<pixel-toast-inline />
<p class="lede">Inline toasts render in document flow — ideal for form banners.</p>
<div class="actions">
  <pixel-button appearance="outline" (click)="showWarning()">Show warning</pixel-button>
  <pixel-button appearance="text" (click)="clear()">Clear</pixel-button>
</div>`,
    typescript: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastInlineComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-inline-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastInlineComponent],
  templateUrl: './inline.example.html',
  styleUrl: './inline.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastInlineExample {
  private readonly toast = inject(PixelToastService);

  protected showWarning(): void {
    this.toast.inline({
      type: 'warning',
      variant: 'outlined',
      message: 'Session expires in 5 minutes.',
      disableTimeOut: true,
    });
  }

  protected clear(): void {
    this.toast.clearInline();
  }
}`,
    scss: `:host {
  display: grid;
  gap: 0.75rem;
}

.lede {
  margin: 0;
  font-size: 0.875rem;
  color: color-mix(in srgb, var(--pixel-sys-on-surface) 72%, transparent);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}`,
  }),
  createDocExample({
    id: 'outlined',
    title: 'Outlined variant',
    category: 'Variants',
    description: 'Light tinted surface with semantic border — suited to banners and alerts.',
    component: ToastOutlinedExample,
    imports: [...TOAST_IMPORTS],
    html: `<pixel-toast-container />
<pixel-button appearance="outline" (click)="show()">Outlined overlay</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-outlined-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  templateUrl: './outlined.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastOutlinedExample {
  private readonly toast = inject(PixelToastService);

  protected show(): void {
    this.toast.warning('Session expires in 5 minutes.', undefined, {
      variant: 'outlined',
      closeButton: true,
    });
  }
}`,
  }),
  createDocExample({
    id: 'loading',
    title: 'Loading toast',
    category: 'Lifecycle & async',
    description: 'Show a loading toast and remove or update it when an async task completes.',
    component: ToastLoadingExample,
    imports: [...TOAST_IMPORTS],
    html: `<pixel-toast-container />
<pixel-button appearance="solid" (click)="show()">Show loading</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-loading-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  templateUrl: './loading.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastLoadingExample {
  private readonly toast = inject(PixelToastService);

  protected show(): void {
    const id = this.toast.loading('Processing', 'Please wait while we sync your workspace.');
    window.setTimeout(() => this.toast.remove(id), 4000);
  }
}`,
  }),
  createDocExample({
    id: 'actions',
    title: 'Action buttons',
    category: 'Actions & dismissal',
    description: 'Attach primary and secondary actions with an onAction callback.',
    component: ToastActionsExample,
    imports: [...TOAST_IMPORTS],
    html: `<pixel-toast-container />
<pixel-button appearance="solid" (click)="show()">New comment</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-actions-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  templateUrl: './actions.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastActionsExample {
  private readonly toast = inject(PixelToastService);

  protected show(): void {
    this.toast.show({
      type: 'info',
      title: 'New comment',
      message: 'Alex replied on the billing thread.',
      actions: [
        { id: 'view', label: 'View', primary: true },
        { id: 'dismiss', label: 'Dismiss' },
      ],
      onAction: (id) => console.log('Action:', id),
    });
  }
}`,
  }),
  createDocExample({
    id: 'undo',
    title: 'Undo action',
    category: 'Actions & dismissal',
    description: 'Offer a time-limited undo for destructive operations.',
    component: ToastUndoExample,
    imports: [...TOAST_IMPORTS],
    html: `<pixel-toast-container />
<pixel-button appearance="solid" (click)="show()">Archive item</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-undo-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  templateUrl: './undo.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastUndoExample {
  private readonly toast = inject(PixelToastService);

  protected show(): void {
    this.toast.show({
      type: 'default',
      title: 'Item archived',
      message: 'You can restore it within 10 seconds.',
      timeOut: 10000,
      undoAction: { id: 'undo', label: 'Undo' },
      onUndo: () => this.toast.info('Restored', 'The item was moved back.'),
    });
  }
}`,
  }),
  createDocExample({
    id: 'retry',
    title: 'Retry action',
    category: 'Actions & dismissal',
    description: 'Persistent error toasts with a retry button.',
    component: ToastRetryExample,
    imports: [...TOAST_IMPORTS],
    html: `<pixel-toast-container />
<pixel-button appearance="solid" (click)="show()">Simulate failure</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-retry-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  templateUrl: './retry.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastRetryExample {
  private readonly toast = inject(PixelToastService);

  protected show(): void {
    this.toast.show({
      type: 'error',
      title: 'Connection lost',
      message: 'We could not reach the API.',
      disableTimeOut: true,
      retryAction: { id: 'retry', label: 'Retry', primary: true },
      onRetry: () => this.toast.success('Connected', 'The API is reachable again.'),
    });
  }
}`,
  }),
  createDocExample({
    id: 'persistent',
    title: 'Persistent toast',
    category: 'Actions & dismissal',
    description: 'disableTimeOut keeps the toast until the user dismisses it.',
    component: ToastPersistentExample,
    imports: [...TOAST_IMPORTS],
    html: `<pixel-toast-container />
<pixel-button appearance="solid" (click)="show()">Maintenance notice</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-persistent-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  templateUrl: './persistent.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastPersistentExample {
  private readonly toast = inject(PixelToastService);

  protected show(): void {
    this.toast.show({
      type: 'system',
      title: 'Maintenance window',
      message: 'Read-only mode until 02:00 UTC.',
      disableTimeOut: true,
      progressBar: false,
    });
  }
}`,
  }),
  createDocExample({
    id: 'positions',
    title: 'Overlay positions',
    category: 'Placement',
    description: 'Configure top/bottom and left/center/right anchor points for overlay toasts.',
    component: ToastPositionsExample,
    imports: [...TOAST_IMPORTS],
    html: `<pixel-toast-container />
<pixel-select label="Position" size="sm" [options]="positionOptions" [value]="position()" (valueChange)="position.set($any($event))" />
<pixel-button appearance="solid" (click)="show()">Show toast</pixel-button>`,
    typescript: `this.toast.configure({ position: this.position() });
this.toast.success('Position demo', \`Rendering at \${this.position()}.\`);`,
  }),
  createDocExample({
    id: 'configure',
    title: 'Global configuration',
    category: 'Service & configuration',
    description: 'toast.configure() sets defaults for position, maxVisible, variant, and timeout.',
    component: ToastConfigureExample,
    imports: [...TOAST_IMPORTS],
    html: `<pixel-button (click)="apply()">Apply global config</pixel-button>`,
    typescript: `this.toast.configure({ position: 'bottom-right', maxVisible: 3, variant: 'soft' });`,
  }),
  createDocExample({
    id: 'update',
    title: 'Update active toast',
    category: 'Service & configuration',
    description: 'toast.update() patches a toast in place — ideal for loading → success transitions.',
    component: ToastUpdateExample,
    imports: [...TOAST_IMPORTS],
    html: `<pixel-button (click)="run()">Sync workspace</pixel-button>`,
    typescript: `const id = this.toast.loading('Syncing', '…');
this.toast.update(id, { type: 'success', title: 'Sync complete' });`,
  }),
  createDocExample({
    id: 'queue',
    title: 'Queue management',
    category: 'Service & configuration',
    description: 'enableQueue and maxVisible control how many overlay toasts show at once.',
    component: ToastQueueExample,
    imports: [...TOAST_IMPORTS],
    html: `<pixel-toast-container />
<pixel-button appearance="solid" (click)="show()">Queue five toasts</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-queue-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  templateUrl: './queue.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastQueueExample {
  private readonly toast = inject(PixelToastService);

  protected show(): void {
    this.toast.configure({ maxVisible: 2, enableQueue: true });
    for (let i = 1; i <= 5; i++) {
      this.toast.info(\`Queued #\${i}\`, \`Toast \${i} of 5\`);
    }
  }
}`,
  }),
  createDocExample({
    id: 'duplicate',
    title: 'Duplicate prevention',
    category: 'Service & configuration',
    description: 'duplicatePrevention blocks identical title and message pairs.',
    component: ToastDuplicateExample,
    imports: [...TOAST_IMPORTS],
    html: `<pixel-toast-container />
<pixel-button appearance="solid" (click)="show()">Duplicate block test</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-duplicate-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  templateUrl: './duplicate.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastDuplicateExample {
  private readonly toast = inject(PixelToastService);

  protected show(): void {
    this.toast.configure({ duplicatePrevention: true });
    this.toast.info('Sync', 'Already in progress');
    this.toast.info('Sync', 'Already in progress');
  }
}`,
  }),
  createDocExample({
    id: 'pixel-progress',
    title: 'Progress bar',
    category: 'Content & layout',
    description: 'Visual countdown for auto-dismiss toasts.',
    component: ToastProgressExample,
    imports: [...TOAST_IMPORTS],
    html: `<pixel-toast-container />
<pixel-button appearance="solid" (click)="show()">Export report</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-progress-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  templateUrl: './progress.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastProgressExample {
  private readonly toast = inject(PixelToastService);

  protected show(): void {
    this.toast.show({
      type: 'info',
      title: 'Exporting report',
      message: 'Large CSV — auto dismiss when complete.',
      timeOut: 6000,
      progressBar: true,
    });
  }
}`,
  }),
  createDocExample({
    id: 'long-content',
    title: 'Long content',
    category: 'Content & layout',
    description: 'Scrollable copy region with contentMaxHeight for lengthy messages.',
    component: ToastLongContentExample,
    imports: [...TOAST_IMPORTS],
    html: `<pixel-toast-container />
<pixel-button appearance="solid" (click)="show()">Policy update</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-long-content-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  templateUrl: './long-content.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastLongContentExample {
  private readonly toast = inject(PixelToastService);

  protected show(): void {
    this.toast.show({
      type: 'warning',
      title: 'Policy update requires review',
      message: 'Sections 4.2, 7.1, and 9.4 changed regarding data retention in EU regions…',
      contentMaxHeight: '10rem',
      disableTimeOut: true,
      actions: [{ id: 'review', label: 'Review policy', primary: true }],
    });
  }
}`,
  }),
  createDocExample({
    id: 'expandable',
    title: 'Expandable details',
    category: 'Content & layout',
    description: 'Collapsible details section for supplementary information.',
    component: ToastExpandableExample,
    imports: [...TOAST_IMPORTS],
    html: `<pixel-toast-container />
<pixel-button appearance="solid" (click)="show()">Policy update</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-expandable-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  templateUrl: './expandable.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastExpandableExample {
  private readonly toast = inject(PixelToastService);

  protected show(): void {
    this.toast.show({
      type: 'warning',
      title: 'Policy update',
      message: 'Review the summary before continuing.',
      details: 'Sections 4.2 and 7.1 changed regarding data retention in EU regions.',
      expandable: true,
      expanded: false,
      timeOut: 12000,
    });
  }
}`,
  }),
  createDocExample({
    id: 'pixel-avatar',
    title: 'Avatar and metadata',
    category: 'Content & layout',
    description: 'Custom toasts with imageSrc, category, and timestamp.',
    component: ToastAvatarExample,
    imports: [...TOAST_IMPORTS],
    html: `<pixel-toast-container />
<pixel-button appearance="solid" (click)="show()">Team notification</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-avatar-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  templateUrl: './avatar.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastAvatarExample {
  private readonly toast = inject(PixelToastService);

  protected show(): void {
    this.toast.show({
      type: 'custom',
      title: 'Maya Chen',
      message: 'Assigned you to the Q2 rollout.',
      imageSrc: 'https://i.pravatar.cc/40?img=32',
      category: 'Team',
      timestamp: new Date(),
    });
  }
}`,
  }),
  createDocExample({
    id: 'custom-icon',
    title: 'Custom icon',
    category: 'Content & layout',
    description: 'Use a Material icon name instead of the default semantic icon.',
    component: ToastCustomIconExample,
    imports: [...TOAST_IMPORTS],
    html: `<pixel-toast-container />
<pixel-button appearance="solid" (click)="show()">Milestone</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-custom-icon-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  templateUrl: './custom-icon.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastCustomIconExample {
  private readonly toast = inject(PixelToastService);

  protected show(): void {
    this.toast.show({
      type: 'custom',
      icon: 'celebration',
      title: 'Milestone',
      message: '100 deployments this week.',
      variant: 'solid',
    });
  }
}`,
  }),
  createDocExample({
    id: 'offline-online',
    title: 'Offline and online',
    category: 'Lifecycle & async',
    description: 'toast.offline() and toast.online() for connectivity state changes.',
    component: ToastOfflineOnlineExample,
    imports: [...TOAST_IMPORTS],
    html: `<pixel-toast-container />
<pixel-button appearance="solid" (click)="simulate()">Simulate reconnect</pixel-button>`,
    typescript: `import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PixelButtonComponent,
  PixelToastContainerComponent,
  PixelToastService,
} from 'pixel-ui';

@Component({
  selector: 'docs-toast-offline-online-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelToastContainerComponent],
  templateUrl: './offline-online.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastOfflineOnlineExample {
  private readonly toast = inject(PixelToastService);

  protected simulate(): void {
    const offlineId = this.toast.offline('Offline', 'Changes will sync when you reconnect.');
    window.setTimeout(() => {
      this.toast.remove(offlineId);
      this.toast.online('Back online', 'All pending changes synced.');
    }, 2500);
  }
}`,
  }),
] as const;
