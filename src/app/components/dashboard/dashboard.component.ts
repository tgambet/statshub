import {ChangeDetectionStrategy, Component} from '@angular/core';
import {map, switchMap} from 'rxjs/operators';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {of} from 'rxjs';
import {DashboardType} from '@app/components/dashboard/dashboard-type.enum';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="grid-container">
      <mat-grid-list cols="4" rowHeight="324px">
        <mat-grid-tile *ngFor="let card of cards | async" [colspan]="card.size.cols" [rowspan]="card.size.rows">
          <mat-card class="dashboard-card">
            <mat-card-header>
              <mat-card-title>
                {{card.meta.title}}
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
              <app-parent [type]="card.meta.type"></app-parent>
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

  INFO_CARD =       { title: 'Information', type: DashboardType.INFORMATION };
  ISSUES_CARD =     { title: 'Issues', type: DashboardType.ISSUES };
  LABELS_CARD =     { title: 'Labels', type: DashboardType.LABELS };
  POPULARITY_CARD = { title: 'Popularity', type: DashboardType.POPULARITY };
  DOWNLOADS_CARD =  { title: 'Downloads', type: DashboardType.DOWNLOADS };
  FILES_CARD =      { title: 'File explorer', type: DashboardType.FILES };
  CALENDAR_CARD =   { title: 'Calendar', type: DashboardType.CALENDAR };

  cards = this.breakpointObserver.observe([
    Breakpoints.XSmall,
    Breakpoints.Small
  ]).pipe(
    switchMap(({ matches }) => {
      if (matches) {
        return of([
          { meta: this.INFO_CARD, size: { cols: 4, rows: 1 } },
          { meta: this.ISSUES_CARD, size: { cols: 4, rows: 1 } },
          { meta: this.LABELS_CARD, size: { cols: 4, rows: 1 } },
          { meta: this.POPULARITY_CARD, size: { cols: 4, rows: 1 } },
          { meta: this.DOWNLOADS_CARD, size: { cols: 4, rows: 1 } },
          { meta: this.FILES_CARD, size: { cols: 4, rows: 2 } },
          { meta: this.CALENDAR_CARD, size: { cols: 4, rows: 1 } },
        ]);
      }
      return this.breakpointObserver.observe([
        Breakpoints.Medium,
      ]).pipe(
        map(bp => {
          if (bp.matches) {
            return [
              { meta: this.INFO_CARD, size: { cols: 4, rows: 1 } },
              { meta: this.ISSUES_CARD, size: { cols: 2, rows: 1 } },
              { meta: this.LABELS_CARD, size: { cols: 2, rows: 1 } },
              { meta: this.POPULARITY_CARD, size: { cols: 2, rows: 1 } },
              { meta: this.DOWNLOADS_CARD, size: { cols: 2, rows: 1 } },
              { meta: this.FILES_CARD, size: { cols: 4, rows: 2 } },
              { meta: this.CALENDAR_CARD, size: { cols: 4, rows: 1 } },
            ];
          }
          return [
            { meta: this.INFO_CARD, size: { cols: 2, rows: 1 } },
            { meta: this.ISSUES_CARD, size: { cols: 1, rows: 1 } },
            { meta: this.LABELS_CARD, size: { cols: 1, rows: 1 } },
            { meta: this.POPULARITY_CARD, size: { cols: 1, rows: 1 } },
            { meta: this.DOWNLOADS_CARD, size: { cols: 1, rows: 1 } },
            { meta: this.FILES_CARD, size: { cols: 2, rows: 2 } },
            { meta: this.CALENDAR_CARD, size: { cols: 2, rows: 1 } },
          ];
        })
      );

    })
  );

  constructor(private breakpointObserver: BreakpointObserver) {}
}
