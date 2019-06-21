import {NgModule} from '@angular/core';
import {FileSizePipe} from '@app/shared/file-size.pipe';

@NgModule({
  declarations: [FileSizePipe],
  exports: [FileSizePipe]
})
export class PipesModule { }
