import {ChangeDetectionStrategy, Component, EventEmitter, OnInit} from '@angular/core';
import {concat, Observable, of} from 'rxjs';
import {DashboardService} from '@app/services/dashboard.service';
import {ActivatedRoute} from '@angular/router';
import {CommitsGQL, MoreCommitsGQL} from '@app/github.schema';
import {filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';

interface Commit {
  additions: number;
  deletions: number;
  committedOn: Date;
}

@Component({
  selector: 'app-calendar',
  template: `
    <header>
      <h2>Calendar <mat-icon color="warn"
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
      <ng-container *ngIf="data$ | async as data else load">
        <charts4ng-calendar [data]="data"></charts4ng-calendar>
      </ng-container>
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
export class CalendarComponent implements OnInit {

  focused: Observable<boolean>;

  owner: string;
  name: string;

  loading = true;
  stopped = false;
  loadedCount = 0;
  stopLoading: EventEmitter<void> = new EventEmitter();

  commitCount: number;
  commits$: Observable<Commit[]>;

  data$: Observable<{ date: Date, value: number }[]>;

  errors: string[] = [];

  oneYearAgo: Date;

  get progress() {
    return this.commitCount > 0 ? this.loadedCount / this.commitCount * 100 : 100;
  }

  get hasError() {
    return this.errors.length > 0;
  }

  get getErrors() {
    return this.errors.join('\n');
  }

  constructor(
    private dashboard: DashboardService,
    private commitsGQL: CommitsGQL,
    private moreCommitsGQL: MoreCommitsGQL,
    private route: ActivatedRoute
  ) {
    this.focused = this.dashboard.focused$;
  }

  zoomIn() {
    this.dashboard.focus('calendar');
  }

  zoomOut() {
    this.dashboard.blur();
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

  ngOnInit() {
    this.owner = this.route.snapshot.paramMap.get('user');
    this.name = this.route.snapshot.paramMap.get('repo');

    if (this.owner === null || this.name === null) {
      throw Error('owner or name is null!');
    }

    this.oneYearAgo = new Date();
    this.oneYearAgo.setUTCFullYear(this.oneYearAgo.getUTCFullYear() - 1);
    this.oneYearAgo.setUTCHours(0, 0, 0);

    this.init();
  }

  init() {
    this.commits$ = this.loadCommits().pipe(
      takeUntil(this.stopLoading.asObservable())
    );

    this.data$ = this.commits$.pipe(
      map(commits => {

        const commitsMap = new Map();

        commits.forEach(commit => {
          const date = commit.committedOn.toDateString();
          if (commitsMap.get(date) !== undefined) {
            commitsMap.set(date, commitsMap.get(date) + 1);
          } else {
            commitsMap.set(date, 1);
          }
        });

        const now = new Date();
        for (const d = new Date(this.oneYearAgo); d <= now; d.setUTCDate(d.getUTCDate() + 1)) {
          if (commitsMap.get(d.toDateString()) === undefined) {
            commitsMap.set(d.toDateString(), 0);
          }
        }

        return [...commitsMap.entries()].map(a => {
          const date = new Date(a[0]);
          return {
            date,
            value: a[1]
          };
        });

      }),
      // tap(data => console.log(data))
    );
  }

  loadCommits(): Observable<Commit[]> {

    return this.commitsGQL.watch({
      owner: this.owner, name: this.name, since: this.oneYearAgo.toISOString()
    }).valueChanges.pipe(
      tap(result => this.loading = result.loading),
      filter(result => !result.loading),
      map(result => result.data.repository.object.history),
      tap(history => this.commitCount = history.totalCount),
      switchMap(history => {
        const commits = history.nodes.map(node => ({
          additions: node.additions,
          deletions: node.deletions,
          committedOn: new Date(node.committedDate)
        }));

        if (history.pageInfo.hasNextPage) {
          const more = this.loadMoreCommits(history.pageInfo.endCursor).pipe(
            map(newCommits => [...commits, ...newCommits])
          );
          return concat(of(commits), more);
        } else {
          return of(commits);
        }
      }),
      tap(commits => this.loadedCount = commits.length)
    );
  }

  loadMoreCommits(cursor: string): Observable<Commit[]> {
    return this.moreCommitsGQL.watch(
      { owner: this.owner, name: this.name, cursor, since: this.oneYearAgo.toISOString() }
    ).valueChanges.pipe(
      filter(result => !result.loading),
      map(result => result.data.repository.object.history),
      switchMap(history => {
        const commits = history.nodes.map(node => ({
          additions: node.additions,
          deletions: node.deletions,
          committedOn: new Date(node.committedDate)
        }));

        if (history.pageInfo.hasNextPage) {
          const more = this.loadMoreCommits(history.pageInfo.endCursor).pipe(
            map(newCommits => [...commits, ...newCommits])
          );
          return concat(of(commits), more);
        } else {
          return of(commits);
        }
      })
    );
  }

}
