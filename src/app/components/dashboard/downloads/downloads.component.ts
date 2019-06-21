import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-downloads',
  template: `
    <p>
      downloads works!
    </p>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DownloadsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
