import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {RepositoryGQL} from '@app/github.schema';
import {map, tap} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {ActivatedRoute} from '@angular/router';

interface RepoStats {
  imageUrl: string;
  url: string;
  path: string;
  description: string;
  homepage: string;
  createdAt: string;
  pushedAt: string;
  issueCount: number;
  prCount: number;
  forkCount: number;
  starCount: number;
  commitCount: number;
  watcherCount: number;
  releaseCount: number;
  tagCount: number;
  license: string;
}

@Component({
  selector: 'app-information',
  template: `
    <header>
      <h2>Information</h2>
    </header>
    <section>
      <ng-container *ngIf="repository$ | async as repo;">
        <img [src]="repo.imageUrl" alt="Repository image">
        <dl>
          <dt>Repository</dt>
          <dd>{{repo.path}}</dd>
          <dt>Description</dt>
          <dd>{{repo.description}}</dd>
          <dt>Homepage</dt>
          <dd>{{repo.homepage}}</dd>
          <dt>License</dt>
          <dd>{{repo.license}}</dd>
          <dt>Created on</dt>
          <dd>{{repo.createdAt | date:'longDate'}}</dd>
          <dt>Last pushed</dt>
          <dd>{{repo.pushedAt | timeAgo}}</dd>
          <dt>Commits</dt>
          <dd>{{repo.commitCount | number}}</dd>
          <dt>Open issues</dt>
          <dd>{{repo.issueCount | number}}</dd>
          <dt>Open PRs</dt>
          <dd>{{repo.prCount | number}}</dd>
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
        </dl>
      </ng-container>
    </section>
  `,
  styles: [`
    :host {
      font-size: 14px;
    }
    section {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    dl {
      margin: 0;
      line-height: 2;
      display: flex;
      flex-wrap: wrap;
      max-width: 100%;
    }
    dt {
      width: 6rem;
      text-align: right;
    }
    dd {
      width: calc(100% - 6rem);
      margin: 0;
      padding-left: 1rem;
      box-sizing: border-box;
      font-weight: 300;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    img {
      max-width: 100%;
      max-height: 155px;
      margin-bottom: 0.5rem;
    }
  `],
  styleUrls: ['../card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InformationComponent implements OnInit {

  loading = true;
  repository$: Observable<RepoStats>;

  constructor(
    private repo: RepositoryGQL,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    const owner = this.route.snapshot.paramMap.get('user');
    const name = this.route.snapshot.paramMap.get('repo');

    if (owner === null || name === null) {
      throw Error('owner or name is null!');
    }

    this.repository$ = this.repo.watch({ owner, name })
      .valueChanges.pipe(
        tap(result => this.loading = result.loading),
        map(result => result.data.repository),
        map(repo => ({
          imageUrl: repo.openGraphImageUrl,
          path: repo.nameWithOwner,
          url: repo.url,
          description: repo.description,
          homepage: repo.homepageUrl,
          createdAt: repo.createdAt,
          pushedAt: repo.pushedAt,
          issueCount: repo.issues.totalCount,
          prCount: repo.pullRequests.totalCount,
          forkCount: repo.forkCount,
          starCount: repo.stargazers.totalCount,
          commitCount: repo.object.history.totalCount,
          watcherCount: repo.watchers.totalCount,
          releaseCount: repo.releases.totalCount,
          tagCount: repo.refs.totalCount,
          license: repo.licenseInfo.nickname || repo.licenseInfo.name
        }))
      );
  }

}
