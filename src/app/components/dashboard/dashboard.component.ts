import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {map, switchMap} from 'rxjs/operators';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {Observable, of} from 'rxjs';
import {DashboardType} from '@app/components/dashboard/dashboard-type.enum';
import {ComponentPortal} from '@angular/cdk/portal';
import {InformationComponent} from '@app/components/dashboard/information/information.component';
import {IssuesComponent} from '@app/components/dashboard/issues/issues.component';
import {LabelsComponent} from '@app/components/dashboard/labels/labels.component';
import {PopularityComponent} from '@app/components/dashboard/popularity/popularity.component';
import {DownloadsComponent} from '@app/components/dashboard/downloads/downloads.component';
import {FilesComponent} from '@app/components/dashboard/files/files.component';
import {CalendarComponent} from '@app/components/dashboard/calendar/calendar.component';
import {DashboardService} from '@app/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  template: `
    <mat-grid-list cols="4" rowHeight="324px">
      <mat-grid-tile *ngFor="let card of cards | async; trackBy: trackBy"
                     [colspan]="card.size.cols"
                     [rowspan]="card.size.rows"
                     [class.last]="isLastFocused(card.meta.class) | async"
                     [class.focused]="isFocused(card.meta.class) | async">
        <mat-card>
          <ng-template [cdkPortalOutlet]="components[card.meta.class]"></ng-template>
        </mat-card>
      </mat-grid-tile>
    </mat-grid-list>
    <div class="backdrop" *ngIf="focused | async" (click)="blur()"></div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 20px;
      position: relative;
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
    .focused {
      position: absolute;
      z-index: 1;
      transform: scale(2) translate(-25%, -25%);
      top: calc(50% - 32px) !important;
      left: 50% !important;
      bottom: unset !important;
      right: unset !important;
    }
    .last {
      z-index: 1;
    }
    .backdrop {
      position: absolute;
      top: 0;
      right: 0;
      left: 0;
      bottom: 0;
      background-color: rgba(0,0,0,0.5);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {

  focused: Observable<boolean>;

  isSmallScreen: boolean;
  isMediumScreen: boolean;

  INFO_CARD =       { class: 'info', type: DashboardType.INFORMATION };
  ISSUES_CARD =     { class: 'issues', type: DashboardType.ISSUES };
  LABELS_CARD =     { class: 'labels', type: DashboardType.LABELS };
  POPULARITY_CARD = { class: 'popularity', type: DashboardType.POPULARITY };
  DOWNLOADS_CARD =  { class: 'downloads', type: DashboardType.DOWNLOADS };
  FILES_CARD =      { class: 'files', type: DashboardType.FILES };
  CALENDAR_CARD =   { class: 'calendar', type: DashboardType.CALENDAR };

  components = {
    info: new ComponentPortal(InformationComponent),
    issues: new ComponentPortal(IssuesComponent),
    labels: new ComponentPortal(LabelsComponent),
    popularity: new ComponentPortal(PopularityComponent),
    downloads: new ComponentPortal(DownloadsComponent),
    files: new ComponentPortal(FilesComponent),
    calendar: new ComponentPortal(CalendarComponent)
  };

  cards = this.breakpointObserver.observe([
    Breakpoints.XSmall,
    Breakpoints.Small
  ]).pipe(
    switchMap(({ matches }) => {
      if (matches) {
        // this.focusedElement = undefined;
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
            // this.focusedElement = undefined;
            this.isMediumScreen = true;
            return [
              { meta: this.INFO_CARD, size: { cols: 2, rows: 2 } },
              { meta: this.POPULARITY_CARD, size: { cols: 2, rows: 1 } },
              { meta: this.DOWNLOADS_CARD, size: { cols: 2, rows: 1 } },
              { meta: this.ISSUES_CARD, size: { cols: 2, rows: 1 } },
              { meta: this.LABELS_CARD, size: { cols: 2, rows: 1 } },
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

  constructor(
    private dashboard: DashboardService,
    private breakpointObserver: BreakpointObserver,
  ) {
    this.focused = this.dashboard.focused$;
  }

  ngOnInit(): void {}

  isFocused(element: string): Observable<boolean> {
    return this.dashboard.isFocused(element);
  }

  isLastFocused(element: string): Observable<boolean> {
    return this.dashboard.focusedElement$.pipe(
      map(elem => elem === element)
    );
  }

  blur(): void {
    this.dashboard.blur();
  }

  trackBy(index: number, item: any) {
    return item.meta.class;
  }
}
