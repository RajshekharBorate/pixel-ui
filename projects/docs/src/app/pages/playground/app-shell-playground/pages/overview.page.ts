import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelAvatarComponent } from 'pixel-ui';

interface ActivityItem {
  readonly initials: string;
  readonly name: string;
  readonly action: string;
  readonly time: string;
}

interface TeamMember {
  readonly initials: string;
  readonly name: string;
  readonly role: string;
}

interface StatCard {
  readonly label: string;
  readonly value: string;
  readonly trend: string;
  readonly up: boolean;
}

@Component({
  selector: 'docs-app-shell-overview-page',
  imports: [PixelAvatarComponent],
  template: `
    <header class="page-head">
      <h1>Overview</h1>
      <p>
        Full-page playground for layout shell + contextual navigation. Open the bell and try a
        deep-link notification (claims row, billing section, amendment wizard, or gated settings).
      </p>
    </header>

    <section class="stats" aria-label="Key metrics">
      @for (stat of stats; track stat.label) {
        <div class="stat-card">
          <span class="stat-card__label">{{ stat.label }}</span>
          <span class="stat-card__value">{{ stat.value }}</span>
          <span class="stat-card__trend" [class.stat-card__trend--down]="!stat.up">
            {{ stat.trend }}
          </span>
        </div>
      }
    </section>

    <section class="panel" aria-labelledby="activity-heading">
      <h2 id="activity-heading">Recent activity</h2>
      <ul class="activity">
        @for (item of activity; track $index) {
          <li class="activity__row">
            <pixel-avatar [initials]="item.initials" size="sm" />
            <span class="activity__text">
              <strong>{{ item.name }}</strong>
              {{ item.action }}
            </span>
            <span class="activity__time">{{ item.time }}</span>
          </li>
        }
      </ul>
    </section>

    <section class="panel" aria-labelledby="team-heading">
      <h2 id="team-heading">Team</h2>
      <div class="team">
        @for (member of team; track member.name) {
          <div class="team-card">
            <pixel-avatar [initials]="member.initials" size="md" />
            <span class="team-card__name">{{ member.name }}</span>
            <span class="team-card__role">{{ member.role }}</span>
          </div>
        }
      </div>
    </section>
  `,
  styleUrl: '../playground-pages.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellOverviewPage {
  protected readonly stats: readonly StatCard[] = [
    { label: 'Revenue', value: '$48,290', trend: '+12.4%', up: true },
    { label: 'Active users', value: '3,182', trend: '+4.1%', up: true },
    { label: 'Open tickets', value: '27', trend: '-8.0%', up: false },
    { label: 'Conversion rate', value: '3.6%', trend: '+0.3pt', up: true },
  ];

  protected readonly activity: readonly ActivityItem[] = [
    { initials: 'AK', name: 'Ava Kim', action: 'closed ticket #4821', time: '2m ago' },
    { initials: 'DM', name: 'Diego Martins', action: 'updated the Q3 report', time: '14m ago' },
    { initials: 'PS', name: 'Priya Shah', action: 'invited a new teammate', time: '32m ago' },
    { initials: 'JL', name: 'Jonas Lindqvist', action: 'approved invoice #1092', time: '48m ago' },
    { initials: 'MR', name: 'Maria Rossi', action: 'commented on Customers', time: '1h ago' },
    { initials: 'TN', name: 'Tariq Noor', action: 'archived 3 tickets', time: '1h ago' },
  ];

  protected readonly team: readonly TeamMember[] = [
    { initials: 'AK', name: 'Ava Kim', role: 'Product Lead' },
    { initials: 'DM', name: 'Diego Martins', role: 'Engineering' },
    { initials: 'PS', name: 'Priya Shah', role: 'Design' },
    { initials: 'JL', name: 'Jonas Lindqvist', role: 'Finance' },
    { initials: 'MR', name: 'Maria Rossi', role: 'Support' },
    { initials: 'TN', name: 'Tariq Noor', role: 'Engineering' },
  ];
}
