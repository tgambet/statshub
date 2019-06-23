import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {ForksGQL, MoreForksGQL, MoreStargazersGQL, StargazersGQL} from '@app/github.schema';
import {concatMap, filter, map, mergeMap, tap} from 'rxjs/operators';
import {concat, Observable, of} from 'rxjs';

@Component({
  selector: 'app-popularity',
  template: `
    <charts4ng-line *ngIf="data$ | async as data" [data]="data"></charts4ng-line>
    <!--<ng-container *ngIf="stars$ | async as stars">
      {{ stars.length }}
    </ng-container>-->
  `,
  styles: [`
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopularityComponent implements OnInit {

  loading = true;
  cursor: string;

  stars$: Observable<{ starredAt: string }[]>;
  forks$: Observable<{ forkedAt: string }[]>;

  data$: Observable<{ date: Date; value: number; }[]>;

  constructor(
    private stargazersGQL: StargazersGQL,
    private moreStargazerGQL: MoreStargazersGQL,
    private forksGQL: ForksGQL,
    private moreForksGQL: MoreForksGQL
  ) { }

  ngOnInit() {
    this.stars$ = this.loadStars();

    this.data$ = this.stars$.pipe(
      map(stargazers => stargazers.map(stargazer => ({
        date: new Date(stargazer.starredAt),
        value: stargazers.indexOf(stargazer) + 1,
      }))),
      // tap(result => console.log(result))
    );
  }

  loadStars(): Observable<{ starredAt: string }[]> {
    return this.stargazersGQL.watch({ owner: 'tgambet', name: 'musicalypse' })
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
    return this.moreStargazerGQL.watch({ owner: 'tgambet', name: 'musicalypse', cursor }).valueChanges.pipe(
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
    return this.forksGQL.watch({ owner: 'akka', name: 'alpakka' }).valueChanges.pipe(
      filter(result => !result.loading),
      map(result => result.data.repository.forks),
      concatMap(forks => {
        const createdAts = forks.edges.map(f => ({ forkedAt: f.node.createdAt }));
        if (forks.pageInfo.hasNextPage) {
          return this.loadMoreForks(forks.pageInfo.endCursor).pipe(
            map(newForks => [...createdAts, ...newForks]),
          );
        } else {
          return of(createdAts);
        }
      })
    );
  }

  loadMoreForks(cursor: string): Observable<{ forkedAt: string }[]> {
    return this.moreForksGQL.watch({ owner: 'akka', name: 'alpakka', cursor }).valueChanges.pipe(
      filter(result => !result.loading),
      map(result => result.data.repository.forks),
      concatMap(forks => {
        const createdAts = forks.edges.map(f => ({ forkedAt: f.node.createdAt }));
        if (forks.pageInfo.hasNextPage) {
          return this.loadMoreForks(forks.pageInfo.endCursor).pipe(
            map(newForks => [...createdAts, ...newForks])
          );
        } else {
          return of(createdAts);
        }
      })
    );
  }

}
