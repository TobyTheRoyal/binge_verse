import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RatingComponent } from './rating.component';
import { AuthService } from '../../core/services/auth.service';

class AuthServiceMock { getToken = () => 'token'; }

describe('RatingComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RatingComponent, HttpClientTestingModule],
      providers: [{ provide: AuthService, useClass: AuthServiceMock }]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(RatingComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});