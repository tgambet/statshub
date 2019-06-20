import {Injectable} from '@angular/core';
import {asapScheduler, defer, Observable, of, scheduled, throwError} from 'rxjs';
import {filter, mergeMap, switchMap, tap} from 'rxjs/operators';
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
    const login = this.apollo.query({
      query: LOGIN_QUERY
    }).pipe(
      filter(result => !result.loading),
      switchMap((result) => {
        if (result.errors) {
          return throwError(result.errors);
        } else {
          return of(result.data);
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
