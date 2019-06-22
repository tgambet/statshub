import {NgModule} from '@angular/core';
import {Charts4ngComponent} from './charts4ng.component';
import {LineComponent} from './line/line.component';

@NgModule({
  declarations: [Charts4ngComponent, LineComponent],
  imports: [],
  exports: [Charts4ngComponent, LineComponent]
})
export class Charts4ngModule { }
