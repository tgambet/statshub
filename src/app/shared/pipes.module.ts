import {NgModule} from '@angular/core';
import {FileSizePipe} from '@app/shared/file-size.pipe';
import {TimeAgoPipe} from './time-ago.pipe';

@NgModule({
  declarations: [FileSizePipe, TimeAgoPipe],
  exports: [FileSizePipe, TimeAgoPipe]
})
export class PipesModule { }
