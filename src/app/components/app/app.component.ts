import {ChangeDetectionStrategy, Component} from '@angular/core';

@Component({
  selector: 'app-app',
  template: `
    <mat-toolbar>
      <app-logo width="40" height="40"></app-logo>
      <h1>StatsHub</h1>
      <button class="search" mat-icon-button>
        <mat-icon>search</mat-icon>
      </button>
      <button class="user-menu" mat-icon-button>
        <mat-icon>person</mat-icon>
      </button>
    </mat-toolbar>
    <router-outlet></router-outlet>
  `,
  styles: [`
    mat-toolbar {
      position: sticky;
      top: 0;
      z-index: 1;
    }
    app-logo {
      margin: 0 1rem 0 0;
      height: 40px;
    }
    h1 {
      font-size: 26px;
    }
    .search {
      margin-left: auto;
      margin-right: 1rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {

  constructor() {}

}
