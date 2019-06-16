import { TestBed } from '@angular/core/testing';

import { Charts4ngService } from './charts4ng.service';

describe('Charts4ngService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: Charts4ngService = TestBed.get(Charts4ngService);
    expect(service).toBeTruthy();
  });
});
