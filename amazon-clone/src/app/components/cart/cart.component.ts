import { Component, OnInit } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';

interface CartItem {
  id: string;
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  maxQuantity: number;
  inStock: boolean;
  selected: boolean;
  selectedOptions?: { [key: string]: string };
}

interface SavedItem {
  id: string;
  title: string;
  image: string;
  price: number;
}

interface RecentlyViewedItem {
  id: string;
  title: string;
  image: string;
  price: number;
}

interface FrequentlyBoughtItem {
  id: string;
  title: string;
  image: string;
  price: number;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, KeyValuePipe],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  savedItems: SavedItem[] = [];
  recentlyViewed: RecentlyViewedItem[] = [];
  frequentlyBoughtTogether: FrequentlyBoughtItem[] = [];
  isGift: boolean = false;
  allSelected: boolean = false;

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCartData();
    this.loadSampleData();
  }

  loadCartData(): void {
    // Load cart items from service
    const serviceCartItems = this.cartService.getCartItems();
    this.cartItems = serviceCartItems.map(item => ({
      id: item.id,
      title: item.title,
      image: item.image,
      price: item.price,
      originalPrice: item.originalPrice,
      quantity: item.quantity,
      maxQuantity: 10,
      inStock: true,
      selected: true,
      options: item.options
    }));
    
    this.updateAllSelectedState();
  }

  loadSampleData(): void {
    // Sample saved items
    this.savedItems = [
      {
        id: 'saved-1',
        title: 'Wireless Bluetooth Headphones - Saved',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
        price: 79.99
      },
      {
        id: 'saved-2',
        title: 'Smart Fitness Tracker - Saved',
        image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=300&h=300&fit=crop',
        price: 149.99
      }
    ];

    // Sample recently viewed items
    this.recentlyViewed = [
      {
        id: 'recent-1',
        title: 'Laptop Stand Adjustable',
        image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&h=300&fit=crop',
        price: 45.99
      },
      {
        id: 'recent-2',
        title: 'USB-C Hub Multiport',
        image: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=300&h=300&fit=crop',
        price: 29.99
      },
      {
        id: 'recent-3',
        title: 'Wireless Mouse Ergonomic',
        image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=300&h=300&fit=crop',
        price: 24.99
      }
    ];

    // Sample frequently bought together
    this.frequentlyBoughtTogether = [
      {
        id: 'freq-1',
        title: 'Phone Case Clear',
        image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=300&h=300&fit=crop',
        price: 12.99
      },
      {
        id: 'freq-2',
        title: 'Screen Protector Glass',
        image: 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=300&h=300&fit=crop',
        price: 8.99
      }
    ];
  }

  get selectedItems(): CartItem[] {
    return this.cartItems.filter(item => item.selected);
  }

  getSelectedSubtotal(): number {
    return this.selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  toggleSelectAll(): void {
    this.allSelected = !this.allSelected;
    this.cartItems.forEach(item => {
      item.selected = this.allSelected;
    });
  }

  toggleItemSelection(item: CartItem): void {
    item.selected = !item.selected;
    this.updateAllSelectedState();
  }

  updateAllSelectedState(): void {
    this.allSelected = this.cartItems.length > 0 && this.cartItems.every(item => item.selected);
  }

  updateQuantity(item: CartItem, event: any): void {
    const newQuantity = parseInt(event.target.value);
    if (newQuantity > 0 && newQuantity <= item.maxQuantity) {
      item.quantity = newQuantity;
      // Update in cart service
      this.cartService.updateQuantity(item.id, newQuantity);
    }
  }

  getQuantityOptions(maxQuantity: number): number[] {
    return Array.from({ length: Math.min(maxQuantity, 10) }, (_, i) => i + 1);
  }

  removeFromCart(itemId: string): void {
    this.cartItems = this.cartItems.filter(item => item.id !== itemId);
    this.cartService.removeFromCart(itemId);
    this.updateAllSelectedState();
  }

  saveForLater(itemId: string): void {
    const item = this.cartItems.find(item => item.id === itemId);
    if (item) {
      // Move to saved items
      this.savedItems.push({
        id: item.id,
        title: item.title,
        image: item.image,
        price: item.price
      });
      
      // Remove from cart
      this.removeFromCart(itemId);
    }
  }

  shareItem(item: CartItem): void {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: `Check out this item: ${item.title}`,
        url: window.location.origin + `/product/${item.id}`
      });
    } else {
      // Fallback: copy to clipboard
      const url = window.location.origin + `/product/${item.id}`;
      navigator.clipboard.writeText(url).then(() => {
        alert('Product link copied to clipboard!');
      });
    }
  }

  moveToCart(itemId: string): void {
    const savedItem = this.savedItems.find(item => item.id === itemId);
    if (savedItem) {
      // Add to cart
      const cartItem: CartItem = {
        id: savedItem.id,
        title: savedItem.title,
        image: savedItem.image,
        price: savedItem.price,
        quantity: 1,
        maxQuantity: 10,
        inStock: true,
        selected: true
      };
      
      this.cartItems.push(cartItem);
      this.cartService.addToCart({
        id: cartItem.id,
        title: cartItem.title,
        image: cartItem.image,
        price: cartItem.price,
        quantity: cartItem.quantity,
        availability: 'in-stock'
      });
      
      // Remove from saved items
      this.savedItems = this.savedItems.filter(item => item.id !== itemId);
      this.updateAllSelectedState();
    }
  }

  deleteSavedItem(itemId: string): void {
    this.savedItems = this.savedItems.filter(item => item.id !== itemId);
  }

  addToCart(item: FrequentlyBoughtItem): void {
    const cartItem: CartItem = {
      id: item.id,
      title: item.title,
      image: item.image,
      price: item.price,
      quantity: 1,
      maxQuantity: 10,
      inStock: true,
      selected: true
    };
    
    // Check if item already exists in cart
    const existingItem = this.cartItems.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      existingItem.quantity += 1;
      this.cartService.updateQuantity(item.id, existingItem.quantity);
    } else {
      this.cartItems.push(cartItem);
      this.cartService.addToCart({
        id: cartItem.id,
        title: cartItem.title,
        image: cartItem.image,
        price: cartItem.price,
        quantity: cartItem.quantity,
        availability: 'in-stock'
      });
    }
    
    this.updateAllSelectedState();
  }

  proceedToCheckout(): void {
    if (this.selectedItems.length > 0) {
      // Navigate to checkout with selected items
      this.router.navigate(['/checkout'], {
        state: {
          items: this.selectedItems,
          subtotal: this.getSelectedSubtotal(),
          isGift: this.isGift
        }
      });
    }
  }

  trackByItemId(index: number, item: CartItem): string {
    return item.id;
  }
}
