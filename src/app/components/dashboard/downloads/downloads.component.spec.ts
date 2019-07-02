import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {DownloadsComponent} from './downloads.component';
import {SharedModule} from '@app/shared/shared.module';
import {Charts4ngModule} from 'charts4ng';
import {RouterTestingModule} from '@angular/router/testing';
import {ApolloTestingModule} from 'apollo-angular/testing';
import {ActivatedRoute, convertToParamMap} from '@angular/router';

describe('DownloadsComponent', () => {
  let component: DownloadsComponent;
  let fixture: ComponentFixture<DownloadsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, ApolloTestingModule, Charts4ngModule, SharedModule],
      declarations: [DownloadsComponent],
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
    fixture = TestBed.createComponent(DownloadsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
