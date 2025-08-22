import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService, LoginCredentials, RegisterData } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent implements OnInit {
  loginForm: FormGroup;
  registerForm: FormGroup;
  isLoginMode = true;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.createLoginForm();
    this.registerForm = this.createRegisterForm();
  }

  ngOnInit(): void {
    // Check query params to determine mode
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'register') {
        this.isLoginMode = false;
      }
    });

    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  private createLoginForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  private createRegisterForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.clearMessages();
    this.resetForms();
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  onSubmit(): void {
    if (this.isLoginMode) {
      this.onLogin();
    } else {
      this.onRegister();
    }
  }

  private onLogin(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.clearMessages();
      
      const credentials: LoginCredentials = this.loginForm.value;
      
      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = response.message;
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 1000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Login failed. Please try again.';
        }
      });
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  private onRegister(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.clearMessages();
      
      const registerData: RegisterData = this.registerForm.value;
      
      this.authService.register(registerData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = response.message;
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 1000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Registration failed. Please try again.';
        }
      });
    } else {
      this.markFormGroupTouched(this.registerForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private resetForms(): void {
    this.loginForm.reset();
    this.registerForm.reset();
    this.showPassword = false;
    this.showConfirmPassword = false;
  }

  // Helper methods for template
  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field && field.touched && field.errors) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldDisplayName(fieldName)} must be at least ${requiredLength} characters long`;
      }
      if (field.errors['passwordMismatch']) {
        return 'Passwords do not match';
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'name': 'Name',
      'email': 'Email',
      'password': 'Password',
      'confirmPassword': 'Confirm Password'
    };
    return displayNames[fieldName] || fieldName;
  }

  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.touched && field.errors);
  }
}
