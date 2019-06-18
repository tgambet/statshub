import {Injectable} from '@angular/core';
import {Observable, of, throwError} from 'rxjs';
import {delay} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }

  isLoggedIn(): boolean {
    return true;
  }

  login(token: string): Observable<void> {
    if (token === 'test') {
      return of(null).pipe(delay(1000));
    } else {
      return throwError('Invalid token');
    }
  }

}
