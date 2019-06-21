import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {Observable, of, Subscription} from 'rxjs';
import {tap} from 'rxjs/operators';

@Component({
  selector: 'app-search',
  template: `
    <app-logo color="#404040"></app-logo>
    <form [formGroup]="searchForm">
      <mat-form-field appearance="standard">
        <mat-label>GitHub repository path</mat-label>
        <input matInput formControlName="search" spellcheck="false">
        <mat-hint>e.g. angular/angular</mat-hint>
        <mat-error *ngIf="f.search.invalid">{{ getErrorMessage(f.search) }}</mat-error>
      </mat-form-field>
      <button type="submit" mat-raised-button color="primary" [disabled]="loading">
        {{ loading ? 'LOADING' : 'GO' }}
      </button>
    </form>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: calc(100% - 64px);
      align-items: center;
      justify-content: center;
    }
    app-logo {
      position: absolute;
      width: 100%;
      max-width: 750px;
      max-height: calc(100% - 64px);
      overflow: hidden;
      padding: 1rem;
      box-sizing: border-box;
    }
    h1 {
      margin: 0;
      position: absolute;
      top: 150px;
    }
    form {
      display: flex;
      flex-direction: column;
      width: 100%;
      padding: 0 1rem;
      box-sizing: border-box;
      max-width: 375px;
    }
    button {
      margin-top: 1rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchComponent implements OnInit, OnDestroy {

  searchForm: FormGroup;
  loading = false;
  subscription: Subscription = new Subscription();

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  get f() { return this.searchForm.controls; }

  ngOnInit() {
    this.searchForm = this.formBuilder.group({
      search: ['', {
        validators: [Validators.required, Validators.pattern(/.+\/.+/)],
        asyncValidators: [this.githubRepositoryValidator.bind(this)],
        updateOn: 'submit'
      }]
    });

    this.subscription.add(
      this.searchForm.statusChanges.pipe(
        tap(status => {
          if (status === 'VALID') {
            this.loading = false;
            const a = this.f.search.value.toString().split('/');
            this.router.navigate(['repos', a[0], a[1]]);
          }
          if (status === 'PENDING') {
            this.loading = true;
          }
          if (status === 'INVALID') {
            this.loading = false;
          }
          this.cdr.markForCheck();
        })
      ).subscribe()
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getErrorMessage(control: AbstractControl): string {
    if (control.errors.required) {
      return 'A value is required';
    }
    if (control.errors.pattern) {
      return 'Repository url must be in the form :user/:repo';
    }
    if (control.errors.invalid) {
      return control.errors.invalid;
    }
  }

  githubRepositoryValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    return of(null);
  }

}
