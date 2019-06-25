import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ForksGQL, MoreForksGQL, MoreStargazersGQL, RepositoryGQL, StargazersGQL} from '@app/github.schema';
import {concatMap, filter, first, map, mergeMap, takeUntil, tap} from 'rxjs/operators';
import {combineLatest, concat, Observable, of} from 'rxjs';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-popularity',
  template: `
    <header>
      <h2>Popularity</h2>
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
        <button mat-menu-item *ngIf="progress < 100 && !stopped" (click)="stopLoading.emit(); stopped = true">
          <mat-icon>stop</mat-icon>
          Stop
        </button>
        <button mat-menu-item *ngIf="progress < 100 && stopped" (click)="init(true); stopped = false">
          <mat-icon>play_arrow</mat-icon>
          Resume
        </button>
      </mat-menu>
    </header>
    <section>
      <charts4ng-line *ngIf="data$ | async as data else load" [data]="data" [legends]="legends"></charts4ng-line>
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
export class PopularityComponent implements OnInit {

  @Input() zoomed;
  @Output() zoomIn: EventEmitter<void> = new EventEmitter();
  @Output() zoomOut: EventEmitter<void> = new EventEmitter();

  loading = true;
  stopped = false;
  loadedCount = 0;
  stopLoading: EventEmitter<void> = new EventEmitter();

  owner: string;
  name: string;
  starCount: number;
  createdAt: Date;

  stars$: Observable<{ starredAt: string }[]>;
  forks$: Observable<{ forkedAt: string }[]>;

  data$: Observable<{ date: Date; value: number; }[][]>;
  legends = [
    { name: 'Stars', color: '#ffab00' },
    { name: 'Forks', color: 'steelblue' }
  ];

  get progress() {
    return this.starCount > 0 ? this.loadedCount / this.starCount * 100 : 100;
  }

  constructor(
    private repositoryGQL: RepositoryGQL,
    private stargazersGQL: StargazersGQL,
    private moreStargazerGQL: MoreStargazersGQL,
    private forksGQL: ForksGQL,
    private moreForksGQL: MoreForksGQL,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.owner = this.route.snapshot.paramMap.get('user');
    this.name = this.route.snapshot.paramMap.get('repo');

    if (this.owner === null || this.name === null) {
      throw Error('owner or name is null!');
    }

    this.repositoryGQL.watch({
      owner: this.owner,
      name: this.name
    }).valueChanges.pipe(
      filter(result => !result.loading),
      first(),
      map(result => result.data.repository),
    ).subscribe(
      repo => {
        this.starCount = repo.stargazers.totalCount;
        this.createdAt = new Date(repo.createdAt);
        this.init();
        this.cdr.markForCheck();
      }
    );
  }

  init(emptyFirst: boolean = false) {
    this.stars$ = this.loadStars().pipe(takeUntil(this.stopLoading.asObservable()));
    this.forks$ = this.loadForks().pipe(takeUntil(this.stopLoading.asObservable()));

    const latest = combineLatest([this.stars$, this.forks$]).pipe(
      map(combined => {
        const stargazers = combined[0];
        const forks = combined[1];

        stargazers.sort((a, b) => a.starredAt.localeCompare(b.starredAt));
        forks.sort((a, b) => a.forkedAt.localeCompare(b.forkedAt));

        let s = stargazers.map(stargazer => ({
          date: new Date(stargazer.starredAt),
          value: stargazers.indexOf(stargazer) + 1,
        }));

        let f = forks.map(fork => ({
          date: new Date(fork.forkedAt),
          value: forks.indexOf(fork) + 1
        }));

        this.loadedCount = s.length;

        if (this.createdAt) {
          s = [{ date: this.createdAt, value: 0 }, ...s];
          f = [{ date: this.createdAt, value: 0 }, ...f];
        }

        return [s, f];
      })
    );
    this.data$ = emptyFirst ? concat(of([]), latest) : latest;
  }

  loadStars(): Observable<{ starredAt: string }[]> {
    return this.stargazersGQL.watch({ owner: this.owner, name: this.name })
      .valueChanges.pipe(
        tap(result => this.loading = result.loading),
        filter(result => !result.loading),
        map(result => result.data.repository.stargazers),
        mergeMap(stargazers => {
          if (stargazers.pageInfo.hasNextPage) {
            const more = this.loadMoreStars(stargazers.pageInfo.endCursor).pipe(
              map(newStargazers => [...stargazers.edges, ...newStargazers])
            );
            return concat(of(stargazers.edges), more);
          } else {
            return of(stargazers.edges);
          }
        }),
      );
  }

  loadMoreStars(cursor: string): Observable<{ starredAt: string }[]> {
    return this.moreStargazerGQL.watch({ owner: this.owner, name: this.name, cursor }).valueChanges.pipe(
      filter(result => !result.loading),
      map(result => result.data.repository.stargazers),
      mergeMap(stargazers => {
        if (stargazers.pageInfo.hasNextPage) {
          const more = this.loadMoreStars(stargazers.pageInfo.endCursor).pipe(
            map(newStargazers => [...stargazers.edges, ...newStargazers])
          );
          return concat(of(stargazers.edges), more);
        } else {
          return of(stargazers.edges);
        }
      })
    );
  }

  loadForks(): Observable<{ forkedAt: string }[]> {
    return this.forksGQL.watch({ owner: this.owner, name: this.name }).valueChanges.pipe(
      filter(result => !result.loading),
      map(result => result.data.repository.forks),
      concatMap(forks => {
        const createdAts = forks.nodes.map(f => ({ forkedAt: f.createdAt }));
        if (forks.pageInfo.hasNextPage) {
          const more = this.loadMoreForks(forks.pageInfo.endCursor).pipe(
            map(newForks => [...createdAts, ...newForks]),
          );
          return concat(of(createdAts), more);
        } else {
          return of(createdAts);
        }
      })
    );
  }

  loadMoreForks(cursor: string): Observable<{ forkedAt: string }[]> {
    return this.moreForksGQL.watch({ owner: this.owner, name: this.name, cursor }).valueChanges.pipe(
      filter(result => !result.loading),
      map(result => result.data.repository.forks),
      concatMap(forks => {
        const createdAts = forks.nodes.map(f => ({ forkedAt: f.createdAt }));
        if (forks.pageInfo.hasNextPage) {
          const more = this.loadMoreForks(forks.pageInfo.endCursor).pipe(
            map(newForks => [...createdAts, ...newForks])
          );
          return concat(of(createdAts), more);
        } else {
          return of(createdAts);
        }
      })
    );
  }

}
