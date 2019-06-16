import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Charts4ngComponent } from './charts4ng.component';

describe('Charts4ngComponent', () => {
  let component: Charts4ngComponent;
  let fixture: ComponentFixture<Charts4ngComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Charts4ngComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Charts4ngComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
