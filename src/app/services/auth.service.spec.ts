import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {ApolloTestingController, ApolloTestingModule} from 'apollo-angular/testing';

import {AuthService} from './auth.service';
import {ViewerDocument} from '../github.schema';

describe('AuthService', () => {
  let controller: ApolloTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApolloTestingModule]
    });
    controller = TestBed.get(ApolloTestingController);
  });

  afterEach(() => {
    controller.verify();
    localStorage.removeItem('token');
  });

  it('should be created', () => {
    const service: AuthService = TestBed.get(AuthService);
    expect(service).toBeTruthy();
  });

  it('should have an undefined user when not logged in', () => {
    const service: AuthService = TestBed.get(AuthService);
    expect(service.isLoggedIn()).toEqual(false);
    expect(service.user).toBeUndefined();
  });

  it('should login a user', fakeAsync(() => {
    const service: AuthService = TestBed.get(AuthService);
    service.login('someToken').subscribe(
      user => expect(user).toEqual({ name: 'Thomas', login: 'tgambet' }),
      error => fail(error)
    );
    tick();
    const op = controller.expectOne(ViewerDocument);
    op.flush({
      data : {
        viewer: {
          name: 'Thomas',
          login: 'tgambet'
        },
        rateLimit: {
          limit: 5000,
          remaining: 4900,
          resetAt: '2019-07-02T09:46:58Z'
        }
      }
    });
    tick();
    expect(service.isLoggedIn()).toEqual(true);
    expect(service.user).toEqual({ name: 'Thomas', login: 'tgambet' });
  }));

  it('should set the token in local storage when logging a user', fakeAsync(() => {
    const service: AuthService = TestBed.get(AuthService);
    service.login('aToken').subscribe();
    tick();
    const op = controller.expectOne(ViewerDocument);
    op.flush({
      data : {
        viewer: {
          name: 'Thomas',
          login: 'tgambet'
        },
        rateLimit: {
          limit: 5000,
          remaining: 4900,
          resetAt: '2019-07-02T09:46:58Z'
        }
      }
    });
    tick();
    expect(localStorage.getItem('token')).toBe('aToken');
  }));

  it('should logout a user', fakeAsync(() => {
    const service: AuthService = TestBed.get(AuthService);
    service.login('aToken').subscribe();
    tick();
    const op = controller.expectOne(ViewerDocument);
    op.flush({
      data : {
        viewer: {
          name: 'Thomas',
          login: 'tgambet'
        },
        rateLimit: {
          limit: 5000,
          remaining: 4900,
          resetAt: '2019-07-02T09:46:58Z'
        }
      }
    });
    tick();
    expect(service.isLoggedIn()).toEqual(true);

    service.logout();

    expect(service.isLoggedIn()).toEqual(false);
    expect(service.user).toBeUndefined();
    expect(localStorage.getItem('token')).toBe(null);
  }));

});
