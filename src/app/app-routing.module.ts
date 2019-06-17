import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AppComponent} from './app.component';
import {LoginComponent} from './login.component';
import {AuthGuard} from './guards/auth.guard';

const appRoutes: Routes = [];

const routes: Routes = [
  {
    path: '', redirectTo: 'app/', pathMatch: 'full'
  },
  {
    path: 'login', component: LoginComponent
  },
  {
    path: 'app', component: AppComponent, canActivate: [AuthGuard], children: appRoutes
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
