import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  searchForm: FormGroup;
  cartItemCount: number = 0;
  isMobileMenuOpen: boolean = false;
  isAccountMenuOpen: boolean = false;
  isLoggedIn: boolean = false;
  currentUser: User | null = null;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      query: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      category: ['all']
    });
  }

  ngOnInit(): void {
    // Subscribe to cart changes
    this.cartService.cartItems$.subscribe(items => {
      this.cartItemCount = items.reduce((total: number, item: any) => total + item.quantity, 0);
    });

    // Subscribe to authentication state
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
    });

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  onSearch(): void {
    if (this.searchForm.valid) {
      const query = this.searchForm.get('query')?.value?.trim();
      const category = this.searchForm.get('category')?.value;
      
      if (query) {
        // Navigate to products page with search query and category
        const queryParams: any = { search: query };
        if (category && category !== 'all') {
          queryParams.category = category;
        }
        
        this.router.navigate(['/products'], { queryParams });
        this.searchForm.get('query')?.setValue('');
      }
    } else {
      // Mark form as touched to show validation errors
      this.searchForm.markAllAsTouched();
    }
  }

  // Helper methods for form validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.searchForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.searchForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return 'Search query is required';
      }
      if (field.errors['minlength']) {
        return 'Search query must be at least 2 characters';
      }
      if (field.errors['maxlength']) {
        return 'Search query cannot exceed 100 characters';
      }
    }
    return '';
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  toggleAccountMenu(): void {
    this.isAccountMenuOpen = !this.isAccountMenuOpen;
  }

  navigateToAuth(): void {
    this.router.navigate(['/auth']);
    this.isAccountMenuOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.isAccountMenuOpen = false;
    this.router.navigate(['/']);
  }

  getUserDisplayName(): string {
    if (this.currentUser) {
      return this.currentUser.name || this.currentUser.email.split('@')[0];
    }
    return '';
  }
}
