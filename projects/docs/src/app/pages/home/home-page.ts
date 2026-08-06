import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PixelButtonComponent, PixelContainerComponent } from 'pixel-ui';
import { DocNavigationService } from '../../core/doc-navigation.service';

@Component({
  selector: 'docs-home-page',
  imports: [RouterLink, PixelButtonComponent, PixelContainerComponent],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  protected readonly nav = inject(DocNavigationService);
}
