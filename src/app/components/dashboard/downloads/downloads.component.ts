import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {concat, Observable, of} from 'rxjs';
import {filter, map, mergeMap, tap} from 'rxjs/operators';

import {MoreReleasesGQL, ReleasesGQL} from '@app/github.schema';

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
      <h2>Downloads</h2>
      <button mat-icon-button class="more-button" [matMenuTriggerFor]="menu" aria-label="Toggle menu">
        <mat-icon>more_vert</mat-icon>
      </button>
      <mat-menu #menu="matMenu" xPosition="before">
        <button mat-menu-item (click)="zoomIn.emit(); zoomed = true" *ngIf="!zoomed">
          <mat-icon>zoom_in</mat-icon>
          Zoom in
        </button>
        <button mat-menu-item (click)="zoomOut.emit(); zoomed = false" *ngIf="zoomed">
          <mat-icon>zoom_out</mat-icon>
          Zoom out
        </button>
        <mat-divider></mat-divider>
<!--        <button mat-menu-item *ngIf="progress < 100 && !stopped" (click)="stopLoading.emit(); stopped = true">
          <mat-icon>stop</mat-icon>
          Stop
        </button>
        <button mat-menu-item *ngIf="progress < 100 && stopped" (click)="init(true); stopped = false">
          <mat-icon>play_arrow</mat-icon>
          Resume
        </button>-->
        <button mat-menu-item (click)="sortByDate()" *ngIf="!sortedByDate">
          Sort by publish date
        </button>
        <button mat-menu-item (click)="sortByCount()" *ngIf="sortedByDate">
          Sort by downloads
        </button>
      </mat-menu>
    </header>
    <section>
      <charts4ng-pie *ngIf="data$ | async as data"
                     [data]="data"
                     [selector]="selector"
                     [labelSelector]="labelSelector"
                     [sort]="sort">
      </charts4ng-pie>
    </section>
  `,
  styleUrls: ['../card.component.scss'],
  styles: [``],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DownloadsComponent implements OnInit {

  loading = true;

  @Input() zoomed;
  @Output() zoomIn: EventEmitter<void> = new EventEmitter();
  @Output() zoomOut: EventEmitter<void> = new EventEmitter();

  owner: string;
  name: string;

  downloadCount = 0;
  releaseCount: number;
  releases$: Observable<Release[]>;
  data$: Observable<Release[]>;

  sortedByDate = false;
  sort = (a, b) => b.downloadCount - a.downloadCount;

  selector = d => d.downloadCount;
  labelSelector = d => d.tagName;

  constructor(
    private releasesGQL: ReleasesGQL,
    private moreReleasesGQL: MoreReleasesGQL,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.owner = this.route.snapshot.paramMap.get('user');
    this.name = this.route.snapshot.paramMap.get('repo');

    if (this.owner === null || this.name === null) {
      throw Error('owner or name is null!');
    }

    this.releases$ = this.loadReleases();

    const maxReleases = 30;

    this.data$ = this.releases$.pipe(
      tap(releases => this.downloadCount += releases.reduce((a, b) => a + b.downloadCount, 0)),
      map(releases => {
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
            .map(r => r.publishedAt.toUTCString())
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
      // tap(result => console.log(result.errors)),
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
      })
    );
  }

  loadMoreReleases(cursor: string): Observable<Release[]> {
    return this.moreReleasesGQL.watch({ owner: this.owner, name: this.name, cursor }).valueChanges.pipe(
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
      })
    );
  }

  sortByDate(): void {
    this.sort = (a, b) => b.publishedAt.toUTCString().localeCompare(a.publishedAt.toUTCString());
    this.sortedByDate = true;
  }

  sortByCount(): void {
    this.sort = (a, b) => b.downloadCount - a.downloadCount;
    this.sortedByDate = false;
  }

}
