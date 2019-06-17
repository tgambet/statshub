import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {GraphQLModule} from './graphql.module';
import {HttpClientModule} from '@angular/common/http';
import {Charts4ngModule} from '../../projects/charts4ng/src/lib/charts4ng.module';
import {LoginComponent} from './login.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    GraphQLModule,
    HttpClientModule,
    Charts4ngModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
