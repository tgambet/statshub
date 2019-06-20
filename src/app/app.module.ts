import {NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';

import {AppComponent} from './app.component';
import {LoginComponent} from './login.component';
import {RootComponent} from './root.component';
import {LogoComponent} from './components/logo/logo.component';
import {DashboardComponent} from './components/dashboard/dashboard.component';
import {SearchComponent} from './components/search/search.component';
import {PageNotFoundComponent} from './components/page-not-found/page-not-found.component';

import {SharedModule} from './shared/shared.module';
import {GraphQLModule} from './graphql.module';
import {AppRoutingModule} from './app-routing.module';

import {Charts4ngModule} from 'charts4ng';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RootComponent,
    LogoComponent,
    DashboardComponent,
    SearchComponent,
    PageNotFoundComponent
  ],
  imports: [
    AppRoutingModule,
    HttpClientModule,
    GraphQLModule,
    Charts4ngModule,
    SharedModule,
  ],
  providers: [],
  bootstrap: [RootComponent]
})
export class AppModule { }
