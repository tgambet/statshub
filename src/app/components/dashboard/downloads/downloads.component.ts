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
      </mat-menu>
    </header>
    <section>
      <charts4ng-pie *ngIf="data$ | async as data" [data]="data" [selector]="selector" [sort]="sort"></charts4ng-pie>
    </section>
  `,
  styleUrls: ['../card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DownloadsComponent implements OnInit {

  loading = true;

  @Input() zoomed;
  @Output() zoomIn: EventEmitter<void> = new EventEmitter();
  @Output() zoomOut: EventEmitter<void> = new EventEmitter();

  owner: string;
  name: string;

  releaseCount: number;
  releases$: Observable<Release[]>;
  data$: Observable<Release[]>;

  selector = d => d.downloadCount === 0 ? 1 : d.downloadCount;
  sort = (a, b) => b.downloadCount - a.downloadCount;

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
      map(releases => {
        releases.sort((a, b) => b.downloadCount - a.downloadCount);
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
          return concat(of(releasesMap), this.loadMoreReleases(releases.pageInfo.endCursor));
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
          return concat(of(releasesMap), this.loadMoreReleases(releases.pageInfo.endCursor));
        } else {
          return of(releasesMap);
        }
      })
    );
  }

}
