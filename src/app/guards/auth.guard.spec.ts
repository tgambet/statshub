import {AuthGuard} from './auth.guard';
import {Observable, of, throwError} from 'rxjs';

class MockRouter {
  navigate() {}
}

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let authService;
  let router;

  it('should return true for a logged in user', () => {
    authService = { isLoggedIn: () => true };
    router = new MockRouter();
    authGuard = new AuthGuard(authService, router);

    expect(authGuard.canActivate()).toEqual(true);
    expect(authGuard.canActivateChild()).toEqual(true);
  });

  it('should navigate to home for a logged out user', () => {
    authService = {
      isLoggedIn: () => false,
      login() {
        return throwError('error');
      }
    };
    router = new MockRouter();
    authGuard = new AuthGuard(authService, router);

    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    (authGuard.canActivate() as Promise<boolean>).then(
      result => expect(result).toEqual(false)
    ).catch(
      error => fail(error)
    );

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should login a user with a token', () => {
    authService = {
      isLoggedIn: () => false,
      login() {
        return of(null);
      }
    };
    router = new MockRouter();
    authGuard = new AuthGuard(authService, router);
    spyOn(router, 'navigate');

    // Set token
    localStorage.setItem('token', 'validToken');

    (authGuard.canActivate() as Observable<boolean>).subscribe(
      result => expect(result).toEqual(true),
      error => fail(error)
    );

    expect(router.navigate).toHaveBeenCalledTimes(0);
  });

  afterEach(() => {
    localStorage.removeItem('token');
  });
});
