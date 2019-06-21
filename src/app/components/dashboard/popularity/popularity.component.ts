import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-popularity',
  template: `
    <p>
      popularity works!
    </p>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PopularityComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
