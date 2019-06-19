import {Injectable} from '@angular/core';
import {asapScheduler, defer, Observable, of, scheduled, throwError} from 'rxjs';
import {filter, first, mergeMap, switchMap, tap} from 'rxjs/operators';
import {Apollo} from 'apollo-angular';
import gql from 'graphql-tag';

export const LOGIN_QUERY = gql`
  query {
    viewer {
      name
    }
  }
`;

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  user: any;

  constructor(private apollo: Apollo) { }

  isLoggedIn(): boolean {
    return !!this.user;
  }

  login(token: string): Observable<any> {
    const setToken = defer(() =>
      scheduled([localStorage.setItem('token', token)], asapScheduler)
    );
    const loginQuery = this.apollo.watchQuery({
      query: LOGIN_QUERY
    }).valueChanges.pipe(
      filter(result => !result.loading),
      switchMap((result) => {
        if (result.errors) {
          return throwError(result.errors);
        } else {
          return of(result.data);
        }
      }),
      tap(user => this.user = user),
      first()
    );
    return setToken.pipe(
      mergeMap(() => loginQuery)
    );
  }

  logout(): void {
    this.user = undefined;
    localStorage.removeItem('token');
    this.apollo.getClient().resetStore();
  }

}
