import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PixelButtonComponent, PixelDrawerService } from 'pixel-ui';
import {
  DocsCreatePolicyData,
  DocsCreatePolicyResult,
  DocsDrawerServiceContentComponent,
} from './drawer-service-content.component';

@Component({
  selector: 'docs-drawer-service-example',
  standalone: true,
  imports: [PixelButtonComponent],
  templateUrl: './drawer-service.example.html',
  styleUrl: './drawer-service.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerServiceExample {
  private readonly drawer = inject(PixelDrawerService);
  protected readonly lastResult = signal('');

  protected openViaService(): void {
    const ref = this.drawer.open<
      DocsDrawerServiceContentComponent,
      DocsCreatePolicyData,
      DocsCreatePolicyResult
    >(DocsDrawerServiceContentComponent, {
      title: 'Create policy',
      position: 'end',
      size: 'lg',
      data: { owner: 'Ada Lovelace' },
    });
    ref.afterClosed().subscribe((result) => {
      this.lastResult.set(
        result
          ? `Created "${result.name}" (owner ${result.owner})`
          : 'Dismissed without creating a policy',
      );
    });
  }
}
