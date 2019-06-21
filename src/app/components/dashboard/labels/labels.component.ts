import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-labels',
  template: `
    <p>
      labels works!
    </p>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabelsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
