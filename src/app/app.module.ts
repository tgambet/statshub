import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {HttpClientModule} from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {GraphQLModule} from './graphql.module';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {LoginComponent} from './login.component';
import {RootComponent} from './root.component';

import {Charts4ngModule} from '@charts4ng/charts4ng.module';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RootComponent
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
  bootstrap: [RootComponent]
})
export class AppModule { }
