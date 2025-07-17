import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { debugError, debugLog } from '../../../core/utils/logger';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  isFormTouched: boolean = false; // Verfolgt, ob der Benutzer das Formular bearbeitet hat

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.loginForm.reset();
    debugLog('Login form initial state:', this.loginForm.value, 'Valid:', this.loginForm.valid);

    // Verfolge, ob das Formular bearbeitet wurde
    this.loginForm.valueChanges.subscribe(() => {
      this.isFormTouched = true;
      debugLog('Form touched, value:', this.loginForm.value, 'Valid:', this.loginForm.valid);
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      debugLog('Submitting login:', this.loginForm.value);
      this.authService.login(this.loginForm.value).subscribe({
        next: () => this.router.navigate(['/']),
        error: (err) => {
          debugError('Login failed', err);
          this.errorMessage = err.error?.message || 'Login failed. Please check your credentials.';
        },
      });
    }
  }
}