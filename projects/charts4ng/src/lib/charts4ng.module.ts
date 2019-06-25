import {NgModule} from '@angular/core';
import {LineComponent} from './line/line.component';
import {CommonModule} from '@angular/common';
import {PieComponent} from './pie/pie.component';

const COMPONENTS = [
  LineComponent,
  PieComponent
];

@NgModule({
  imports: [CommonModule],
  declarations: COMPONENTS,
  exports: COMPONENTS
})
export class Charts4ngModule { }
