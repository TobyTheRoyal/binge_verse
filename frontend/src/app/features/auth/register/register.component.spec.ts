import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

describe('RegisterComponent', () => {
  let authServiceMock: jest.Mocked<AuthService>;

  beforeEach(async () => {
    authServiceMock = {
        register: jest.fn().mockReturnValue(of({ access_token: 'dummy-token' }))
    } as unknown as jest.Mocked<AuthService>;
    await TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
        { provide: FormBuilder, useValue: new FormBuilder() }
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should submit register form and call AuthService', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.registerForm.setValue({
      username: 'testuser',
      email: 'test@example.com',
      password: 'secure123'
    });

    component.onSubmit();

    expect(authServiceMock.register).toHaveBeenCalledWith({
      username: 'testuser',
      email: 'test@example.com',
      password: 'secure123'
    });
  });

  it('should navigate to / after successful registration', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate');


    fixture.detectChanges();

    component.registerForm.setValue({
      username: 'testuser',
      email: 'test@example.com',
      password: 'secure123'
    });

    component.onSubmit();

    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
