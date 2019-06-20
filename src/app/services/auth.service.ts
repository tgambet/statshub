import {Injectable} from '@angular/core';
import {asapScheduler, defer, Observable, of, scheduled, throwError} from 'rxjs';
import {filter, mergeMap, switchMap, tap} from 'rxjs/operators';
import {Apollo} from 'apollo-angular';
import {User, ViewerGQL} from '../github.schema';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  user: Pick<User, 'name' | 'login'>;

  constructor(private apollo: Apollo, private viewerGQL: ViewerGQL) { }

  isLoggedIn(): boolean {
    return !!this.user;
  }

  login(token: string): Observable<Pick<User, 'name' | 'login'>> {
    const setToken = defer(() =>
      scheduled([localStorage.setItem('token', token)], asapScheduler)
    );
    const login = this.viewerGQL.fetch({}, { fetchPolicy: 'network-only'}).pipe(
      filter(result => !result.loading),
      switchMap((result) => {
        if (result.errors) {
          return throwError(result.errors);
        } else {
          return of(result.data.viewer);
        }
      }),
      tap(user => this.user = user)
    );
    return setToken.pipe(
      mergeMap(() => login)
    );
  }

  logout(): void {
    this.user = undefined;
    localStorage.removeItem('token');
    this.apollo.getClient().resetStore();
  }

}
