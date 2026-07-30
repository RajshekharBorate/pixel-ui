import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import {
  PixelBadgeComponent,
  PixelTabComponent,
  PixelTabsComponent,
} from 'pixel-ui';
import { DocNavigationService } from '../../core/doc-navigation.service';
import { DocExample, DOC_TABS, DocTabId } from '../../registry/types';
import { DocAccessibilityPanelComponent } from '../../shared/doc-accessibility-panel/doc-accessibility-panel';
import { DocApiTableComponent } from '../../shared/doc-api-table/doc-api-table';
import { groupDocExamples } from '../../shared/doc-example-groups.util';
import { DocExamplePanelComponent } from '../../shared/doc-example-panel/doc-example-panel';
import { DocServiceApiTableComponent } from '../../shared/doc-service-api-table/doc-service-api-table';

@Component({
  selector: 'docs-component-doc-page',
  imports: [
    PixelBadgeComponent,
    PixelTabComponent,
    PixelTabsComponent,
    DocAccessibilityPanelComponent,
    DocApiTableComponent,
    DocExamplePanelComponent,
    DocServiceApiTableComponent,
  ],
  templateUrl: './component-doc-page.html',
  styleUrl: './component-doc-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentDocPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly nav = inject(DocNavigationService);

  protected readonly tabs = DOC_TABS;
  protected readonly componentId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('componentId') ?? '')),
    { initialValue: '' },
  );
  protected readonly activeTab = toSignal(
    this.route.paramMap.pipe(map((params) => (params.get('tab') as DocTabId) ?? 'overview')),
    { initialValue: 'overview' as DocTabId },
  );

  protected readonly component = computed(() => this.nav.getComponent(this.componentId()));

  protected exampleSections(examples: readonly DocExample[]) {
    return groupDocExamples(examples);
  }

  protected readonly tabIndex = computed(() => {
    const index = this.tabs.findIndex((tab) => tab.id === this.activeTab());
    return index >= 0 ? index : 0;
  });

  protected onTabChange(index: number): void {
    const component = this.component();
    const tab = this.tabs[index];
    if (!component || !tab) {
      return;
    }
    void this.router.navigateByUrl(this.nav.docPath(component, tab.id));
  }
}
