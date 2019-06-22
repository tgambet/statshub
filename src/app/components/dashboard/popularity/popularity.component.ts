import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {MoreStargazersGQL, StargazersGQL} from '@app/github.schema';
import {filter, map, mergeMap, tap} from 'rxjs/operators';
import {Observable, of} from 'rxjs';

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

  stars$: Observable<any[]>;
  data$: Observable<{ date: Date; value: number; }[]>;

  constructor(
    private stargazersGQL: StargazersGQL,
    private moreStargazerGQL: MoreStargazersGQL
  ) { }

  ngOnInit() {
    this.stars$ = this.stargazersGQL.watch({ owner: 'akka', name: 'alpakka' })
      .valueChanges.pipe(
        tap(result => this.loading = result.loading),
        filter(result => !result.loading),
        map(result => result.data.repository.stargazers),
        mergeMap(stargazers => {
          if (stargazers.pageInfo.hasPreviousPage) {
            return this.loadMore(stargazers.pageInfo.startCursor).pipe(
              map(newStargazers => [...newStargazers, ...stargazers.edges])
            );
          } else {
            return of(stargazers.edges);
          }
        }),
      );

    this.data$ = this.stars$.pipe(
      map(stargazers => stargazers.map(stargazer => ({
        date: new Date(stargazer.starredAt),
        value: stargazers.indexOf(stargazer) + 1,
      }))),
      tap(result => console.log(result))
    );
  }

  loadMore(cursor: string): Observable<any[]> {
    return this.moreStargazerGQL.watch({ owner: 'akka', name: 'alpakka', cursor }).valueChanges.pipe(
      filter(result => !result.loading),
      map(result => result.data.repository.stargazers),
      mergeMap(stargazers => {
        if (stargazers.pageInfo.hasPreviousPage) {
          return this.loadMore(stargazers.pageInfo.startCursor).pipe(
            map(newStargazers => [...newStargazers, ...stargazers.edges])
          );
        } else {
          return of(stargazers.edges);
        }
      })
    );
  }

}
