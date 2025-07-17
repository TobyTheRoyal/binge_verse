import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { ContentService } from '../core/services/content.service';

class AuthServiceMock {
  logout = jest.fn();
  isLoggedIn() { return of(true); }
}

class ContentServiceMock {
  searchTmdb = jest.fn().mockReturnValue(of([{ tmdbId: '1' }]));
}

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HeaderComponent,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]), // ✅ ersetzt Router-Mock
        ReactiveFormsModule
      ],
      providers: [
        { provide: AuthService, useClass: AuthServiceMock },
        { provide: ContentService, useClass: ContentServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle dropdown', () => {
    component.isDropdownOpen = false;
    component.toggleDropdown();
    expect(component.isDropdownOpen).toBe(true);
    component.toggleDropdown();
    expect(component.isDropdownOpen).toBe(false);
  });

  it('should close dropdown and clear suggestions on document click', () => {
    component.isDropdownOpen = true;
    component.suggestions = [{ tmdbId: '1' } as any];
    const event = { target: document.createElement('div') } as unknown as MouseEvent;
    component.onDocumentClick(event);
    expect(component.isDropdownOpen).toBe(false);
    expect(component.suggestions.length).toBe(0);
  });

  it('should keep dropdown open when clicking inside profile dropdown', () => {
    component.isDropdownOpen = true;
    const el = document.createElement('div');
    el.classList.add('profile-dropdown');
    component.onDocumentClick({ target: el } as unknown as MouseEvent);
    expect(component.isDropdownOpen).toBe(true);
  });

  it('should load suggestions when searching', fakeAsync(() => {
    component.searchControl.setValue('test');
    tick(300);
    expect((component as any).contentService.searchTmdb).toHaveBeenCalledWith('test');
    expect(component.suggestions.length).toBe(1);
  }));

  it('should logout and navigate to login', () => {
    component.isDropdownOpen = true;
    component.logout();
    const auth = TestBed.inject(AuthService) as any;
    expect(auth.logout).toHaveBeenCalled();
    expect(component.isDropdownOpen).toBe(false);
  });
});
