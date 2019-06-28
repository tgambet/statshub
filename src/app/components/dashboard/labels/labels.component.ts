import {ChangeDetectionStrategy, Component, EventEmitter, OnInit} from '@angular/core';
import {concat, EMPTY, Observable, of} from 'rxjs';
import {DashboardService} from '@app/services/dashboard.service';
import {ActivatedRoute} from '@angular/router';
import {catchError, filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {ApolloError} from 'apollo-client';
import {IssuesGQL, LabelsGQL, MoreIssuesGQL} from '@app/github.schema';

interface Issue {
  number: number;
  closed: boolean;
  labels: string[];
}

interface Label {
  name: string;
  color: string;
}

@Component({
  selector: 'app-labels',
  template: `
    <header>
      <h2>Labels
        <mat-icon matTooltip="Relationship between open issues labels">info</mat-icon>
        <mat-icon color="warn"
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
      <charts4ng-chords *ngIf="data$ | async as data" [data]="data.matrix" [legend]="data.legends"></charts4ng-chords>
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
export class LabelsComponent implements OnInit {

  focused: Observable<boolean>;

  owner: string;
  name: string;

  loading = true;
  stopped = false;
  loadedCount = 0;
  stopLoading: EventEmitter<void> = new EventEmitter();

  issueCount = 0;

  issues$: Observable<Issue[]>;
  labels$: Observable<Label[]>;
  data$: Observable<{matrix: number[][], legends: {name: string, color: string}[]}>;

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
    private labelsGQL: LabelsGQL,
    private route: ActivatedRoute
  ) {
    this.focused = this.dashboard.focused$;
  }

  zoomIn() {
    this.dashboard.focus('labels');
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
    this.issues$ = this.loadIssues().pipe(
      takeUntil(this.stopLoading.asObservable()),
      map(issues => issues.filter(issue => !issue.closed))
    );

    this.labels$ = this.loadLabels();

    this.data$ =
      this.labels$.pipe(
        switchMap(labels => this.issues$.pipe(
          map(issues => {
            const indexByName = new Map();
            const nameByIndex = new Map();
            const matrix = [];
            let n = 0;

            const issuesLabels = issues.reduce((obj, issue) => {
              issue.labels.forEach(label => {
                if (!obj.hasOwnProperty(label)) {
                  obj[label] = [];
                }
                obj[label].push(issue.number);
              });
              return obj;
            }, { });

            let labelsArray = Object.keys(issuesLabels)
              .map(key => [key, issuesLabels[key]])
              .sort((a, b) => b[1].length - a[1].length);

            const maxLabels = 30;

            if (labelsArray.length > maxLabels) {
              labelsArray = [
                ...labelsArray.slice(0, maxLabels),
                labelsArray.slice(maxLabels).reduce((p, c) => {
                  p[1].push(...c[1]);
                  return p;
                }, ['other labels', []])
              ];
            }

            labelsArray.forEach(d => {
              indexByName.set(d[0], n);
              nameByIndex.set(n, d[0]);
              n++;
            });

            labelsArray.forEach(label => {
              const labelName = label[0];
              const labelIssues = label[1];
              const source = indexByName.get(labelName);
              let row = matrix[source];
              if (!row) {
                row = matrix[source] = Array.from({length: n}).fill(0);
              }
              const imported = issues
                .filter(issue => labelIssues.includes(issue.number))
                .reduce((a, b) => [...a, b.labels.filter(bl => bl !== labelName)], []);

              imported.forEach(array => {
                if (array.length === 0) {
                  row[source]++;
                } else {
                  array.forEach(l => row[indexByName.get(l)]++);
                }
              });
            });

            const legends = labelsArray.map(label => ({
              name: label[0],
              color: '#' + (labels.find(l => l.name === label[0]) && labels.find(l => l.name === label[0]).color || 'fff')
            }));

            return {
              matrix,
              legends
            };
          })
        ))
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

  loadLabels(): Observable<Label[]> {
    return this.labelsGQL.watch(
      { owner: this.owner, name: this.name },
    ).valueChanges.pipe(
      tap(result => this.loading = result.loading),
      map(result => result.data.repository.labels),
      map(labels => labels.nodes.map(l => ({name: l.name, color: l.color})))
    );
  }

  loadIssues(): Observable<Issue[]> {
    return this.issuesGQL.watch(
      { owner: this.owner, name: this.name },
      { fetchPolicy: 'cache-only' }
    ).valueChanges.pipe(
      tap(result => {
        if (result.errors) {
          this.errors = result.errors.map(e => e.message);
          this.stopLoading.emit();
          this.stopped = true;
        }
      }),
      filter(result => !result.loading &&
        result.data.repository !== undefined &&
        result.data.repository.issues !== undefined
      ),
      map(result => result.data.repository.issues),
      tap(issues => this.issueCount = issues.totalCount),
      switchMap(issues => {
        const issuesMap = issues.nodes.map(issue => ({
          number: issue.number,
          closed: issue.closed,
          labels: issue.labels.nodes.map(n => n.name)
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
      { owner: this.owner, name: this.name, cursor },
      { fetchPolicy: 'cache-only' }
    ).valueChanges.pipe(
      tap(result => {
        if (result.errors) {
          this.errors = result.errors.map(e => e.message);
          this.stopLoading.emit();
          this.stopped = true;
        }
      }),
      filter(result => !result.loading &&
        result.data.repository !== undefined &&
        result.data.repository.issues !== undefined
      ),
      map(result => result.data.repository.issues),
      switchMap(issues => {
        const issuesMap = issues.nodes.map(issue => ({
          number: issue.number,
          closed: issue.closed,
          labels: issue.labels.nodes.map(n => n.name)
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
