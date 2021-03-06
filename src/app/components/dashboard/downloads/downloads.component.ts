import {ChangeDetectionStrategy, Component, EventEmitter, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {concat, EMPTY, Observable, of} from 'rxjs';
import {catchError, filter, map, mergeMap, takeUntil, tap} from 'rxjs/operators';

import {MoreReleasesGQL, ReleasesGQL} from '@app/github.schema';
import {ApolloError} from 'apollo-client';
import {DashboardService} from '@app/services/dashboard.service';

interface Release {
  name: string;
  tagName: string;
  publishedAt: Date;
  downloadCount: number;
}

@Component({
  selector: 'app-downloads',
  template: `
    <header>
      <h2>Downloads <mat-icon color="warn"
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
        <button mat-menu-item *ngIf="progress < 100 && !stopped" (click)="stopLoading.emit(); stopped = true">
          <mat-icon>stop</mat-icon>
          Stop
        </button>
        <button mat-menu-item *ngIf="progress < 100 && stopped" (click)="init(); stopped = false">
          <mat-icon color="primary">play_arrow</mat-icon>
          Resume
        </button>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="sortByDate()" *ngIf="!sortedByDate">
          Sort by publish date
        </button>
        <button mat-menu-item (click)="sortByCount()" *ngIf="sortedByDate">
          Sort by downloads
        </button>
      </mat-menu>
    </header>
    <section>
      <charts4ng-pie *ngIf="data$ | async as data else load"
                     [data]="data"
                     [selector]="selector"
                     [labelSelector]="labelSelector"
                     [sort]="sort">
      </charts4ng-pie>
      <ng-template #load>
        <mat-spinner diameter="40"></mat-spinner>
      </ng-template>
    </section>
    <footer>
      <mat-progress-bar *ngIf="progress < 100" [mode]="loading ? 'query' : 'determinate'" [value]="progress"></mat-progress-bar>
    </footer>
  `,
  styleUrls: ['../card.component.scss'],
  styles: [``],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DownloadsComponent implements OnInit {

  focused: Observable<boolean>;

  owner: string;
  name: string;

  loading = true;
  stopped = false;
  loadedCount = 0;
  stopLoading: EventEmitter<void> = new EventEmitter();

  downloadCount = 0;
  releaseCount: number;
  releases$: Observable<Release[]>;
  data$: Observable<Release[]>;

  errors: string[] = [];

  sortedByDate = false;
  sort = (a, b) => b.downloadCount - a.downloadCount;

  selector = d => d.downloadCount;
  labelSelector = d => d.tagName;

  get progress() {
    return this.releaseCount > 0 ? this.loadedCount / this.releaseCount * 100 : 100;
  }

  get hasError() {
    return this.errors.length > 0;
  }

  get getErrors() {
    return this.errors.join('\n');
  }

  constructor(
    private dashboard: DashboardService,
    private releasesGQL: ReleasesGQL,
    private moreReleasesGQL: MoreReleasesGQL,
    private route: ActivatedRoute
  ) {
    this.focused = this.dashboard.focused$;
  }

  zoomIn() {
    this.dashboard.focus('downloads');
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
    this.releases$ = this.loadReleases().pipe(takeUntil(this.stopLoading.asObservable()));

    const maxReleases = 30;

    this.data$ = this.releases$.pipe(
      tap(releases => this.downloadCount += releases.reduce((a, b) => a + b.downloadCount, 0)),
      map(releases => {
        this.loadedCount = releases.length;

        releases.sort((a, b) => {
          if (b.downloadCount - a.downloadCount === 0) {
            return b.tagName.localeCompare(a.tagName);
          } else {
            return b.downloadCount - a.downloadCount;
          }
        });
        if (releases.length >= maxReleases) {
          const othersCount = releases.slice(maxReleases).reduce((a, b) => a + b.downloadCount, 0);
          const othersDate = releases.slice(maxReleases)
            .map(r => r.publishedAt.toISOString())
            .sort((a, b) => a.localeCompare(b))[0];

          return [...releases.slice(0, maxReleases), {
            name: 'Others',
            tagName: 'others',
            publishedAt: new Date(othersDate),
            downloadCount: othersCount
          }];
        } else {
          return releases;
        }
      })
    );
  }

  loadReleases(): Observable<Release[]> {
    return this.releasesGQL.watch({ owner: this.owner, name: this.name }).valueChanges.pipe(
      tap(result => this.loading = result.loading),
      tap(result => {
        if (result.errors) {
          this.errors = result.errors.map(e => e.message);
          this.stopLoading.emit();
          this.stopped = true;
        }
      }),
      filter(result => !result.loading),
      map(result => result.data.repository.releases),
      mergeMap(releases => {
        this.releaseCount = releases.totalCount;

        const releasesMap = releases.nodes.map(release => ({
          name: release.name,
          tagName: release.tagName,
          publishedAt: new Date(release.publishedAt),
          downloadCount: release.releaseAssets.nodes.reduce((p, c) => p + c.downloadCount, 0)
        }));

        if (releases.pageInfo.hasNextPage) {
          const more = this.loadMoreReleases(releases.pageInfo.endCursor).pipe(
            map(newReleases => [...releasesMap, ...newReleases])
          );
          return concat(of(releasesMap), more);
        } else {
          return of(releasesMap);
        }
      }),
      catchError((error: ApolloError) => {
        console.error('ApolloError', error);
        return EMPTY;
      })
    );
  }

  loadMoreReleases(cursor: string): Observable<Release[]> {
    return this.moreReleasesGQL.watch({ owner: this.owner, name: this.name, cursor }).valueChanges.pipe(
      tap(result => {
        if (result.errors) {
          this.errors = result.errors.map(e => e.message);
          this.stopLoading.emit();
          this.stopped = true;
        }
      }),
      filter(result => !result.loading),
      map(result => result.data.repository.releases),
      mergeMap(releases => {

        const releasesMap = releases.nodes.map(release => ({
          name: release.name,
          tagName: release.tagName,
          publishedAt: new Date(release.publishedAt),
          downloadCount: release.releaseAssets.nodes.reduce((p, c) => p + c.downloadCount, 0)
        }));

        if (releases.pageInfo.hasNextPage) {
          const more = this.loadMoreReleases(releases.pageInfo.endCursor).pipe(
            map(newReleases => [...releasesMap, ...newReleases])
          );
          return concat(of(releasesMap), more);
        } else {
          return of(releasesMap);
        }
      }),
      catchError((error: ApolloError) => {
        console.error('ApolloError', error);
        return EMPTY;
      })
    );
  }

  sortByDate(): void {
    this.sort = (a, b) => b.publishedAt.toISOString().localeCompare(a.publishedAt.toISOString());
    this.sortedByDate = true;
  }

  sortByCount(): void {
    this.sort = (a, b) => b.downloadCount - a.downloadCount;
    this.sortedByDate = false;
  }

}
