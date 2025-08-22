import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';

interface CheckoutItem {
  id: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  selected: boolean;
}

interface Address {
  id?: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phoneNumber: string;
  isDefault?: boolean;
}

interface PaymentMethod {
  id?: string;
  type: 'credit' | 'debit' | 'paypal' | 'amazon-pay';
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  cardholderName?: string;
  isDefault?: boolean;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit {
  checkoutItems: CheckoutItem[] = [];
  subtotal: number = 0;
  shipping: number = 0;
  tax: number = 0;
  total: number = 0;
  isGift: boolean = false;
  
  // Forms
  addressForm: FormGroup;
  paymentForm: FormGroup;
  
  // User data
  currentUser: User | null = null;
  isLoggedIn: boolean = false;
  
  // Saved data
  savedAddresses: Address[] = [];
  savedPaymentMethods: PaymentMethod[] = [];
  
  // UI state
  selectedAddressId: string | null = null;
  selectedPaymentId: string | null = null;
  showAddressForm: boolean = false;
  showPaymentForm: boolean = false;
  isProcessingOrder: boolean = false;
  
  // Delivery options
  deliveryOptions = [
    { id: 'standard', name: 'Standard Delivery', price: 0, days: '5-7 business days' },
    { id: 'express', name: 'Express Delivery', price: 9.99, days: '2-3 business days' },
    { id: 'overnight', name: 'Overnight Delivery', price: 19.99, days: '1 business day' }
  ];
  selectedDeliveryOption = 'standard';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.addressForm = this.createAddressForm();
    this.paymentForm = this.createPaymentForm();
    
    // Get checkout data from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.checkoutItems = navigation.extras.state['items'] || [];
      this.subtotal = navigation.extras.state['subtotal'] || 0;
      this.isGift = navigation.extras.state['isGift'] || false;
    }
  }

  ngOnInit(): void {
    // Subscribe to authentication state
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
      if (!isLoggedIn) {
        // Redirect to auth if not logged in
        this.router.navigate(['/auth'], { queryParams: { returnUrl: '/checkout' } });
      }
    });

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    this.loadSavedData();
    this.calculateTotals();
  }

  createAddressForm(): FormGroup {
    return this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      addressLine1: ['', [Validators.required, Validators.minLength(5)]],
      addressLine2: [''],
      city: ['', [Validators.required, Validators.minLength(2)]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]],
      country: ['United States', [Validators.required]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]],
      isDefault: [false]
    });
  }

  createPaymentForm(): FormGroup {
    return this.fb.group({
      type: ['credit', [Validators.required]],
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{13,19}$/)]],
      expiryMonth: ['', [Validators.required, Validators.min(1), Validators.max(12)]],
      expiryYear: ['', [Validators.required, Validators.min(new Date().getFullYear())]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      cardholderName: ['', [Validators.required, Validators.minLength(2)]],
      isDefault: [false]
    });
  }

  loadSavedData(): void {
    // Load saved addresses and payment methods
    // In a real app, this would come from a service
    this.savedAddresses = [
      {
        id: '1',
        fullName: 'John Doe',
        addressLine1: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'United States',
        phoneNumber: '+1234567890',
        isDefault: true
      }
    ];
    
    this.savedPaymentMethods = [
      {
        id: '1',
        type: 'credit',
        cardNumber: '****-****-****-1234',
        expiryMonth: '12',
        expiryYear: '2025',
        cardholderName: 'John Doe',
        isDefault: true
      }
    ];
    
    // Select default options
    const defaultAddress = this.savedAddresses.find(addr => addr.isDefault);
    if (defaultAddress) {
      this.selectedAddressId = defaultAddress.id!;
    }
    
    const defaultPayment = this.savedPaymentMethods.find(pm => pm.isDefault);
    if (defaultPayment) {
      this.selectedPaymentId = defaultPayment.id!;
    }
  }

  calculateTotals(): void {
    const selectedDelivery = this.deliveryOptions.find(opt => opt.id === this.selectedDeliveryOption);
    this.shipping = selectedDelivery ? selectedDelivery.price : 0;
    this.tax = this.subtotal * 0.08; // 8% tax rate
    this.total = this.subtotal + this.shipping + this.tax;
  }

  onDeliveryOptionChange(): void {
    this.calculateTotals();
  }

  selectAddress(addressId: string): void {
    this.selectedAddressId = addressId;
    this.showAddressForm = false;
  }

  selectPaymentMethod(paymentId: string): void {
    this.selectedPaymentId = paymentId;
    this.showPaymentForm = false;
  }

  toggleAddressForm(): void {
    this.showAddressForm = !this.showAddressForm;
    if (this.showAddressForm) {
      this.addressForm.reset();
    }
  }

  togglePaymentForm(): void {
    this.showPaymentForm = !this.showPaymentForm;
    if (this.showPaymentForm) {
      this.paymentForm.reset({ type: 'credit' });
    }
  }

  saveAddress(): void {
    if (this.addressForm.valid) {
      const newAddress: Address = {
        id: Date.now().toString(),
        ...this.addressForm.value
      };
      
      this.savedAddresses.push(newAddress);
      this.selectedAddressId = newAddress.id!;
      this.showAddressForm = false;
      this.addressForm.reset();
    }
  }

  savePaymentMethod(): void {
    if (this.paymentForm.valid) {
      const formValue = this.paymentForm.value;
      const newPayment: PaymentMethod = {
        id: Date.now().toString(),
        type: formValue.type,
        cardNumber: `****-****-****-${formValue.cardNumber.slice(-4)}`,
        expiryMonth: formValue.expiryMonth,
        expiryYear: formValue.expiryYear,
        cardholderName: formValue.cardholderName,
        isDefault: formValue.isDefault
      };
      
      this.savedPaymentMethods.push(newPayment);
      this.selectedPaymentId = newPayment.id!;
      this.showPaymentForm = false;
      this.paymentForm.reset({ type: 'credit' });
    }
  }

  placeOrder(): void {
    if (!this.selectedAddressId || !this.selectedPaymentId) {
      alert('Please select both delivery address and payment method.');
      return;
    }
    
    this.isProcessingOrder = true;
    
    // Simulate order processing
    setTimeout(() => {
      this.isProcessingOrder = false;
      // Navigate to order confirmation
      this.router.navigate(['/order-confirmation'], {
        state: {
          orderNumber: this.generateOrderNumber(),
          items: this.checkoutItems,
          total: this.total,
          deliveryAddress: this.savedAddresses.find(addr => addr.id === this.selectedAddressId),
          estimatedDelivery: this.getEstimatedDeliveryDate()
        }
      });
    }, 2000);
  }

  generateOrderNumber(): string {
    return `AMZ-${Date.now().toString().slice(-8)}`;
  }

  getEstimatedDeliveryDate(): string {
    const selectedOption = this.deliveryOptions.find(opt => opt.id === this.selectedDeliveryOption);
    const days = selectedOption?.id === 'standard' ? 7 : selectedOption?.id === 'express' ? 3 : 1;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + days);
    return deliveryDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['minlength']) return `${fieldName} is too short`;
      if (field.errors['pattern']) return `${fieldName} format is invalid`;
      if (field.errors['min']) return `${fieldName} value is too low`;
      if (field.errors['max']) return `${fieldName} value is too high`;
    }
    return '';
  }

  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.errors && field.touched);
  }
}