import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-information',
  template: `
    <p>
      information works!
    </p>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InformationComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
