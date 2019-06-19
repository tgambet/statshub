import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule} from '@angular/material';

const MODULES = [
  BrowserModule,
  BrowserAnimationsModule,
  CommonModule,
  ReactiveFormsModule,
  MatFormFieldModule,
  MatInputModule,
  MatIconModule,
  MatButtonModule,
];

@NgModule({
  declarations: [],
  imports: MODULES,
  exports: MODULES
})
export class SharedModule { }
