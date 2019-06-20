import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';

@Component({
  selector: 'app-logo',
  templateUrl: 'logo.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogoComponent {

  @Input() height = '100%';
  @Input() width = '100%';
  @Input() color = '#fff';

  constructor(
    private sanitizer: DomSanitizer
  ) { }

  getColor() {
    return this.sanitizer.bypassSecurityTrustStyle('fill: ' + this.color);
  }

}
