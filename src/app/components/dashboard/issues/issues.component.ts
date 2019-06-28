import {ChangeDetectionStrategy, Component, EventEmitter, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {IssuesGQL, MoreIssuesGQL} from '@app/github.schema';
import {concat, EMPTY, Observable, of} from 'rxjs';
import {catchError, filter, map, mergeMap, takeUntil, tap} from 'rxjs/operators';
import {ApolloError} from 'apollo-client';
import {DashboardService} from '@app/services/dashboard.service';

interface Issue {
  closed: boolean;
  createdAt: Date;
  closedAt?: Date;
}

@Component({
  selector: 'app-issues',
  template: `
    <header>
      <h2>Issues <mat-icon color="warn"
                           *ngIf="hasError"
                           [matTooltip]="getErrors"
                           aria-label="Errors">warning</mat-icon>
      </h2>
      <button mat-icon-button class="more-button"
              [matMenuTriggerFor]="menu" aria-label="Toggle menu"
              [matBadge]="hasError && progress < 100 && stopped ? '1' : ''" matBadgeSize="small" matBadgeColor="primary">
        <mat-icon>more_vert</mat-icon>
      </button>
      <mat-menu #menu="matMenu" xPosition="before">
        <button mat-menu-item (click)="zoomIn()" *ngIf="(focused | async) === false">
          <mat-icon>zoom_in</mat-icon>
          Zoom in
        </button>
        <button mat-menu-item (click)="zoomOut()" *ngIf="focused | async">
          <mat-icon>zoom_out</mat-icon>
          Zoom out
        </button>
        <button mat-menu-item *ngIf="progress < 100 && !stopped" (click)="stop()">
          <mat-icon>stop</mat-icon>
          Stop
        </button>
        <button mat-menu-item *ngIf="progress < 100 && stopped" (click)="resume()">
          <mat-icon color="primary">play_arrow</mat-icon>
          Resume
        </button>
      </mat-menu>
    </header>
    <section>
      <charts4ng-line *ngIf="data$ | async as data else load"
                      [data]="data" [legends]="legends" [areaChart]="true"></charts4ng-line>
      <ng-template #load>
        <mat-spinner diameter="40"></mat-spinner>
      </ng-template>
    </section>
    <footer>
      <mat-progress-bar *ngIf="progress < 100" [mode]="loading ? 'query' : 'determinate'" [value]="progress"></mat-progress-bar>
    </footer>
  `,
  styleUrls: ['../card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IssuesComponent implements OnInit {

  focused: Observable<boolean>;

  owner: string;
  name: string;

  loading = true;
  stopped = false;
  loadedCount = 0;
  stopLoading: EventEmitter<void> = new EventEmitter();

  issueCount: number;
  issues$: Observable<Issue[]>;

  data$: Observable<{ date: Date; value: number; }[][]>;
  legends = [
    { name: 'Open issues', color: '#ff5252' },
    { name: 'Closed issues', color: '#8bc34a' }
  ];

  errors: string[] = [];

  get progress() {
    return this.issueCount > 0 ? this.loadedCount / this.issueCount * 100 : 100;
  }

  get hasError() {
    return this.errors.length > 0;
  }

  get getErrors() {
    return this.errors.join('\n');
  }

  constructor(
    private dashboard: DashboardService,
    private issuesGQL: IssuesGQL,
    private moreIssuesGQL: MoreIssuesGQL,
    private route: ActivatedRoute
  ) {
    this.focused = this.dashboard.focused$;
  }

  zoomIn() {
    this.dashboard.focus('issues');
  }

  zoomOut() {
    this.dashboard.blur();
  }

  ngOnInit() {
    this.owner = this.route.snapshot.paramMap.get('user');
    this.name = this.route.snapshot.paramMap.get('repo');

    if (this.owner === null || this.name === null) {
      throw Error('owner or name is null!');
    }

    this.init();
  }

  init() {
    this.issues$ = this.loadIssues().pipe(takeUntil(this.stopLoading.asObservable()));

    this.data$ = this.issues$.pipe(
      map(issues => {
        const allIssues = issues.map(issue => ({
          date: issue.createdAt,
          value: issues.indexOf(issue) + 1
        }));
        const closedIssues = issues.filter(issue => issue.closed);
        let closed = closedIssues.map(issue => ({
          date: issue.createdAt,
          value: closedIssues.indexOf(issue) + 1
        }));
        if (allIssues.length > 0 && closed.length > 0) {
          const lastClosed = {
            date: allIssues[allIssues.length - 1].date,
            value: closed[closed.length - 1].value
          };
          closed = [...closed, lastClosed];
        }
        return [allIssues, closed];
      })
    );
  }

  resume(): void {
    this.stopped = false;
    this.errors = [];
    this.init();
  }

  stop(): void {
    this.stopped = true;
    this.stopLoading.emit();
  }

  loadIssues(): Observable<Issue[]> {
    return this.issuesGQL.watch(
      { owner: this.owner, name: this.name }
    ).valueChanges.pipe(
      tap(result => this.loading = result.loading),
      tap(result => {
        if (result.errors) {
          this.errors = result.errors.map(e => e.message);
          this.stopLoading.emit();
          this.stopped = true;
        }
      }),
      filter(result => !result.loading),
      map(result => result.data.repository.issues),
      tap(issues => this.issueCount = issues.totalCount),
      mergeMap(issues => {
        const issuesMap = issues.nodes.map(issue => ({
          closed: issue.closed,
          createdAt: new Date(issue.createdAt),
          closedAt: issue.closedAt ? new Date(issue.closedAt) : undefined
        }));

        if (issues.pageInfo.hasNextPage) {
          const more = this.loadMoreIssues(issues.pageInfo.endCursor).pipe(
            map(newIssues => [...issuesMap, ...newIssues])
          );
          return concat(of(issuesMap), more);
        } else {
          return of(issuesMap);
        }
      }),
      tap(issues => this.loadedCount = issues.length),
      catchError((error: ApolloError) => {
        console.error('ApolloError', error);
        return EMPTY;
      })
    );
  }

  loadMoreIssues(cursor: string): Observable<Issue[]> {
    return this.moreIssuesGQL.watch(
      { owner: this.owner, name: this.name, cursor }
    ).valueChanges.pipe(
      tap(result => {
        if (result.errors) {
          this.errors = result.errors.map(e => e.message);
          this.stopLoading.emit();
          this.stopped = true;
        }
      }),
      filter(result => !result.loading),
      map(result => result.data.repository.issues),
      mergeMap(issues => {
        const issuesMap = issues.nodes.map(issue => ({
          closed: issue.closed,
          createdAt: new Date(issue.createdAt),
          closedAt: issue.closedAt ? new Date(issue.closedAt) : undefined
        }));

        if (issues.pageInfo.hasNextPage) {
          const more = this.loadMoreIssues(issues.pageInfo.endCursor).pipe(
            map(newIssues => [...issuesMap, ...newIssues])
          );
          return concat(of(issuesMap), more);
        } else {
          return of(issuesMap);
        }
      }),
      catchError((error: ApolloError) => {
        console.error('ApolloError', error);
        return EMPTY;
      })
    );
  }

}
