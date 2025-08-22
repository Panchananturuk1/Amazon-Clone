import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';

interface Product {
  id: number;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviewCount: number;
}

interface Category {
  title: string;
  slug: string;
  products: { name: string; image: string; }[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  currentUser: User | null = null;
  
  // Carousel properties
  currentSlide = 0;
  slides = [0, 1, 2]; // Array representing slide indices
  autoSlideInterval: any;
  autoSlideDelay = 5000; // 5 seconds

  categories: Category[] = [
    {
      title: 'Electronics',
      slug: 'electronics',
      products: [
        { name: 'Laptop', image: 'assets/laptop.svg' },
        { name: 'Smartphone', image: 'assets/smartphone.svg' },
        { name: 'Headphones', image: 'assets/headphones.svg' },
        { name: 'Tablet', image: 'assets/tablet.svg' }
      ]
    },
    {
      title: 'Fashion',
      slug: 'fashion',
      products: [
        { name: 'T-Shirt', image: 'assets/tshirt.svg' },
        { name: 'Jeans', image: 'assets/jeans.svg' },
        { name: 'Sneakers', image: 'assets/sneakers.svg' },
        { name: 'Watch', image: 'assets/watch.svg' }
      ]
    },
    {
      title: 'Home & Kitchen',
      slug: 'home-kitchen',
      products: [
        { name: 'Coffee Maker', image: 'assets/coffee-maker.svg' },
        { name: 'Blender', image: 'assets/blender.svg' },
        { name: 'Air Fryer', image: 'assets/air-fryer.svg' },
        { name: 'Microwave', image: 'assets/microwave.svg' }
      ]
    },
    {
      title: 'Books',
      slug: 'books',
      products: [
        { name: 'Fiction', image: 'assets/book.svg' },
        { name: 'Non-Fiction', image: 'assets/book.svg' },
        { name: 'Textbooks', image: 'assets/book.svg' },
        { name: 'Children', image: 'assets/book.svg' }
      ]
    }
  ];

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to authentication state
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
    });

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  // Carousel methods
  startAutoSlide(): void {
    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, this.autoSlideDelay);
  }

  stopAutoSlide(): void {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  previousSlide(): void {
    this.currentSlide = this.currentSlide === 0 ? this.slides.length - 1 : this.currentSlide - 1;
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    this.stopAutoSlide();
    this.startAutoSlide(); // Restart auto-slide after manual navigation
  }

  navigateToAuth(): void {
    this.router.navigate(['/auth']);
  }

  getUserDisplayName(): string {
    if (this.currentUser) {
      return this.currentUser.name || this.currentUser.email.split('@')[0];
    }
    return '';
  }

  getStars(rating: number): string[] {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('star-filled');
    }
    
    if (hasHalfStar) {
      stars.push('star-half');
    }
    
    while (stars.length < 5) {
      stars.push('star-empty');
    }
    
    return stars;
  }

  featuredProducts: Product[] = [
    {
      id: 1,
      name: 'Apple iPhone 15 Pro',
      image: 'assets/smartphone.svg',
      price: 999,
      originalPrice: 1199,
      discount: 17,
      rating: 4.5,
      reviewCount: 1234
    },
    {
      id: 2,
      name: 'Samsung 65" 4K Smart TV',
      image: 'assets/tablet.svg',
      price: 799,
      originalPrice: 999,
      discount: 20,
      rating: 4.3,
      reviewCount: 856
    },
    {
      id: 3,
      name: 'Sony WH-1000XM5 Headphones',
      image: 'assets/headphones.svg',
      price: 349,
      originalPrice: 399,
      discount: 13,
      rating: 4.7,
      reviewCount: 2341
    },
    {
      id: 4,
      name: 'MacBook Air M2',
      image: 'assets/laptop.svg',
      price: 1199,
      rating: 4.6,
      reviewCount: 987
    }
  ];

  recommendations: Product[] = [
    {
      id: 5,
      name: 'Kindle Paperwhite',
      image: 'assets/tablet.svg',
      price: 139,
      rating: 4.4,
      reviewCount: 3456
    },
    {
      id: 6,
      name: 'Echo Dot (5th Gen)',
      image: 'assets/smartphone.svg',
      price: 49,
      rating: 4.2,
      reviewCount: 5678
    },
    {
      id: 7,
      name: 'Fire TV Stick 4K Max',
      image: 'assets/tablet.svg',
      price: 54,
      rating: 4.5,
      reviewCount: 2890
    },
    {
      id: 8,
      name: 'AirPods Pro (2nd Gen)',
      image: 'assets/headphones.svg',
      price: 249,
      rating: 4.6,
      reviewCount: 1567
    }
  ];

  addToCart(product: Product): void {
    this.cartService.addToCart({
      id: product.id.toString(),
      title: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
      availability: 'in-stock'
    });
  }
}
