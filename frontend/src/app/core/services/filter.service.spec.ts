import { TestBed } from '@angular/core/testing';
import { FilterService } from './filter.service';

describe('FilterService', () => {
  it('should update filters', () => {
    TestBed.configureTestingModule({ providers: [FilterService] });
    const service = TestBed.inject(FilterService);
    service.updateFilters({ genres: ['Action'] });
    expect(service.getFilters().genres).toContain('Action');
  });
});