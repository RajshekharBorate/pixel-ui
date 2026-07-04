import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelButtonComponent } from 'pixel-ui';

@Component({
  selector: 'docs-button-semantic-states-example',
  imports: [PixelButtonComponent],
  template: `
    <div class="row">
      <pixel-button appearance="solid">Pay $24.00</pixel-button>
      <pixel-button appearance="solid" state="success" leadingIcon="check_circle">
        Payment saved
      </pixel-button>
      <pixel-button appearance="solid" state="error">Card declined — retry</pixel-button>
      <pixel-button appearance="solid" state="loading" loadingLabel="Saving profile">
        Save profile
      </pixel-button>
      <pixel-button appearance="outline" [disabled]="true" ariaLabel="Invite already sent">
        Invite sent
      </pixel-button>
    </div>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonSemanticStatesExample {}
