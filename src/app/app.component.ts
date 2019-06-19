import {ChangeDetectionStrategy, Component} from '@angular/core';
import {AuthService} from './services/auth.service';

@Component({
  selector: 'app-root',
  template: `
    <h1>
      Welcome to {{ title }} {{ getName() }}!
    </h1>
    <router-outlet></router-outlet>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = 'statshub';

  constructor(private auth: AuthService) {}

  getName() {
    return this.auth.user ? this.auth.user.viewer.name : '';
  }

}
