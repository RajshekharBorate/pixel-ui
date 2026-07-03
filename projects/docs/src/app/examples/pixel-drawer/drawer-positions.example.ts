import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PixelButtonComponent,
  PixelDrawerComponent,
  type PixelDrawerPosition,
} from 'pixel-ui';

@Component({
  selector: 'docs-drawer-positions-example',
  standalone: true,
  imports: [PixelButtonComponent, PixelDrawerComponent],
  template: `
    <div class="row">
      @for (pos of positions; track pos) {
        <pixel-button appearance="tonal" (click)="openPosition(pos)">{{ pos }}</pixel-button>
      }
    </div>

    <pixel-drawer
      [(open)]="open"
      [position]="activePosition()"
      [title]="activePosition() + ' drawer'"
    >
      <p class="body">
        This panel slides in from the <strong>{{ activePosition() }}</strong> edge.
      </p>
      <pixel-button pixelDrawerFooter appearance="text" (click)="open.set(false)">Close</pixel-button>
    </pixel-drawer>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .body {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.55;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerPositionsExample {
  protected readonly positions: readonly PixelDrawerPosition[] = ['start', 'end', 'top', 'bottom'];
  protected readonly open = signal(false);
  protected readonly activePosition = signal<PixelDrawerPosition>('end');

  protected openPosition(position: PixelDrawerPosition): void {
    this.activePosition.set(position);
    this.open.set(true);
  }
}
