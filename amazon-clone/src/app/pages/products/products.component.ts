import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CartService } from '../../services/cart.service';

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  category: string;
  brand: string;
  discount: number;
  isAmazonChoice?: boolean;
  isBestseller?: boolean;
  freeShipping: boolean;
  inStock: boolean;
}

interface Category {
  name: string;
  count: number;
}

interface Brand {
  name: string;
  count: number;
}

interface PriceRange {
  label: string;
  value: string;
  min: number;
  max: number;
}

interface RatingFilter {
  value: number;
  label: string;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit {
  // Forms
  priceFilterForm: FormGroup;
  brandSearchForm: FormGroup;
  
  // Search and filters
  searchQuery: string = '';
  selectedCategory: string = '';
  selectedCategories: string[] = [];
  selectedBrands: string[] = [];
  selectedRatings: number[] = [];
  availabilityFilters = { inStock: false };
  
  // Sorting and pagination
  sortBy: string = 'relevance';
  currentPage: number = 1;
  itemsPerPage: number = 16;
  
  // Data
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  paginatedProducts: Product[] = [];
  categories: Category[] = [];
  brands: Brand[] = [];
  filteredBrands: Brand[] = [];
  
  // Filter options
  priceRanges: PriceRange[] = [
    { label: 'Under $25', value: 'under-25', min: 0, max: 25 },
    { label: '$25 to $50', value: '25-50', min: 25, max: 50 },
    { label: '$50 to $100', value: '50-100', min: 50, max: 100 },
    { label: '$100 to $200', value: '100-200', min: 100, max: 200 },
    { label: '$200 & Above', value: '200-above', min: 200, max: 99999 }
  ];
  
  ratingFilters: RatingFilter[] = [
    { value: 4, label: '4 Stars & Up' },
    { value: 3, label: '3 Stars & Up' },
    { value: 2, label: '2 Stars & Up' },
    { value: 1, label: '1 Star & Up' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService,
    private fb: FormBuilder
  ) {
    this.priceFilterForm = this.fb.group({
      min: [null, [Validators.min(0), Validators.max(9999)]],
      max: [null, [Validators.min(0), Validators.max(9999)]]
    }, { validators: this.priceRangeValidator });
    
    this.brandSearchForm = this.fb.group({
      query: ['', [Validators.maxLength(50)]]
    });
  }

  ngOnInit(): void {
    this.initializeProducts();
    this.setupCategories();
    this.setupBrands();
    
    // Handle route parameters
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['search'] || '';
      this.selectedCategory = params['category'] || '';
      this.applyFilters();
    });
  }

  private initializeProducts(): void {
    // Sample product data - in a real app, this would come from a service
    this.allProducts = [
      {
        id: 1,
        name: 'Apple iPhone 15 Pro Max, 256GB, Natural Titanium',
        price: 1199,
        originalPrice: 1299,
        image: 'assets/smartphone.svg',
        rating: 4.5,
        reviewCount: 2847,
        category: 'Electronics',
        brand: 'Apple',
        discount: 8,
        isAmazonChoice: true,
        freeShipping: true,
        inStock: true
      },
      {
        id: 2,
        name: 'Samsung Galaxy S24 Ultra, 512GB, Titanium Black',
        price: 1299,
        originalPrice: 1399,
        image: 'assets/smartphone.svg',
        rating: 4.3,
        reviewCount: 1923,
        category: 'Electronics',
        brand: 'Samsung',
        discount: 7,
        isBestseller: true,
        freeShipping: true,
        inStock: true
      },
      {
        id: 3,
        name: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
        price: 349,
        originalPrice: 399,
        image: 'assets/headphones.svg',
        rating: 4.7,
        reviewCount: 5632,
        category: 'Electronics',
        brand: 'Sony',
        discount: 13,
        isAmazonChoice: true,
        freeShipping: true,
        inStock: true
      },
      {
        id: 4,
        name: 'Nike Air Max 270 Running Shoes',
        price: 129,
        originalPrice: 150,
        image: 'assets/sneakers.svg',
        rating: 4.2,
        reviewCount: 3421,
        category: 'Shoes',
        brand: 'Nike',
        discount: 14,
        freeShipping: true,
        inStock: true
      },
      {
        id: 5,
        name: 'Adidas Ultraboost 22 Running Shoes',
        price: 179,
        originalPrice: 190,
        image: 'assets/sneakers.svg',
        rating: 4.4,
        reviewCount: 2156,
        category: 'Shoes',
        brand: 'Adidas',
        discount: 6,
        freeShipping: true,
        inStock: false
      },
      {
        id: 6,
        name: 'Levi\'s 501 Original Fit Jeans',
        price: 59,
        originalPrice: 69,
        image: 'assets/jeans.svg',
        rating: 4.1,
        reviewCount: 8934,
        category: 'Clothing',
        brand: 'Levi\'s',
        discount: 14,
        freeShipping: true,
        inStock: true
      },
      {
        id: 7,
        name: 'MacBook Pro 16-inch, M3 Pro chip, 512GB SSD',
        price: 2499,
        originalPrice: 2699,
        image: 'assets/laptop.svg',
        rating: 4.6,
        reviewCount: 1234,
        category: 'Electronics',
        brand: 'Apple',
        discount: 7,
        isBestseller: true,
        freeShipping: true,
        inStock: true
      },
      {
        id: 8,
        name: 'Amazon Echo Dot (5th Gen) Smart Speaker',
        price: 49,
        originalPrice: 59,
        image: 'assets/smartphone.svg',
        rating: 4.3,
        reviewCount: 15678,
        category: 'Electronics',
        brand: 'Amazon',
        discount: 17,
        isAmazonChoice: true,
        freeShipping: true,
        inStock: true
      },
      {
        id: 9,
        name: 'The North Face Venture 2 Jacket',
        price: 99,
        originalPrice: 120,
        image: 'assets/tshirt.svg',
        rating: 4.0,
        reviewCount: 2567,
        category: 'Clothing',
        brand: 'The North Face',
        discount: 18,
        freeShipping: true,
        inStock: true
      },
      {
        id: 10,
        name: 'Kindle Paperwhite (11th Generation)',
        price: 139,
        originalPrice: 149,
        image: 'assets/tablet.svg',
        rating: 4.5,
        reviewCount: 9876,
        category: 'Electronics',
        brand: 'Amazon',
        discount: 7,
        freeShipping: true,
        inStock: true
      },
      {
        id: 11,
        name: 'Instant Pot Duo 7-in-1 Electric Pressure Cooker',
        price: 79,
        originalPrice: 99,
        image: 'assets/coffee-maker.svg',
        rating: 4.4,
        reviewCount: 12345,
        category: 'Home & Kitchen',
        brand: 'Instant Pot',
        discount: 20,
        isAmazonChoice: true,
        freeShipping: true,
        inStock: true
      },
      {
        id: 12,
        name: 'Fitbit Charge 5 Advanced Fitness Tracker',
        price: 149,
        originalPrice: 179,
        image: 'assets/watch.svg',
        rating: 4.2,
        reviewCount: 4567,
        category: 'Electronics',
        brand: 'Fitbit',
        discount: 17,
        freeShipping: true,
        inStock: true
      }
    ];
  }

  private setupCategories(): void {
    const categoryMap = new Map<string, number>();
    this.allProducts.forEach(product => {
      categoryMap.set(product.category, (categoryMap.get(product.category) || 0) + 1);
    });
    
    this.categories = Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }));
  }

  private setupBrands(): void {
    const brandMap = new Map<string, number>();
    this.allProducts.forEach(product => {
      brandMap.set(product.brand, (brandMap.get(product.brand) || 0) + 1);
    });
    
    this.brands = Array.from(brandMap.entries()).map(([name, count]) => ({ name, count }));
    this.filteredBrands = [...this.brands];
  }

  // Filter methods
  onCategoryFilter(event: any): void {
    const category = event.target.value;
    if (event.target.checked) {
      this.selectedCategories.push(category);
    } else {
      this.selectedCategories = this.selectedCategories.filter(c => c !== category);
    }
    this.applyFilters();
  }

  onBrandFilter(event: any): void {
    const brand = event.target.value;
    if (event.target.checked) {
      this.selectedBrands.push(brand);
    } else {
      this.selectedBrands = this.selectedBrands.filter(b => b !== brand);
    }
    this.applyFilters();
  }

  onRatingFilter(event: any): void {
    const rating = parseInt(event.target.value);
    if (event.target.checked) {
      this.selectedRatings.push(rating);
    } else {
      this.selectedRatings = this.selectedRatings.filter(r => r !== rating);
    }
    this.applyFilters();
  }

  onPriceFilter(): void {
    if (this.priceFilterForm.valid) {
      this.currentPage = 1;
      this.applyFilters();
    } else {
      this.priceFilterForm.markAllAsTouched();
    }
  }

  onPriceRangeFilter(range: PriceRange): void {
    this.priceFilterForm.patchValue({
      min: range.min,
      max: range.max
    });
    this.applyFilters();
  }

  onAvailabilityFilter(type: string, event: any): void {
    this.availabilityFilters.inStock = event.target.checked;
    this.applyFilters();
  }

  filterBrands(): void {
    if (this.brandSearchForm.valid) {
      const query = this.brandSearchForm.get('query')?.value?.trim() || '';
      if (!query) {
        this.filteredBrands = [...this.brands];
      } else {
        this.filteredBrands = this.brands.filter(brand => 
          brand.name.toLowerCase().includes(query.toLowerCase())
        );
      }
    }
  }

  // Remove filter methods
  removeCategoryFilter(category: string): void {
    this.selectedCategories = this.selectedCategories.filter(c => c !== category);
    this.applyFilters();
  }

  removeBrandFilter(brand: string): void {
    this.selectedBrands = this.selectedBrands.filter(b => b !== brand);
    this.applyFilters();
  }

  removeRatingFilter(rating: number): void {
    this.selectedRatings = this.selectedRatings.filter(r => r !== rating);
    this.applyFilters();
  }

  clearAllFilters(): void {
    this.selectedCategories = [];
    this.selectedBrands = [];
    this.selectedRatings = [];
    this.priceFilterForm.reset();
    this.brandSearchForm.reset();
    this.availabilityFilters = { inStock: false };
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    const priceMin = this.priceFilterForm.get('min')?.value;
    const priceMax = this.priceFilterForm.get('max')?.value;
    return this.selectedCategories.length > 0 || 
           this.selectedBrands.length > 0 || 
           this.selectedRatings.length > 0 ||
           priceMin !== null || 
           priceMax !== null ||
           this.availabilityFilters.inStock;
  }

  // Sorting
  onSortChange(): void {
    this.sortProducts();
    this.updatePagination();
  }

  private sortProducts(): void {
    switch (this.sortBy) {
      case 'price-low':
        this.filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        this.filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        this.filteredProducts.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        this.filteredProducts.sort((a, b) => b.id - a.id);
        break;
      default: // relevance
        this.filteredProducts.sort((a, b) => {
          // Prioritize Amazon's Choice and Bestsellers
          if (a.isAmazonChoice && !b.isAmazonChoice) return -1;
          if (!a.isAmazonChoice && b.isAmazonChoice) return 1;
          if (a.isBestseller && !b.isBestseller) return -1;
          if (!a.isBestseller && b.isBestseller) return 1;
          return b.rating - a.rating;
        });
    }
  }

  // Main filter application
  private applyFilters(): void {
    this.filteredProducts = this.allProducts.filter(product => {
      // Search query filter
      if (this.searchQuery && !product.name.toLowerCase().includes(this.searchQuery.toLowerCase())) {
        return false;
      }

      // Category filter
      if (this.selectedCategory && product.category !== this.selectedCategory) {
        return false;
      }

      if (this.selectedCategories.length > 0 && !this.selectedCategories.includes(product.category)) {
        return false;
      }

      // Brand filter
      if (this.selectedBrands.length > 0 && !this.selectedBrands.includes(product.brand)) {
        return false;
      }

      // Rating filter
      if (this.selectedRatings.length > 0 && !this.selectedRatings.some(rating => product.rating >= rating)) {
        return false;
      }

      // Price filter
      const priceMin = this.priceFilterForm.get('min')?.value;
      const priceMax = this.priceFilterForm.get('max')?.value;
      if (priceMin !== null && product.price < priceMin) {
        return false;
      }
      if (priceMax !== null && product.price > priceMax) {
        return false;
      }

      // Availability filter
      if (!this.availabilityFilters.inStock && !product.inStock) {
        return false;
      }

      return true;
    });

    this.sortProducts();
    this.currentPage = 1;
    this.updatePagination();
  }

  // Pagination
  private updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.updatePagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getVisiblePages(): number[] {
    const totalPages = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(totalPages);
      } else if (current >= totalPages - 3) {
        pages.push(1);
        pages.push(-1); // ellipsis
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1); // ellipsis
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(totalPages);
      }
    }

    return pages;
  }

  // Utility methods
  getStars(rating: number): boolean[] {
    const stars: boolean[] = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating);
    }
    return stars;
  }

  getDeliveryDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  addToCart(product: Product): void {
    this.cartService.addToCart({
      id: product.id.toString(),
      title: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
      availability: 'in-stock' as const
    });
    console.log('Added to cart:', product);
  }

  addToWishlist(product: Product): void {
    // Implement wishlist functionality
    console.log('Added to wishlist:', product.name);
  }

  // Getters
  get totalProducts(): number {
    return this.filteredProducts.length;
  }

  get totalPages(): number {
    return Math.ceil(this.totalProducts / this.itemsPerPage);
  }

  get startIndex(): number {
    return this.totalProducts === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endIndex(): number {
    const end = this.currentPage * this.itemsPerPage;
    return end > this.totalProducts ? this.totalProducts : end;
  }

  // Custom validator for price range
  private priceRangeValidator(group: FormGroup) {
    const min = group.get('min')?.value;
    const max = group.get('max')?.value;
    
    if (min !== null && max !== null && min > max) {
      return { priceRangeInvalid: true };
    }
    return null;
  }

  // Helper methods for form validation
  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return `${fieldName} is required`;
      }
      if (field.errors['min']) {
        return `${fieldName} must be at least ${field.errors['min'].min}`;
      }
      if (field.errors['max']) {
        return `${fieldName} cannot exceed ${field.errors['max'].max}`;
      }
      if (field.errors['maxlength']) {
        return `${fieldName} cannot exceed ${field.errors['maxlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  isPriceRangeInvalid(): boolean {
    return !!(this.priceFilterForm.errors?.['priceRangeInvalid'] && 
             (this.priceFilterForm.get('min')?.touched || this.priceFilterForm.get('max')?.touched));
  }

  getPriceRangeError(): string {
    if (this.isPriceRangeInvalid()) {
      return 'Minimum price cannot be greater than maximum price';
    }
    return '';
  }
}
