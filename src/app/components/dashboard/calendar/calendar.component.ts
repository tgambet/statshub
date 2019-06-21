import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-calendar',
  template: `
    <p>
      calendar works!
    </p>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
