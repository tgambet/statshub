import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {PopularityComponent} from './popularity.component';
import {Charts4ngModule} from 'charts4ng';
import {SharedModule} from '@app/shared/shared.module';
import {RouterTestingModule} from '@angular/router/testing';
import {ApolloTestingModule} from 'apollo-angular/testing';
import {ActivatedRoute, convertToParamMap} from '@angular/router';

describe('PopularityComponent', () => {
  let component: PopularityComponent;
  let fixture: ComponentFixture<PopularityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, ApolloTestingModule, Charts4ngModule, SharedModule],
      declarations: [ PopularityComponent ],
      providers: [{
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: convertToParamMap({
              user: 'angular',
              repo: 'angular'
            })
          }
        }
      }]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopularityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
