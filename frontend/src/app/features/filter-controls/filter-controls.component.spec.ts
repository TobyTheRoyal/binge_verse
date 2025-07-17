import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { FilterControlsComponent } from './filter-controls.component';
import { ContentService } from '../../core/services/content.service';

class ContentServiceMock {
  getGenres = jest.fn().mockReturnValue(of(['Action']));
}

describe('FilterControlsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterControlsComponent],
      providers: [{ provide: ContentService, useClass: ContentServiceMock }]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(FilterControlsComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load genres on init', () => {
    const fixture = TestBed.createComponent(FilterControlsComponent);
    const service = TestBed.inject(ContentService) as any;
    fixture.detectChanges();
    expect(service.getGenres).toHaveBeenCalled();
  });
});