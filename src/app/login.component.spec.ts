import {async, TestBed} from '@angular/core/testing';
import {EventEmitter} from '@angular/core';
import {Router} from '@angular/router';
import {Observable, of, throwError} from 'rxjs';
import {delayWhen} from 'rxjs/operators';

import {LoginComponent} from './login.component';
import {AuthService} from './services/auth.service';
import {SharedModule} from './shared/shared.module';
import {LogoComponent} from './components/logo.component';

const respond: EventEmitter<void> = new EventEmitter();

class MockAuthService {
  login(token: string): Observable<void> {
    if (token === 'validToken') {
      return of(null).pipe(delayWhen(() => respond.asObservable()));
    } else {
      return throwError('Invalid token');
    }
  }
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let authService: MockAuthService;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      imports: [
        SharedModule
      ],
      declarations: [LoginComponent, LogoComponent],
      providers: [
        { provide: AuthService, useClass: MockAuthService },
        { provide: Router,      useValue: routerSpy }
      ]
    });
  }));

  beforeEach(() => {
    component = TestBed.createComponent(LoginComponent).componentInstance;
    authService = TestBed.get(AuthService);
    router = TestBed.get(Router);
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should hide github token by default', () => {
    component.ngOnInit();
    expect(component.hide).toEqual(true);
  });

  it('should create a login form with a token control', () => {
    component.ngOnInit();
    expect(component.loginForm).toBeTruthy();
    expect(component.f.token).toBeTruthy();
    expect(component.f.token.updateOn).toEqual('submit');
  });

  it('should subscribe to the form status changes', () => {
    component.ngOnInit();
    expect(component.formSubscription).toBeTruthy();
  });

  it('should validate the token control', () => {
    component.ngOnInit();
    component.f.token.setValue('validToken');
    expect(component.loginForm.status).toBe('PENDING');
    expect(component.loading).toBe(true);

    respond.emit();

    expect(component.loginForm.status).toEqual('VALID');
    expect(component.loading).toBe(false);

    component.f.token.setValue('invalidToken');
    expect(component.loginForm.status).toEqual('INVALID');
    expect(component.loginForm.valid).toEqual(false);
  });

  it('should show an error message if form is invalid', () => {
    component.ngOnInit();
    component.f.token.setValue('');
    expect(component.loginForm.valid).toEqual(false);
    expect(component.getErrorMessage(component.f.token)).toEqual(
      'A Github access token is required to use this application'
    );
    component.f.token.setValue('invalidToken');
    expect(component.getErrorMessage(component.f.token)).toEqual(
      'Invalid Github token: Invalid token'
    );
  });

});
