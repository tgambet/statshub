import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-logo',
  templateUrl: 'logo.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogoComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
