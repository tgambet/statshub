import {ChangeDetectionStrategy, Component} from '@angular/core';
import {map, switchMap} from 'rxjs/operators';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {of} from 'rxjs';
import {DashboardType} from '@app/components/dashboard/dashboard-type.enum';

@Component({
  selector: 'app-dashboard',
  template: `
    <mat-grid-list cols="4" rowHeight="324px">
      <mat-grid-tile *ngFor="let card of cards | async"
                     [colspan]="card.size.cols"
                     [rowspan]="card.size.rows"
                     [class.focused]="isFocused && focusedElement === card.meta.class"
                     [class.last]="focusedElement === card.meta.class">
        <mat-card class="mat-card {{ card.meta.class }}" >
          <mat-card-header>
            <mat-card-title>
              {{card.meta.title}}
              <button mat-icon-button class="more-button" [matMenuTriggerFor]="menu" aria-label="Toggle menu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu" xPosition="before">
                <button mat-menu-item (click)="focusedElement = card.meta.class; isFocused = true">Expand</button>
              </mat-menu>
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <app-parent [type]="card.meta.type"></app-parent>
          </mat-card-content>
        </mat-card>
      </mat-grid-tile>
    </mat-grid-list>
    <div class="backdrop" *ngIf="isFocused" (click)="isFocused = false"></div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 20px;
      position: relative;
    }
    .backdrop {
      position: absolute;
      top: 0;
      right: 0;
      left: 0;
      bottom: 0;
      background-color: rgba(0,0,0,0.5);
    }
    mat-grid-tile {
      transition-property: transform, top, right, bottom, left;
      transition-duration: 300ms;
      transition-timing-function: ease;
    }
    mat-card {
      display: flex;
      flex-direction: column;
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
    mat-card-content {
      flex-grow: 1;
    }
    .focused {
      z-index: 1;
      transform: scale(2) translate(-25%, -25%);
      top: 50% !important;
      left: 50% !important;
      bottom: unset !important;
      right: unset !important;
    }
    .last {
      z-index: 1;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {

  isFocused = false;
  focusedElement: string;
  isSmallScreen: boolean;
  isMediumScreen: boolean;

  INFO_CARD =       { class: 'info', title: 'Information', type: DashboardType.INFORMATION };
  ISSUES_CARD =     { class: 'issues', title: 'Issues', type: DashboardType.ISSUES };
  LABELS_CARD =     { class: 'labels', title: 'Labels', type: DashboardType.LABELS };
  POPULARITY_CARD = { class: 'popularity', title: 'Popularity', type: DashboardType.POPULARITY };
  DOWNLOADS_CARD =  { class: 'downloads', title: 'Downloads', type: DashboardType.DOWNLOADS };
  FILES_CARD =      { class: 'files', title: 'File explorer', type: DashboardType.FILES };
  CALENDAR_CARD =   { class: 'calendar', title: 'Calendar', type: DashboardType.CALENDAR };

  cards = this.breakpointObserver.observe([
    Breakpoints.XSmall,
    Breakpoints.Small
  ]).pipe(
    switchMap(({ matches }) => {
      if (matches) {
        this.focusedElement = undefined;
        this.isSmallScreen = true;
        return of([
          { meta: this.INFO_CARD, size: { cols: 4, rows: 2 } },
          { meta: this.POPULARITY_CARD, size: { cols: 4, rows: 1 } },
          { meta: this.ISSUES_CARD, size: { cols: 4, rows: 1 } },
          { meta: this.LABELS_CARD, size: { cols: 4, rows: 1 } },
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
            this.focusedElement = undefined;
            this.isMediumScreen = true;
            return [
              { meta: this.INFO_CARD, size: { cols: 2, rows: 2 } },
              { meta: this.POPULARITY_CARD, size: { cols: 2, rows: 1 } },
              { meta: this.ISSUES_CARD, size: { cols: 2, rows: 1 } },
              { meta: this.LABELS_CARD, size: { cols: 2, rows: 1 } },
              { meta: this.DOWNLOADS_CARD, size: { cols: 2, rows: 1 } },
              { meta: this.FILES_CARD, size: { cols: 4, rows: 2 } },
              { meta: this.CALENDAR_CARD, size: { cols: 4, rows: 1 } },
            ];
          }
          return [
            { meta: this.INFO_CARD, size: { cols: 1, rows: 2 } },
            { meta: this.POPULARITY_CARD, size: { cols: 1, rows: 1 } },
            { meta: this.ISSUES_CARD, size: { cols: 1, rows: 1 } },
            { meta: this.LABELS_CARD, size: { cols: 1, rows: 1 } },
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
