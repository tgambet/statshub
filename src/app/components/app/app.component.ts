import {ChangeDetectionStrategy, Component} from '@angular/core';
import {AuthService} from '@app/services/auth.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-app',
  template: `
    <mat-toolbar>
      <app-logo width="40" height="40"></app-logo>
      <h1>StatsHub</h1>
      <button class="search" mat-icon-button>
        <mat-icon>search</mat-icon>
      </button>
      <button class="user-menu" mat-icon-button [matMenuTriggerFor]="userMenu">
        <mat-icon>person</mat-icon>
      </button>
      <mat-menu #userMenu="matMenu">
        <button mat-menu-item (click)="logout()">LOGOUT</button>
      </mat-menu>
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

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  logout(): void {
    this.auth.logout();
    this.router.navigate(['login']);
  }

}
