import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ContentService } from './content.service';
import { environment } from '../../../environments/environment';

describe('ContentService', () => {
  let service: ContentService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ContentService]
    });
    service = TestBed.inject(ContentService);
    http = TestBed.inject(HttpTestingController);
  });

  it('should get trending', () => {
    service.getTrending().subscribe();
    const req = http.expectOne(`${environment.apiUrl}/content/trending`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should get top rated', () => {
    service.getTopRated().subscribe();
    const req = http.expectOne(`${environment.apiUrl}/content/top-rated`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should get new releases', () => {
    service.getNewReleases().subscribe();
    const req = http.expectOne(`${environment.apiUrl}/content/new-releases`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should get movies page', () => {
    service.getMoviesPage(2).subscribe();
    const req = http.expectOne(
      r => r.url === `${environment.apiUrl}/content/movies-page` && r.params.get('page') === '2'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should search tmdb', () => {
    service.searchTmdb('test').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/content/search`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.query).toBe('test');
    req.flush([]);
  });

  it('should return empty array for blank search', () => {
    service.searchTmdb(' ').subscribe(res => {
      expect(res).toEqual([]);
    });
    http.expectNone(`${environment.apiUrl}/content/search`);
  });
});