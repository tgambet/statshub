import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {RepositoryGQL} from '@app/github.schema';
import {map, tap} from 'rxjs/operators';
import {Observable} from 'rxjs';

interface RepoStats {
  url: string;
  description: string;
  homepage: string;
  createdAt: string;
  forkCount: number;
  starCount: number;
  commitCount: number;
  watcherCount: number;
  releaseCount: number;
  tagCount: number;
  size: number;
  license: string;
}

@Component({
  selector: 'app-information',
  template: `
    <ng-container *ngIf="repository$ | async as repo;">
      <dl>
        <dt>Repository</dt>
        <dd class="full">angular/angular</dd>
        <dt>Description</dt>
        <dd class="full">{{repo.description}}</dd>
        <dt>Homepage</dt>
        <dd class="full">{{repo.homepage}}</dd>
        <dt>Created on</dt>
        <dd class="full">{{repo.createdAt | date:'longDate'}}</dd>
        <dt>Commits</dt>
        <dd>{{repo.commitCount | number}}</dd>
        <dt>Size</dt>
        <dd>{{repo.size | fileSize}}</dd>
        <dt>Releases</dt>
        <dd>{{repo.releaseCount | number}}</dd>
        <dt>Tags</dt>
        <dd>{{repo.tagCount | number}}</dd>
        <dt>Stars</dt>
        <dd>{{repo.starCount | number}}</dd>
        <dt>Forks</dt>
        <dd>{{repo.forkCount | number}}</dd>
        <dt>Watchers</dt>
        <dd>{{repo.watcherCount | number}}</dd>
        <dt>License</dt>
        <dd>{{repo.license}}</dd>
      </dl>
    </ng-container>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
    }
    p, dl {
      margin: 0;
      line-height: 2;
    }
    dl {
      display: flex;
      flex-wrap: wrap;
    }
    dt {
      width: 6rem;
      text-align: right;
      font-weight: 300;
    }
    dd {
      width: calc(50% - 6rem);
      margin: 0;
      padding-left: 1rem;
      box-sizing: border-box;
    }
    dd.full {
      width: calc(100% - 6rem);
    }
    mat-chip {
      font-weight: 300;
      margin-top: 0 !important;
      margin-bottom: 0 !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InformationComponent implements OnInit {

  loading = true;
  repository$: Observable<RepoStats>;

  constructor(private repo: RepositoryGQL) { }

  ngOnInit() {
    this.repository$ = this.repo.watch({ owner: 'angular', name: 'angular' })
      .valueChanges.pipe(
        tap(result => this.loading = result.loading),
        map(result => result.data.repository),
        map(repo => ({
          url: repo.url,
          description: repo.description,
          homepage: repo.homepageUrl,
          createdAt: repo.createdAt,
          forkCount: repo.forkCount,
          starCount: repo.stargazers.totalCount,
          commitCount: repo.object.history.totalCount,
          watcherCount: repo.watchers.totalCount,
          releaseCount: repo.releases.totalCount,
          tagCount: repo.refs.totalCount,
          size: repo.diskUsage,
          license: repo.licenseInfo.nickname || repo.licenseInfo.name
        }))
      );
  }

}
