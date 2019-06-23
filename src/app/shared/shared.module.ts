import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
  MatButtonModule,
  MatCardModule,
  MatFormFieldModule,
  MatGridListModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatSidenavModule,
  MatToolbarModule
} from '@angular/material';
import {LayoutModule} from '@angular/cdk/layout';
import {PipesModule} from '@app/shared/pipes.module';

const MODULES = [
  CommonModule,
  BrowserAnimationsModule,
  ReactiveFormsModule,
  MatFormFieldModule,
  MatInputModule,
  MatIconModule,
  MatButtonModule,
  MatGridListModule,
  MatCardModule,
  MatMenuModule,
  MatIconModule,
  MatButtonModule,
  LayoutModule,
  MatToolbarModule,
  MatSidenavModule,
  MatListModule,
  PipesModule
];

@NgModule({
  imports: MODULES,
  exports: MODULES
})
export class SharedModule { }
