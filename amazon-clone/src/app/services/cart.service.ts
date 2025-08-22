import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CartItem {
  id: string;
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  availability: 'in-stock' | 'out-of-stock' | 'limited';
  options?: { [key: string]: string };
  selected: boolean;
  savings?: number;
}

export interface SavedItem {
  id: string;
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  private savedItemsSubject = new BehaviorSubject<SavedItem[]>([]);
  
  cartItems$ = this.cartItemsSubject.asObservable();
  savedItems$ = this.savedItemsSubject.asObservable();

  constructor() {
    // Load cart from localStorage if available
    this.loadCartFromStorage();
  }

  // Get current cart items
  getCartItems(): CartItem[] {
    return this.cartItemsSubject.value;
  }

  // Get current saved items
  getSavedItems(): SavedItem[] {
    return this.savedItemsSubject.value;
  }

  // Add item to cart
  addToCart(item: Omit<CartItem, 'selected'>): void {
    const currentItems = this.getCartItems();
    const existingItemIndex = currentItems.findIndex(cartItem => 
      cartItem.id === item.id && 
      JSON.stringify(cartItem.options) === JSON.stringify(item.options)
    );

    if (existingItemIndex > -1) {
      // Update quantity if item already exists
      currentItems[existingItemIndex].quantity += item.quantity;
    } else {
      // Add new item
      currentItems.push({ ...item, selected: true });
    }

    this.cartItemsSubject.next(currentItems);
    this.saveCartToStorage();
  }

  // Remove item from cart
  removeFromCart(itemId: string): void {
    const currentItems = this.getCartItems();
    const updatedItems = currentItems.filter(item => item.id !== itemId);
    this.cartItemsSubject.next(updatedItems);
    this.saveCartToStorage();
  }

  // Update item quantity
  updateQuantity(itemId: string, quantity: number): void {
    const currentItems = this.getCartItems();
    const itemIndex = currentItems.findIndex(item => item.id === itemId);
    
    if (itemIndex > -1) {
      if (quantity <= 0) {
        this.removeFromCart(itemId);
      } else {
        currentItems[itemIndex].quantity = quantity;
        this.cartItemsSubject.next(currentItems);
        this.saveCartToStorage();
      }
    }
  }

  // Toggle item selection
  toggleItemSelection(itemId: string): void {
    const currentItems = this.getCartItems();
    const itemIndex = currentItems.findIndex(item => item.id === itemId);
    
    if (itemIndex > -1) {
      currentItems[itemIndex].selected = !currentItems[itemIndex].selected;
      this.cartItemsSubject.next(currentItems);
      this.saveCartToStorage();
    }
  }

  // Select all items
  selectAllItems(): void {
    const currentItems = this.getCartItems();
    const updatedItems = currentItems.map(item => ({ ...item, selected: true }));
    this.cartItemsSubject.next(updatedItems);
    this.saveCartToStorage();
  }

  // Deselect all items
  deselectAllItems(): void {
    const currentItems = this.getCartItems();
    const updatedItems = currentItems.map(item => ({ ...item, selected: false }));
    this.cartItemsSubject.next(updatedItems);
    this.saveCartToStorage();
  }

  // Save item for later
  saveForLater(itemId: string): void {
    const currentItems = this.getCartItems();
    const itemIndex = currentItems.findIndex(item => item.id === itemId);
    
    if (itemIndex > -1) {
      const item = currentItems[itemIndex];
      const savedItem: SavedItem = {
        id: item.id,
        title: item.title,
        image: item.image,
        price: item.price,
        originalPrice: item.originalPrice
      };
      
      // Add to saved items
      const currentSavedItems = this.getSavedItems();
      const existingSavedIndex = currentSavedItems.findIndex(saved => saved.id === itemId);
      
      if (existingSavedIndex === -1) {
        currentSavedItems.push(savedItem);
        this.savedItemsSubject.next(currentSavedItems);
      }
      
      // Remove from cart
      this.removeFromCart(itemId);
      this.saveSavedItemsToStorage();
    }
  }

  // Move item from saved to cart
  moveToCart(savedItemId: string): void {
    const currentSavedItems = this.getSavedItems();
    const savedItemIndex = currentSavedItems.findIndex(item => item.id === savedItemId);
    
    if (savedItemIndex > -1) {
      const savedItem = currentSavedItems[savedItemIndex];
      const cartItem: CartItem = {
        id: savedItem.id,
        title: savedItem.title,
        image: savedItem.image,
        price: savedItem.price,
        originalPrice: savedItem.originalPrice,
        quantity: 1,
        availability: 'in-stock',
        selected: true
      };
      
      // Add to cart
      this.addToCart(cartItem);
      
      // Remove from saved items
      const updatedSavedItems = currentSavedItems.filter(item => item.id !== savedItemId);
      this.savedItemsSubject.next(updatedSavedItems);
      this.saveSavedItemsToStorage();
    }
  }

  // Remove item from saved items
  removeFromSaved(itemId: string): void {
    const currentSavedItems = this.getSavedItems();
    const updatedSavedItems = currentSavedItems.filter(item => item.id !== itemId);
    this.savedItemsSubject.next(updatedSavedItems);
    this.saveSavedItemsToStorage();
  }

  // Get cart totals
  getCartTotals(): { subtotal: number; selectedSubtotal: number; itemCount: number; selectedItemCount: number } {
    const items = this.getCartItems();
    const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const selectedItems = items.filter(item => item.selected);
    const selectedSubtotal = selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    return {
      subtotal,
      selectedSubtotal,
      itemCount: items.length,
      selectedItemCount: selectedItems.length
    };
  }

  // Clear cart
  clearCart(): void {
    this.cartItemsSubject.next([]);
    this.saveCartToStorage();
  }

  // Get cart item count
  getCartItemCount(): number {
    return this.getCartItems().reduce((count, item) => count + item.quantity, 0);
  }

  // Check if item is in cart
  isInCart(itemId: string): boolean {
    return this.getCartItems().some(item => item.id === itemId);
  }

  // Legacy method for backward compatibility
  getCartTotal(): number {
    return this.getCartTotals().subtotal;
  }

  // Private methods for localStorage
  private isLocalStorageAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
    } catch {
      return false;
    }
  }

  private saveCartToStorage(): void {
    if (!this.isLocalStorageAvailable()) return;
    
    try {
      localStorage.setItem('amazon-cart', JSON.stringify(this.getCartItems()));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }

  private saveSavedItemsToStorage(): void {
    if (!this.isLocalStorageAvailable()) return;
    
    try {
      localStorage.setItem('amazon-saved-items', JSON.stringify(this.getSavedItems()));
    } catch (error) {
      console.error('Error saving saved items to localStorage:', error);
    }
  }

  private loadCartFromStorage(): void {
    if (!this.isLocalStorageAvailable()) return;
    
    try {
      const savedCart = localStorage.getItem('amazon-cart');
      const savedItems = localStorage.getItem('amazon-saved-items');
      
      if (savedCart) {
        const cartItems = JSON.parse(savedCart);
        this.cartItemsSubject.next(cartItems);
      }
      
      if (savedItems) {
        const savedItemsList = JSON.parse(savedItems);
        this.savedItemsSubject.next(savedItemsList);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }
}
