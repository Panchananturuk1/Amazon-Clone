import { Component, OnInit } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';

interface ProductBadge {
  text: string;
  type: string;
}

interface ProductOption {
  name: string;
  values: string[];
}

interface Product {
  id: number;
  title: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  images: string[];
  inStock: boolean;
  seller?: string;
  badges?: ProductBadge[];
  options?: ProductOption[];
  features: string[];
  description: string;
  specifications: { [key: string]: string };
}

interface Review {
  reviewerName: string;
  rating: number;
  title: string;
  content: string;
  date: Date;
  verifiedPurchase: boolean;
  helpfulCount: number;
}

interface RatingBreakdown {
  stars: number;
  percentage: number;
}

interface RelatedProduct {
  id: number;
  title: string;
  price: number;
  rating: number;
  reviewCount: number;
  image: string;
}

interface Tab {
  id: string;
  label: string;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, KeyValuePipe],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  selectedImageIndex = 0;
  selectedQuantity = 1;
  selectedOptions: { [key: string]: string } = {};
  isGift = false;
  showImageModal = false;
  activeTab = 'description';

  tabs: Tab[] = [
    { id: 'description', label: 'Description' },
    { id: 'specifications', label: 'Specifications' },
    { id: 'reviews', label: 'Customer Reviews' }
  ];

  reviews: Review[] = [
    {
      reviewerName: 'John D.',
      rating: 5,
      title: 'Excellent product!',
      content: 'This product exceeded my expectations. Great quality and fast shipping.',
      date: new Date('2024-01-15'),
      verifiedPurchase: true,
      helpfulCount: 12
    },
    {
      reviewerName: 'Sarah M.',
      rating: 4,
      title: 'Good value for money',
      content: 'Works as expected. Minor issues with packaging but overall satisfied.',
      date: new Date('2024-01-10'),
      verifiedPurchase: true,
      helpfulCount: 8
    },
    {
      reviewerName: 'Mike R.',
      rating: 5,
      title: 'Highly recommended',
      content: 'Perfect for my needs. Will definitely buy again.',
      date: new Date('2024-01-05'),
      verifiedPurchase: false,
      helpfulCount: 5
    }
  ];

  ratingBreakdown: RatingBreakdown[] = [
    { stars: 5, percentage: 65 },
    { stars: 4, percentage: 20 },
    { stars: 3, percentage: 10 },
    { stars: 2, percentage: 3 },
    { stars: 1, percentage: 2 }
  ];

  relatedProducts: RelatedProduct[] = [
    {
      id: 2,
      title: 'Similar Product 1',
      price: 89.99,
      rating: 4.3,
      reviewCount: 156,
      image: 'assets/smartphone.svg'
    },
    {
      id: 3,
      title: 'Similar Product 2',
      price: 129.99,
      rating: 4.7,
      reviewCount: 89,
      image: 'assets/tablet.svg'
    },
    {
      id: 4,
      title: 'Similar Product 3',
      price: 79.99,
      rating: 4.1,
      reviewCount: 234,
      image: 'assets/watch.svg'
    },
    {
      id: 5,
      title: 'Similar Product 4',
      price: 159.99,
      rating: 4.8,
      reviewCount: 67,
      image: 'assets/laptop.svg'
    }
  ];

  // Sample product data
  sampleProduct: Product = {
    id: 1,
    title: 'Premium Wireless Bluetooth Headphones with Active Noise Cancellation',
    brand: 'TechAudio',
    category: 'Electronics',
    price: 199.99,
    originalPrice: 299.99,
    rating: 4.5,
    reviewCount: 1247,
    images: [
      'assets/headphones.svg',
      'assets/headphones.svg',
      'assets/headphones.svg',
      'assets/headphones.svg'
    ],
    inStock: true,
    seller: 'TechAudio Official Store',
    badges: [
      { text: 'Amazon\'s Choice', type: 'choice' },
      { text: '33% OFF', type: 'discount' }
    ],
    options: [
      {
        name: 'Color',
        values: ['Black', 'White', 'Silver', 'Blue']
      },
      {
        name: 'Size',
        values: ['Standard', 'Large']
      }
    ],
    features: [
      'Active Noise Cancellation technology blocks external noise',
      'Up to 30 hours of battery life with ANC off',
      'Quick charge: 5 minutes for 3 hours of playback',
      'Premium comfort with memory foam ear cushions',
      'Built-in microphone for hands-free calls',
      'Compatible with Alexa voice control',
      'Foldable design for easy portability'
    ],
    description: `
      <p>Experience premium audio quality with these state-of-the-art wireless headphones. 
      Featuring advanced Active Noise Cancellation technology, these headphones deliver 
      crystal-clear sound while blocking out unwanted background noise.</p>
      
      <p>With up to 30 hours of battery life, you can enjoy your music all day long. 
      The quick charge feature gives you 3 hours of playback with just 5 minutes of charging.</p>
      
      <p>Designed for comfort, these headphones feature memory foam ear cushions and an 
      adjustable headband that provides a perfect fit for extended listening sessions.</p>
    `,
    specifications: {
      'Brand': 'TechAudio',
      'Model': 'TA-WH1000XM5',
      'Type': 'Over-ear',
      'Connectivity': 'Bluetooth 5.2, 3.5mm jack',
      'Battery Life': 'Up to 30 hours',
      'Charging Time': '3 hours (full charge)',
      'Weight': '250g',
      'Frequency Response': '4Hz-40kHz',
      'Impedance': '16 ohms',
      'Driver Size': '40mm',
      'Noise Cancellation': 'Active (ANC)',
      'Microphone': 'Built-in',
      'Voice Assistant': 'Alexa, Google Assistant',
      'Warranty': '2 years'
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    // In a real app, you would get the product ID from the route and fetch the product data
    const productId = this.route.snapshot.paramMap.get('id');
    this.loadProduct(productId);
  }

  loadProduct(productId: string | null): void {
    // For demo purposes, we'll use the sample product
    // In a real app, you would fetch the product from a service
    this.product = this.sampleProduct;
    
    // Initialize selected options with first values
    if (this.product.options) {
      this.product.options.forEach(option => {
        this.selectedOptions[option.name] = option.values[0];
      });
    }
  }

  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  openImageModal(): void {
    this.showImageModal = true;
  }

  closeImageModal(): void {
    this.showImageModal = false;
  }

  selectOption(optionName: string, value: string): void {
    this.selectedOptions[optionName] = value;
  }

  getQuantityOptions(): number[] {
    return Array.from({ length: 10 }, (_, i) => i + 1);
  }

  getStars(rating: number): boolean[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating);
    }
    return stars;
  }

  getDiscountPercentage(): number {
    if (!this.product?.originalPrice) return 0;
    return Math.round(((this.product.originalPrice - this.product.price) / this.product.originalPrice) * 100);
  }

  getDeliveryDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getTomorrowDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getReturnDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    });
  }

  addToCart(): void {
    if (!this.product) return;
    
    const cartItem = {
      id: this.product.id.toString(),
      title: this.product.title,
      price: this.product.price,
      image: this.product.images[0],
      quantity: this.selectedQuantity,
      availability: 'in-stock' as const,
      options: { ...this.selectedOptions }
    };
    
    this.cartService.addToCart(cartItem);
    alert('Product added to cart!');
  }

  buyNow(): void {
    this.addToCart();
    this.router.navigate(['/cart']);
  }

  addToWishlist(): void {
    // Implement wishlist functionality
    alert('Product added to wishlist!');
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  getSavingsAmount(): string {
    if (this.product?.originalPrice && this.product?.price) {
      return (this.product.originalPrice - this.product.price).toFixed(2);
    }
    return '0.00';
  }
}
