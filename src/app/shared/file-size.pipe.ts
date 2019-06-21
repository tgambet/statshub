import {Pipe, PipeTransform} from '@angular/core';
import * as fileSize from 'filesize';

@Pipe({
  name: 'fileSize'
})
export class FileSizePipe implements PipeTransform {

  transform(value: number, args?: any): any {
    return fileSize(value, args);
  }

}
