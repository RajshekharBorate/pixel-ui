import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PixelChipComponent, type PixelChipItem } from 'pixel-ui';

@Component({
  selector: 'docs-chip-draggable-example',
  imports: [PixelChipComponent],
  templateUrl: './chip-draggable.example.html',
  styleUrl: './chip-draggable.example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipDraggableExample {
  protected readonly active = signal<readonly PixelChipItem[]>([
    { label: 'Design spec', value: 'design-spec', type: 'input', draggable: true, prefixIcon: 'description' },
    { label: 'API contract', value: 'api-contract', type: 'input', draggable: true, prefixIcon: 'api' },
  ]);

  protected readonly archive = signal<readonly PixelChipItem[]>([]);

  protected readonly summary = computed(() => ({
    active: this.active().map((chip) => chip.label).join(', ') || '—',
    archive: this.archive().map((chip) => chip.label).join(', ') || '—',
  }));

  protected onDropZoneDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  protected onDropToZone(zone: 'active' | 'archive', event: DragEvent): void {
    event.preventDefault();
    const value = event.dataTransfer?.getData('text/plain')?.trim();
    if (!value) {
      return;
    }

    const active = [...this.active()];
    const archive = [...this.archive()];
    let chip: PixelChipItem | undefined;
    const fromActive = active.findIndex((item) => (item.value ?? item.label) === value);
    const fromArchive = archive.findIndex((item) => (item.value ?? item.label) === value);

    if (fromActive >= 0) {
      chip = active.splice(fromActive, 1)[0];
    } else if (fromArchive >= 0) {
      chip = archive.splice(fromArchive, 1)[0];
    }

    if (!chip) {
      return;
    }

    if (zone === 'active') {
      active.push(chip);
    } else {
      archive.push(chip);
    }

    this.active.set(active);
    this.archive.set(archive);
  }
}
