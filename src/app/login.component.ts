import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators} from '@angular/forms';
import {Observable, of, Subscription} from 'rxjs';
import {catchError, map, tap} from 'rxjs/operators';
import {Router} from '@angular/router';
import {AuthService} from './services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <header>
      <app-logo></app-logo>
      <h1>StatsHub</h1>
    </header>
    <form [formGroup]="loginForm">
      <mat-form-field appearance="standard">
        <mat-label>Github personal access token</mat-label>
        <input matInput formControlName="token" [type]="hide ? 'password' : 'text'" spellcheck="false">
        <mat-error *ngIf="f.token.invalid">{{ getErrorMessage(f.token) }}</mat-error>
        <button mat-icon-button matSuffix
                (click)="hide = !hide" [attr.aria-label]="'Hide password'" [attr.aria-pressed]="hide" type="button">
          <mat-icon>{{hide ? 'visibility_off' : 'visibility'}}</mat-icon>
        </button>
      </mat-form-field>
      <button type="submit" mat-raised-button color="primary" [disabled]="loading">
        {{ loading ? 'LOADING' : 'LOGIN' }}
      </button>
    </form>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100%;
      align-items: center;
      justify-content: center;
    }
    header {
      display: flex;
      align-items: center;
      width: 100%;
    }
    app-logo {
      min-width: 60px;
      margin-right: 1rem;
    }
    h1 {
      font-weight: 700;
      font-size: 60px;
      margin: 0;
      line-height: 1;
    }
    form {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    form, header {
      padding: 0 1rem;
      box-sizing: border-box;
      max-width: 375px;
    }
    mat-form-field {
      width: 100%;
    }
    button {
      margin-top: 1rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit, OnDestroy {

  hide = true;
  loginForm: FormGroup;
  loading = false;
  formSubscription: Subscription;

  constructor(
    private auth: AuthService,
    private formBuilder: FormBuilder,
    private router: Router
  ) { }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      token: [
        '',
        {
          validators: [Validators.required],
          asyncValidators: [this.githubTokenValidator.bind(this)],
          updateOn: 'submit'
        }
      ],
    });
    this.formSubscription = this.loginForm.statusChanges.pipe(
      tap(status => {
        if (status === 'VALID') {
          this.loading = false;
          this.router.navigate(['app']);
        }
        if (status === 'PENDING') {
          this.loading = true;
        }
      })
    ).subscribe();
  }

  ngOnDestroy(): void {
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
  }

  get f() { return this.loginForm.controls; }

  getErrorMessage(control: AbstractControl): string {
    if (control.errors.required) {
      return 'A Github access token is required to use this application';
    }
    if (control.errors.invalid) {
      return 'Invalid Github token: ' + control.errors.invalid;
    }
  }

  githubTokenValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    return this.auth.login(control.value).pipe(
      map(() => null),
      catchError(error => of({
        invalid: error
      }))
    );
  }

}
