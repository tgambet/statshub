import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {ForksGQL, MoreForksGQL, MoreStargazersGQL, StargazersGQL} from '@app/github.schema';
import {concatMap, filter, map, mergeMap, tap} from 'rxjs/operators';
import {combineLatest, concat, Observable, of} from 'rxjs';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-popularity',
  template: `
    <charts4ng-line *ngIf="data$ | async as data" [data]="data" [legends]="legends"></charts4ng-line>
    <!--<ng-container *ngIf="stars$ | async as stars">
      {{ stars.length }}
    </ng-container>-->
  `,
  styles: [`
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopularityComponent implements OnInit {

  owner: string;
  name: string;

  loading = true;
  cursor: string;

  stars$: Observable<{ starredAt: string }[]>;
  forks$: Observable<{ forkedAt: string }[]>;

  data$: Observable<{ date: Date; value: number; }[][]>;
  legends = [
    { name: 'Stars', color: '#ffab00' },
    { name: 'Forks', color: 'steelblue' }
  ];

  constructor(
    private stargazersGQL: StargazersGQL,
    private moreStargazerGQL: MoreStargazersGQL,
    private forksGQL: ForksGQL,
    private moreForksGQL: MoreForksGQL,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.owner = this.route.snapshot.paramMap.get('user');
    this.name = this.route.snapshot.paramMap.get('repo');

    if (this.owner === null || this.name === null) {
      throw Error('owner or name is null!');
    }

    this.stars$ = this.loadStars();
    this.forks$ = this.loadForks();

    this.data$ = combineLatest([this.stars$, this.forks$]).pipe(
      map(combined => {
        const stargazers = combined[0];
        const forks = combined[1];

        const s = stargazers.map(stargazer => ({
          date: new Date(stargazer.starredAt),
          value: stargazers.indexOf(stargazer) + 1,
        }));

        const f = forks.map(fork => ({
          date: new Date(fork.forkedAt),
          value: forks.indexOf(fork)
        }));

        return [s, f];
      }),
      // tap(result => console.log(result))
    );
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
        const createdAts = forks.edges.map(f => ({ forkedAt: f.node.createdAt }));
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
        const createdAts = forks.edges.map(f => ({ forkedAt: f.node.createdAt }));
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
