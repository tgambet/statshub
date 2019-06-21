import {NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';

import {AppComponent} from './components/app/app.component';
import {LoginComponent} from './components/login/login.component';
import {RootComponent} from './root.component';
import {LogoComponent} from './components/logo/logo.component';
import {DashboardComponent} from './components/dashboard/dashboard.component';
import {SearchComponent} from './components/search/search.component';
import {PageNotFoundComponent} from './components/page-not-found/page-not-found.component';
import {InformationComponent} from './components/dashboard/information/information.component';
import {ParentComponent} from './components/dashboard/parent/parent.component';
import {IssuesComponent} from './components/dashboard/issues/issues.component';
import {LabelsComponent} from './components/dashboard/labels/labels.component';
import {PopularityComponent} from './components/dashboard/popularity/popularity.component';
import {DownloadsComponent} from './components/dashboard/downloads/downloads.component';
import {FilesComponent} from './components/dashboard/files/files.component';
import {CalendarComponent} from './components/dashboard/calendar/calendar.component';

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
    PageNotFoundComponent,
    InformationComponent,
    ParentComponent,
    IssuesComponent,
    LabelsComponent,
    PopularityComponent,
    DownloadsComponent,
    FilesComponent,
    CalendarComponent
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
