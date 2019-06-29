import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit} from '@angular/core';
import {ForksGQL, MoreForksGQL, MoreStargazersGQL, RepositoryGQL, StargazersGQL} from '@app/github.schema';
import {catchError, concatMap, filter, first, map, mergeMap, takeUntil, tap} from 'rxjs/operators';
import {combineLatest, concat, EMPTY, Observable, of} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {ApolloError} from 'apollo-client';
import {DashboardService} from '@app/services/dashboard.service';

@Component({
  selector: 'app-popularity',
  template: `
    <header>
      <h2>Popularity <mat-icon color="warn"
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
        <button mat-menu-item *ngIf="progress < 100 && stopped" (click)="init(true); stopped = false">
          <mat-icon color="primary">play_arrow</mat-icon>
          Resume
        </button>
      </mat-menu>
    </header>
    <section>
      <charts4ng-line *ngIf="data$ | async as data else load" [data]="data" [legends]="legends"></charts4ng-line>
      <ng-template #load *ngIf="!waiting">
        <mat-spinner diameter="40"></mat-spinner>
      </ng-template>
      <div class="confirm" *ngIf="waiting">
        <p>That's a lot of stars!</p>
        <p>Computing the popularity graph for this repository will cost you at least {{ expectedRequests }} requests.</p>
        <button mat-raised-button color="primary" (click)="waiting = false; stopped = false; init()">
          DO IT!
        </button>
      </div>
    </section>
    <footer>
      <mat-progress-bar *ngIf="progress < 100 && !waiting" [mode]="loading ? 'query' : 'determinate'" [value]="progress"></mat-progress-bar>
    </footer>
  `,
  styleUrls: ['../card.component.scss'],
  styles: [`
    .confirm {
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      justify-content: center;
    }
    .confirm p {
      margin: 0 0 1rem 0;
      font-weight: 300;
      text-align: center;
      line-height: 1.5;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopularityComponent implements OnInit {

  focused: Observable<boolean>;

  waiting = false;
  loading = true;
  stopped = false;
  loadedCount = 0;
  stopLoading: EventEmitter<void> = new EventEmitter();

  owner: string;
  name: string;
  starCount = 0;
  forkCount = 0;
  createdAt: Date;

  stars$: Observable<{ starredAt: string }[]>;
  forks$: Observable<{ forkedAt: string }[]>;

  data$: Observable<{ date: Date; value: number; }[][]>;
  legends = [
    { name: 'Stars', color: '#64dd22' },
    { name: 'Forks', color: '#00b0ff' }
  ];

  errors: string[] = [];

  get progress() {
    return this.starCount + this.forkCount > 0 ? this.loadedCount / (this.starCount + this.forkCount) * 100 : 100;
  }

  get expectedRequests() {
    return Math.floor(this.starCount / 100);
  }

  get hasError() {
    return this.errors.length > 0;
  }

  get getErrors() {
    return this.errors.join('\n');
  }

  constructor(
    private dashboard: DashboardService,
    private repositoryGQL: RepositoryGQL,
    private stargazersGQL: StargazersGQL,
    private moreStargazerGQL: MoreStargazersGQL,
    private forksGQL: ForksGQL,
    private moreForksGQL: MoreForksGQL,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.focused = this.dashboard.focused$;
  }

  zoomIn() {
    this.dashboard.focus('popularity');
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
        if (this.starCount > 10000) {
          this.waiting = true;
          this.stopped = true;
        } else {
          this.init();
        }
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

        this.loadedCount = s.length + f.length;

        if (this.createdAt) {
          s = [{ date: this.createdAt, value: 0 }, ...s];
          f = [{ date: this.createdAt, value: 0 }, ...f];
        }

        if (this.progress >= 100 && s.length > 0 && f.length > 0) {
          s = [...s, { date: new Date(), value: s[s.length - 1].value }];
          f = [...f, { date: new Date(), value: f[f.length - 1].value }];
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
        tap(result => {
          if (result.errors) {
            this.errors = result.errors.map(e => e.message);
            this.stopLoading.emit();
            this.stopped = true;
          }
        }),
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
        catchError((error: ApolloError) => {
          console.error('ApolloError', error);
          return EMPTY;
        })
      );
  }

  loadMoreStars(cursor: string): Observable<{ starredAt: string }[]> {
    return this.moreStargazerGQL.watch({ owner: this.owner, name: this.name, cursor }).valueChanges.pipe(
      tap(result => {
        if (result.errors) {
          this.errors = result.errors.map(e => e.message);
          this.stopLoading.emit();
          this.stopped = true;
        }
      }),
      filter(result => !result.loading),
      tap(result => {
        if (result.errors) {
          this.errors = result.errors.map(e => e.message);
          this.stopLoading.emit();
          this.stopped = true;
        }
      }),
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
      catchError((error: ApolloError) => {
        console.error('ApolloError', error);
        return EMPTY;
      })
    );
  }

  loadForks(): Observable<{ forkedAt: string }[]> {
    return this.forksGQL.watch({ owner: this.owner, name: this.name }).valueChanges.pipe(
      tap(result => {
        if (result.errors) {
          this.errors = result.errors.map(e => e.message);
          this.stopLoading.emit();
          this.stopped = true;
        }
      }),
      filter(result => !result.loading),
      map(result => result.data.repository.forks),
      tap(forks => this.forkCount = forks.totalCount),
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
      }),
      catchError((error: ApolloError) => {
        console.error('ApolloError', error);
        return EMPTY;
      })
    );
  }

  loadMoreForks(cursor: string): Observable<{ forkedAt: string }[]> {
    return this.moreForksGQL.watch({ owner: this.owner, name: this.name, cursor }).valueChanges.pipe(
      tap(result => {
        if (result.errors) {
          this.errors = result.errors.map(e => e.message);
          this.stopLoading.emit();
          this.stopped = true;
        }
      }),
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
      }),
      catchError((error: ApolloError) => {
        console.error('ApolloError', error);
        return EMPTY;
      })
    );
  }

}
