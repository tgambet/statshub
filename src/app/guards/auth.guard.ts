import {Injectable} from '@angular/core';
import {CanActivate, CanActivateChild, Router, UrlTree} from '@angular/router';
import {Observable, of} from 'rxjs';
import {AuthService} from '../services/auth.service';
import {catchError, map, tap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.auth.isLoggedIn()) {
      return true;
    } else {
      const token = localStorage.getItem('token');
      if (token !== null) {
        return this.auth.login(token).pipe(
          map(() => true),
          catchError(() => of(false).pipe(
            tap(() => localStorage.removeItem('token')),
            tap(() => this.router.navigate(['/login']))
          ))
        );
      } else {
        return this.router.navigate(['/login']).then(
          () => false
        );
      }
    }
  }

  canActivateChild(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.canActivate();
  }

}
