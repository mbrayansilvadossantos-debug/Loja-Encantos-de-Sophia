export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: 'Banho' | 'Conjuntos' | 'Peças' | 'Acessórios' | 'Bebês' | 'Meninas' | 'Meninos';
  description: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface PaymentResult {
  status: string;
  status_detail: string;
  id: number;
  point_of_interaction?: {
    transaction_data?: {
      qr_code: string;
      qr_code_base64: string;
    }
  }
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'client';
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered';
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  createdAt: any; // Firestore Timestamp
  estimatedDeliveryDate?: any; // Firestore Timestamp
}
