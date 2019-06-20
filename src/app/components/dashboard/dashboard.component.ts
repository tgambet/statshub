import {ChangeDetectionStrategy, Component} from '@angular/core';
import {map, switchMap} from 'rxjs/operators';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {of} from 'rxjs';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="grid-container">
      <mat-grid-list cols="4" rowHeight="324px">
        <mat-grid-tile *ngFor="let card of cards | async" [colspan]="card.cols" [rowspan]="card.rows">
          <mat-card class="dashboard-card">
            <mat-card-header>
              <mat-card-title>
                {{card.title}}
                <button mat-icon-button class="more-button" [matMenuTriggerFor]="menu" aria-label="Toggle menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu" xPosition="before">
                  <button mat-menu-item>Expand</button>
                  <button mat-menu-item>Remove</button>
                </mat-menu>
              </mat-card-title>
            </mat-card-header>
            <mat-card-content class="dashboard-card-content">
            </mat-card-content>
          </mat-card>
        </mat-grid-tile>
      </mat-grid-list>
    </div>
  `,
  styles: [`
    .grid-container {
      margin: 20px;
    }
    .dashboard-card {
      position: absolute;
      top: 15px;
      left: 15px;
      right: 15px;
      bottom: 15px;
    }
    .more-button {
      position: absolute;
      top: 10px;
      right: 10px;
    }
    .dashboard-card-content {
      text-align: center;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  cards = this.breakpointObserver.observe([
    Breakpoints.XSmall,
    Breakpoints.Small
  ]).pipe(
    switchMap(({ matches }) => {
      if (matches) {
        return of([
          { title: 'Information', cols: 4, rows: 1 },
          { title: 'Issues', cols: 4, rows: 1 },
          { title: 'Labels', cols: 4, rows: 1 },
          { title: 'Popularity', cols: 4, rows: 1 },
          { title: 'Downloads', cols: 4, rows: 1 },
          { title: 'File explorer', cols: 4, rows: 2 },
          { title: 'Calendar', cols: 4, rows: 1 },
        ]);
      }
      return this.breakpointObserver.observe([
        Breakpoints.Medium,
      ]).pipe(
        map(bp => {
          if (bp.matches) {
            return [
              { title: 'Information', cols: 4, rows: 1 },
              { title: 'Issues', cols: 2, rows: 1 },
              { title: 'Labels', cols: 2, rows: 1 },
              { title: 'Popularity', cols: 2, rows: 1 },
              { title: 'Downloads', cols: 2, rows: 1 },
              { title: 'File explorer', cols: 4, rows: 2 },
              { title: 'Calendar', cols: 4, rows: 1 },
            ];
          }
          return [
            { title: 'Information', cols: 2, rows: 1 },
            { title: 'Issues', cols: 1, rows: 1 },
            { title: 'Labels', cols: 1, rows: 1 },
            { title: 'Popularity', cols: 1, rows: 1 },
            { title: 'Downloads', cols: 1, rows: 1 },
            { title: 'File explorer', cols: 2, rows: 2 },
            { title: 'Calendar', cols: 2, rows: 1 },
          ];
        })
      );

    })
  );

  constructor(private breakpointObserver: BreakpointObserver) {}
}
