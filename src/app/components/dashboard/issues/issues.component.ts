import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-issues',
  template: `
    <p>
      issues works!
    </p>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IssuesComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
