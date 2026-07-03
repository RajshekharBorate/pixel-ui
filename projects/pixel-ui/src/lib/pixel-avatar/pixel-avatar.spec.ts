import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import PixelAvatarComponent, {
  type PixelAvatarClickEvent,
  type PixelAvatarData,
  type PixelAvatarShape,
  type PixelAvatarSize,
  type PixelAvatarStatus,
  type PixelAvatarVariant,
} from './pixel-avatar';
import PixelAvatarGroupComponent, {
  type PixelAvatarGroupClickEvent,
} from './pixel-avatar-group';

@Component({
  standalone: true,
  imports: [PixelAvatarComponent],
  template: `
    <section [attr.data-theme]="theme()">
      <pixel-avatar
        [name]="name()"
        [imageUrl]="imageUrl()"
        [initials]="initials()"
        [icon]="icon()"
        [status]="status()"
        [badgeCount]="badgeCount()"
        [size]="size()"
        [shape]="shape()"
        [variant]="variant()"
        [clickable]="clickable()"
        [disabled]="disabled()"
        [loading]="loading()"
        (avatarClick)="lastClick.set($event)"
        (imageLoad)="loaded.set(true)"
        (imageError)="errored.set(true)"
      />
    </section>
  `,
})
class HostComponent {
  readonly theme = signal<'light' | 'dark'>('light');
  readonly name = signal('Raj Borate');
  readonly imageUrl = signal('');
  readonly initials = signal('');
  readonly icon = signal('');
  readonly status = signal<PixelAvatarStatus>('none');
  readonly badgeCount = signal<number | null>(null);
  readonly size = signal<PixelAvatarSize>('md');
  readonly shape = signal<PixelAvatarShape>('circle');
  readonly variant = signal<PixelAvatarVariant>('soft');
  readonly clickable = signal(false);
  readonly disabled = signal(false);
  readonly loading = signal(false);

  readonly lastClick = signal<PixelAvatarClickEvent | null>(null);
  readonly loaded = signal(false);
  readonly errored = signal(false);
}

@Component({
  standalone: true,
  imports: [PixelAvatarGroupComponent],
  template: `
    <pixel-avatar-group
      [avatars]="avatars()"
      [max]="max()"
      [clickable]="true"
      ariaLabel="Project team"
      (avatarClick)="lastClick.set($event)"
      (groupExpand)="expanded.set(true)"
    />
  `,
})
class GroupHostComponent {
  readonly avatars = signal<readonly PixelAvatarData[]>([
    { name: 'Ada Lovelace', status: 'online' },
    { name: 'Grace Hopper', status: 'busy' },
    { name: 'Alan Turing' },
    { name: 'Katherine Johnson' },
    { name: 'Linus Torvalds' },
    { name: 'Margaret Hamilton' },
  ]);
  readonly max = signal(4);
  readonly lastClick = signal<PixelAvatarGroupClickEvent | null>(null);
  readonly expanded = signal(false);
}

describe('PixelAvatarComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const frame = () => fixture.nativeElement.querySelector('.pixel-avatar__frame') as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders with role img and an accessible label', () => {
    expect(frame().getAttribute('role')).toBe('img');
    expect(frame().getAttribute('aria-label')).toBe('Raj Borate');
  });

  it('derives initials from the name (first + last)', () => {
    const initials = fixture.nativeElement.querySelector('.pixel-avatar__initials') as HTMLElement;
    expect(initials.textContent?.trim()).toBe('RB');
  });

  it('prefers explicit initials over the derived ones', () => {
    host.initials.set('xy');
    fixture.detectChanges();
    const initials = fixture.nativeElement.querySelector('.pixel-avatar__initials') as HTMLElement;
    expect(initials.textContent?.trim()).toBe('XY');
  });

  it('renders an image when imageUrl is set and falls back on error', () => {
    host.imageUrl.set('https://example.test/u.png');
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.pixel-avatar__image') as HTMLImageElement;
    expect(img).toBeTruthy();

    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(host.errored()).toBe(true);
    expect(fixture.nativeElement.querySelector('.pixel-avatar__image')).toBeNull();
    expect(fixture.nativeElement.querySelector('.pixel-avatar__initials')).toBeTruthy();
  });

  it('emits imageLoad on successful load', () => {
    host.imageUrl.set('https://example.test/u.png');
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.pixel-avatar__image') as HTMLImageElement;
    img.dispatchEvent(new Event('load'));
    fixture.detectChanges();
    expect(host.loaded()).toBe(true);
  });

  it('falls back to an icon, then a placeholder', () => {
    host.name.set('');
    host.icon.set('support_agent');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pixel-avatar__icon')?.textContent?.trim()).toBe(
      'support_agent',
    );

    host.icon.set('');
    fixture.detectChanges();
    const placeholder = fixture.nativeElement.querySelector('.pixel-avatar__placeholder') as HTMLElement;
    expect(placeholder).toBeTruthy();
    expect(placeholder.textContent?.trim()).toBe('person');
  });

  it('renders a presence status dot with the right data-status', () => {
    host.status.set('online');
    fixture.detectChanges();
    const dot = fixture.nativeElement.querySelector('.pixel-avatar__status') as HTMLElement;
    expect(dot).toBeTruthy();
    expect(dot.getAttribute('data-status')).toBe('online');
    expect(frame().getAttribute('aria-label')).toContain('online');
  });

  it('renders a notification badge with overflow', () => {
    host.badgeCount.set(120);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.pixel-avatar__badge') as HTMLElement;
    expect(badge).toBeTruthy();
    expect(badge.textContent?.trim()).toBe('99+');
  });

  it('renders a button and emits click + keyboard when clickable', () => {
    host.clickable.set(true);
    fixture.detectChanges();
    const button = frame() as HTMLButtonElement;
    expect(button.tagName.toLowerCase()).toBe('button');

    button.click();
    fixture.detectChanges();
    expect(host.lastClick()?.source).toBe('mouse');

    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(host.lastClick()?.source).toBe('keyboard');
  });

  it('does not emit click when disabled', () => {
    host.clickable.set(true);
    host.disabled.set(true);
    fixture.detectChanges();
    // Disabled clickable falls back to a non-button (div) element.
    expect(frame().tagName.toLowerCase()).toBe('div');
    frame().click();
    fixture.detectChanges();
    expect(host.lastClick()).toBeNull();
  });

  it('shows a loading skeleton', () => {
    host.loading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pixel-avatar__skeleton')).toBeTruthy();
  });

  it('reflects size / shape / variant via host data attributes', () => {
    host.size.set('lg');
    host.shape.set('rounded');
    host.variant.set('solid');
    fixture.detectChanges();
    const hostEl = fixture.nativeElement.querySelector('pixel-avatar') as HTMLElement;
    expect(hostEl.getAttribute('data-size')).toBe('lg');
    expect(hostEl.getAttribute('data-shape')).toBe('rounded');
    expect(hostEl.getAttribute('data-variant')).toBe('solid');
  });

  it('applies a deterministic accent color style', () => {
    const hostEl = fixture.nativeElement.querySelector('pixel-avatar') as HTMLElement;
    expect(hostEl.style.getPropertyValue('--pixel-avatar-accent')).toContain('hsl(');
  });

  it('switches theme context without errors', () => {
    host.theme.set('dark');
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(section.getAttribute('data-theme')).toBe('dark');
    expect(frame()).toBeTruthy();
  });
});

describe('PixelAvatarGroupComponent', () => {
  let fixture: ComponentFixture<GroupHostComponent>;
  let host: GroupHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [GroupHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(GroupHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders up to max avatars plus an overflow indicator', () => {
    const items = fixture.nativeElement.querySelectorAll('pixel-avatar.pixel-avatar-group__item');
    const overflow = fixture.nativeElement.querySelector('.pixel-avatar-group__overflow') as HTMLElement;
    expect(items.length).toBe(4);
    expect(overflow.textContent?.trim()).toBe('+2');
  });

  it('exposes the group role and aria-label', () => {
    const group = fixture.nativeElement.querySelector('pixel-avatar-group') as HTMLElement;
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe('Project team');
  });

  it('emits avatarClick with the source data and index', () => {
    const firstFrame = fixture.nativeElement.querySelector(
      'pixel-avatar .pixel-avatar__frame',
    ) as HTMLButtonElement;
    firstFrame.click();
    fixture.detectChanges();
    expect(host.lastClick()?.index).toBe(0);
    expect(host.lastClick()?.avatar.name).toBe('Ada Lovelace');
  });

  it('emits groupExpand when the overflow indicator is activated', () => {
    const overflow = fixture.nativeElement.querySelector(
      '.pixel-avatar-group__overflow',
    ) as HTMLButtonElement;
    overflow.click();
    fixture.detectChanges();
    expect(host.expanded()).toBe(true);
  });

  it('updates when the avatar set changes', () => {
    host.max.set(6);
    fixture.detectChanges();
    const overflow = fixture.nativeElement.querySelector('.pixel-avatar-group__overflow');
    expect(overflow).toBeNull();
  });
});
