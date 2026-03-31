import React from 'react';
import { ShoppingCart, Heart, Instagram, MessageCircle, Menu, X, Star, Cloud, Sun, User as UserIcon, LogOut, Package, CheckCircle, Clock, Truck, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CartItem, UserProfile, Order } from './types';
import { PRODUCTS } from './constants';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  updateDoc,
  Timestamp,
  handleFirestoreError,
  OperationType
} from './firebase';
import { getEstimatedDeliveryDate } from './utils/delivery';

// --- Components ---

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: string | null;
}

class AppErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorInfo: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-[2rem] shadow-xl text-center space-y-4 border border-red-100">
            <X size={48} className="mx-auto text-red-500" />
            <h2 className="text-2xl font-display text-red-600">Ops! Algo deu errado.</h2>
            <p className="text-gray-600">Ocorreu um erro inesperado na aplicação.</p>
            <div className="bg-gray-100 p-4 rounded-xl text-xs font-mono text-left overflow-auto max-h-40">
              {this.state.errorInfo}
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const Navbar = ({ 
  cartCount, 
  onOpenCart, 
  user, 
  onLogin, 
  onLogout,
  onViewOrders,
  onViewAdmin,
  onViewProfile
}: { 
  cartCount: number, 
  onOpenCart: () => void,
  user: UserProfile | null,
  onLogin: () => void,
  onLogout: () => void,
  onViewOrders: () => void,
  onViewAdmin: () => void,
  onViewProfile: () => void
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pastel-pink/30 px-4 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img 
            src="/LOGO.webp" 
            alt="Os Encantos de Sophia Logo" 
            className="w-12 h-12 object-contain"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-2xl font-display text-gray-800 tracking-tight">
            Os Encantos de <span className="text-pink-400">Sophia</span>
          </h1>
        </div>
        
        <div className="hidden md:flex gap-8 font-medium text-gray-600 items-center">
          <a href="#" className="hover:text-pink-400 transition-colors">Início</a>
          <a href="#produtos" className="hover:text-pink-400 transition-colors">Produtos</a>
          <a href="#contato" className="hover:text-pink-400 transition-colors">Contato</a>
          
          {user ? (
            <div className="relative group">
              <button className="flex items-center gap-2 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                {user.displayName.split(' ')[0]}
                <UserIcon size={20} className="text-gray-600" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button onClick={onViewProfile} className="w-full text-left px-4 py-2 hover:bg-pink-50 flex items-center gap-2">
                  <UserIcon size={18} /> Meu Perfil
                </button>
                <button onClick={onViewOrders} className="w-full text-left px-4 py-2 hover:bg-pink-50 flex items-center gap-2">
                  <Package size={18} /> Meus Pedidos
                </button>
                {user.role === 'admin' && (
                  <button onClick={onViewAdmin} className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-2 text-blue-600">
                    <Star size={18} /> Painel Admin
                  </button>
                )}
                <button onClick={onLogout} className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-500">
                  <LogOut size={18} /> Sair
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={onLogin}
              className="px-6 py-2 bg-pastel-pink text-gray-800 font-bold rounded-full hover:bg-pink-300 transition-all shadow-sm flex items-center gap-2"
            >
              <UserIcon size={18} /> Entrar
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={onOpenCart}
            className="relative p-2 bg-pastel-blue/20 rounded-full hover:bg-pastel-blue/40 transition-colors"
          >
            <ShoppingCart size={24} className="text-blue-500" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-pink-400 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>
          
          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="flex flex-col p-4 space-y-4">
              <a href="#" className="font-bold text-gray-700">Início</a>
              <a href="#produtos" className="font-bold text-gray-700">Produtos</a>
              <a href="#contato" className="font-bold text-gray-700">Contato</a>
              {user ? (
                <>
                  <button onClick={onViewProfile} className="font-bold text-gray-700 text-left">Meu Perfil</button>
                  <button onClick={onViewOrders} className="font-bold text-gray-700 text-left">Meus Pedidos</button>
                  {user.role === 'admin' && <button onClick={onViewAdmin} className="font-bold text-blue-600 text-left">Painel Admin</button>}
                  <button onClick={onLogout} className="font-bold text-red-500 text-left">Sair</button>
                </>
              ) : (
                <button onClick={onLogin} className="font-bold text-pink-500 text-left">Entrar</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-gray-50 pt-16 pb-8 border-t border-gray-100">
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Star className="text-pink-400 fill-pink-400" size={24} />
          <h2 className="text-2xl font-display">Os Encantos de Sophia</h2>
        </div>
        <p className="text-gray-500 leading-relaxed">
          Levando encanto, conforto e muito estilo para o guarda-roupa dos seus pequenos. 
          Cada peça é escolhida com amor e carinho.
        </p>
      </div>
      
      <div>
        <h3 className="font-bold text-lg mb-6">Siga-nos</h3>
        <div className="flex gap-4">
          <a href="#" className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-500 hover:bg-pink-500 hover:text-white transition-all">
            <Instagram size={20} />
          </a>
          <a href="#" className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-500 hover:bg-green-500 hover:text-white transition-all">
            <MessageCircle size={20} />
          </a>
        </div>
        <div className="mt-8">
          <p className="text-sm text-gray-400">© 2026 Os Encantos de Sophia. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  </footer>
);

const ProductCard = ({ product, onAddToCart, onBuyNow }: { product: Product, onAddToCart: (p: Product) => void, onBuyNow: (p: Product) => void, key?: string }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 group"
  >
    <div className="relative aspect-square overflow-hidden">
      <img 
        src={product.image} 
        alt={product.name} 
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        referrerPolicy="no-referrer"
      />
      <div className="absolute top-4 right-4">
        <button className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-pink-400 hover:bg-pink-400 hover:text-white transition-colors shadow-sm">
          <Heart size={18} />
        </button>
      </div>
      <div className="absolute bottom-4 left-4">
        <span className="px-3 py-1 bg-pastel-yellow text-gray-700 text-xs font-bold rounded-full shadow-sm">
          {product.category}
        </span>
      </div>
    </div>
    
    <div className="p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-1">{product.name}</h3>
      <p className="text-gray-500 text-sm mb-4 line-clamp-2">{product.description}</p>
      
      <div className="flex items-center justify-between mb-6">
        <span className="text-2xl font-display text-pink-500">R$ {product.price.toFixed(2)}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => onAddToCart(product)}
          className="py-2.5 px-2 bg-pastel-blue/20 text-blue-600 font-bold rounded-xl hover:bg-pastel-blue/40 transition-colors text-sm"
        >
          Carrinho
        </button>
        <button 
          onClick={() => onBuyNow(product)}
          className="py-2.5 px-2 bg-pastel-pink text-gray-800 font-bold rounded-xl hover:bg-pink-300 transition-colors text-sm shadow-sm"
        >
          Comprar
        </button>
      </div>
    </div>
  </motion.div>
);

const CartDrawer = ({ 
  isOpen, 
  onClose, 
  items, 
  onUpdateQuantity, 
  onRemove,
  onCheckout
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  items: CartItem[],
  onUpdateQuantity: (id: string, delta: number) => void,
  onRemove: (id: string) => void,
  onCheckout: () => void
}) => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-pastel-pink/10">
              <h2 className="text-2xl font-display flex items-center gap-2">
                <ShoppingCart size={24} className="text-pink-400" />
                Seu Carrinho
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                  <Cloud size={64} className="opacity-20" />
                  <p>Seu carrinho está vazio...</p>
                  <button onClick={onClose} className="text-pink-400 font-bold hover:underline">Continuar comprando</button>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="flex gap-4 bg-gray-50 p-4 rounded-3xl border border-gray-100">
                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-2xl" />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">{item.name}</h4>
                      <p className="text-pink-500 font-display">R$ {item.price.toFixed(2)}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center bg-white rounded-full border border-gray-200 px-2 py-1">
                          <button 
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="w-6 h-6 flex items-center justify-center hover:text-pink-400"
                          >-</button>
                          <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                          <button 
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="w-6 h-6 flex items-center justify-center hover:text-pink-400"
                          >+</button>
                        </div>
                        <button 
                          onClick={() => onRemove(item.id)}
                          className="text-xs text-gray-400 hover:text-red-400 underline"
                        >Remover</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-500 font-medium">Total</span>
                  <span className="text-3xl font-display text-pink-500">R$ {total.toFixed(2)}</span>
                </div>
                <button 
                  onClick={onCheckout}
                  className="w-full py-4 bg-pastel-pink hover:bg-pink-300 text-gray-800 font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  Finalizar Compra
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- Main App ---

export default function App() {
  return (
    <AppErrorBoundary>
      <AppContent />
    </AppErrorBoundary>
  );
}

function AppContent() {
  console.log("App is rendering");
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [category, setCategory] = React.useState<string>('Todos');
  const [view, setView] = React.useState<'home' | 'checkout' | 'success' | 'orders' | 'admin' | 'profile'>('home');
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);

  // Auth Listener
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as UserProfile);
          } else {
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Cliente',
              role: firebaseUser.email === 'mbrayansilvadossantos@gmail.com' ? 'admin' : 'client'
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setUser(newUser);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setView('home');
  };

  const updateProfile = async (updatedUser: UserProfile) => {
    try {
      await setDoc(doc(db, 'users', updatedUser.uid), updatedUser);
      setUser(updatedUser);
      alert("Perfil atualizado com sucesso!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${updatedUser.uid}`);
    }
  };

  // Dynamic featured product based on the current hour
  const featuredProduct = React.useMemo(() => {
    const hour = new Date().getHours();
    return PRODUCTS[hour % PRODUCTS.length];
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const filteredProducts = category === 'Todos' 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === category);

  const categories = ['Todos', 'Banho', 'Conjuntos', 'Peças', 'Bebês', 'Meninas', 'Meninos', 'Acessórios'];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pastel-blue/5">
        <div className="w-16 h-16 border-4 border-pastel-pink border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (view === 'checkout') {
    return <CheckoutPage user={user} items={cart} onBack={() => setView('home')} onSuccess={() => { setCart([]); setView('success'); }} onLogin={login} />;
  }

  if (view === 'success') {
    return <SuccessPage onHome={() => setView('home')} onViewOrders={() => setView('orders')} />;
  }

  if (view === 'orders') {
    return <OrderHistoryPage user={user} onBack={() => setView('home')} />;
  }

  if (view === 'admin' && user?.role === 'admin') {
    return <AdminPanelPage onBack={() => setView('home')} />;
  }

  if (view === 'profile' && user) {
    return <ProfilePage user={user} onBack={() => setView('home')} onUpdate={updateProfile} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)} 
        onOpenCart={() => setIsCartOpen(true)} 
        user={user}
        onLogin={login}
        onLogout={logout}
        onViewOrders={() => setView('orders')}
        onViewAdmin={() => setView('admin')}
        onViewProfile={() => setView('profile')}
      />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-pastel-blue/10 py-20 overflow-hidden">
          <div className="absolute top-10 left-10 text-pastel-pink opacity-20 animate-pulse">
            <Cloud size={120} />
          </div>
          <div className="absolute bottom-10 right-10 text-pastel-yellow opacity-20 animate-bounce">
            <Sun size={100} />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left space-y-6">
              <motion.span 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-block px-4 py-1.5 bg-pastel-pink rounded-full text-pink-600 text-sm font-bold tracking-wider"
              >
                NOVA COLEÇÃO 2026
              </motion.span>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-7xl font-display leading-tight"
              >
                Encanto, conforto e <span className="text-blue-400">estilo</span> para os pequenos
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-gray-500 max-w-lg"
              >
                Descubra um mundo de magia em cada peça. Roupas feitas para brincar, sonhar e encantar.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-4 justify-center md:justify-start"
              >
                <a href="#produtos" className="btn-primary">Ver Produtos</a>
                <button className="btn-secondary">Promoções</button>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="flex-1 relative"
            >
              <div className="w-full aspect-square bg-white rounded-[4rem] overflow-hidden shadow-2xl border-8 border-white">
                <img 
                  src={featuredProduct.image} 
                  alt={featuredProduct.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-pastel-yellow p-6 rounded-3xl shadow-lg rotate-3">
                <p className="font-display text-xl">Destaque: {featuredProduct.name}</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-8 py-3 rounded-full font-bold transition-all ${
                  category === cat 
                    ? 'bg-pastel-pink text-gray-800 shadow-md' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div id="produtos" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={addToCart}
                onBuyNow={(p) => { addToCart(p); setView('checkout'); }}
              />
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section id="contato" className="bg-pastel-green/10 py-20">
          <div className="max-w-3xl mx-auto px-4 text-center space-y-8">
            <h2 className="text-4xl font-display">Fale Conosco</h2>
            <p className="text-gray-500">Dúvidas sobre tamanhos ou pedidos? Nossa equipe está pronta para te ajudar!</p>
            
            <form className="bg-white p-8 rounded-[2rem] shadow-xl space-y-4 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600 ml-2">Nome</label>
                  <input type="text" className="w-full px-6 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-pink" placeholder="Seu nome" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600 ml-2">Email</label>
                  <input type="email" className="w-full px-6 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-pink" placeholder="seu@email.com" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 ml-2">Mensagem</label>
                <textarea rows={4} className="w-full px-6 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-pink" placeholder="Como podemos ajudar?"></textarea>
              </div>
              <button type="button" className="w-full py-4 bg-pastel-blue text-gray-800 font-bold rounded-2xl hover:bg-blue-300 transition-all shadow-md">
                Enviar Mensagem
              </button>
            </form>
          </div>
        </section>
      </main>

      <Footer />

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={cart}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={() => { setIsCartOpen(false); setView('checkout'); }}
      />

      {/* WhatsApp Button */}
      <a 
        href="https://wa.me/5500000000000" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform z-50"
      >
        <MessageCircle size={32} />
      </a>
    </div>
  );
}

// --- Checkout Page ---

const CheckoutPage = ({ 
  user, 
  items, 
  onBack, 
  onSuccess,
  onLogin
}: { 
  user: UserProfile | null, 
  items: CartItem[], 
  onBack: () => void, 
  onSuccess: () => void,
  onLogin: () => void
}) => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const [loading, setLoading] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<'pix' | 'card'>('pix');
  const [address, setAddress] = React.useState({
    street: '',
    city: '',
    state: '',
    zip: ''
  });

  const handlePayment = async () => {
    if (!user) {
      onLogin();
      return;
    }

    if (!address.street || !address.city || !address.state || !address.zip) {
      alert("Por favor, preencha o endereço de entrega.");
      return;
    }

    setLoading(true);
    
    try {
      // Update user address if not set
      if (!user.address) {
        await updateDoc(doc(db, 'users', user.uid), { address });
      }

      // Save order to Firestore
      const orderData = {
        userId: user.uid,
        items,
        total,
        status: 'pending',
        deliveryAddress: address,
        createdAt: Timestamp.now(),
        estimatedDeliveryDate: Timestamp.fromDate(getEstimatedDeliveryDate(address.state))
      };
      
      await addDoc(collection(db, 'orders'), orderData);
      
      // Simulate payment processing
      setTimeout(() => {
        setLoading(false);
        onSuccess();
      }, 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'orders');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-pink-400 mb-8 font-bold">
          <X size={20} /> Voltar para a loja
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <h2 className="text-3xl font-display">Finalizar Compra</h2>
            
            {!user && (
              <div className="bg-pastel-blue/10 p-6 rounded-3xl border border-pastel-blue/30 text-center space-y-4">
                <p className="text-gray-700 font-medium">Você precisa estar logado para finalizar a compra.</p>
                <button 
                  onClick={onLogin}
                  className="px-8 py-3 bg-white text-gray-800 font-bold rounded-2xl shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2 mx-auto"
                >
                  <UserIcon size={20} /> Entrar com Google
                </button>
              </div>
            )}

            <div className={`bg-white p-8 rounded-[2rem] shadow-sm space-y-6 ${!user ? 'opacity-50 pointer-events-none' : ''}`}>
              <h3 className="font-bold text-lg border-b pb-4 flex items-center gap-2">
                <MapPin size={20} className="text-pink-400" /> Endereço de Entrega
              </h3>
              <div className="space-y-4">
                <input 
                  value={address.street}
                  onChange={e => setAddress({...address, street: e.target.value})}
                  className="w-full px-6 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-pastel-pink" 
                  placeholder="Rua e Número" 
                />
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    value={address.city}
                    onChange={e => setAddress({...address, city: e.target.value})}
                    className="w-full px-6 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-pastel-pink" 
                    placeholder="Cidade" 
                  />
                  <input 
                    value={address.state}
                    onChange={e => setAddress({...address, state: e.target.value})}
                    className="w-full px-6 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-pastel-pink" 
                    placeholder="Estado" 
                  />
                </div>
                <input 
                  value={address.zip}
                  onChange={e => setAddress({...address, zip: e.target.value})}
                  className="w-full px-6 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-pastel-pink" 
                  placeholder="CEP" 
                />
              </div>
            </div>

            <div className={`bg-white p-8 rounded-[2rem] shadow-sm space-y-6 ${!user ? 'opacity-50 pointer-events-none' : ''}`}>
              <h3 className="font-bold text-lg border-b pb-4">Método de Pagamento</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'pix' ? 'border-pastel-pink bg-pastel-pink/5' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <span className="font-bold text-xs">PIX</span>
                  </div>
                  <span className="font-bold text-sm">Pix Automático</span>
                </button>
                <button 
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'card' ? 'border-pastel-pink bg-pastel-pink/5' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <Star size={20} />
                  </div>
                  <span className="font-bold text-sm">Cartão de Crédito</span>
                </button>
              </div>

              {paymentMethod === 'pix' ? (
                <div className="text-center space-y-4 py-4">
                  <div className="w-48 h-48 bg-gray-100 mx-auto rounded-3xl flex items-center justify-center border-2 border-dashed border-gray-200">
                    <span className="text-gray-400 text-xs text-center px-4">QR Code será gerado após clicar em pagar</span>
                  </div>
                  <p className="text-sm text-gray-500">Confirmação instantânea sem envio de comprovante.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <input className="w-full px-6 py-3 bg-gray-50 rounded-xl border-none" placeholder="Número do Cartão" />
                  <div className="grid grid-cols-2 gap-4">
                    <input className="w-full px-6 py-3 bg-gray-50 rounded-xl border-none" placeholder="MM/AA" />
                    <input className="w-full px-6 py-3 bg-gray-50 rounded-xl border-none" placeholder="CVV" />
                  </div>
                  <input className="w-full px-6 py-3 bg-gray-50 rounded-xl border-none" placeholder="Nome no Cartão" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm">
              <h3 className="font-bold text-lg mb-6">Resumo do Pedido</h3>
              <div className="space-y-4 mb-8">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-500">{item.quantity}x {item.name}</span>
                    <span className="font-bold">R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Frete</span>
                  <span className="text-green-500 font-bold">Grátis</span>
                </div>
                <div className="flex justify-between items-center pt-4">
                  <span className="text-xl font-bold">Total</span>
                  <span className="text-3xl font-display text-pink-500">R$ {total.toFixed(2)}</span>
                </div>
              </div>
              <button 
                onClick={handlePayment}
                disabled={loading || items.length === 0}
                className="w-full mt-8 py-4 bg-pastel-pink hover:bg-pink-300 text-gray-800 font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Processando...' : `Pagar R$ ${total.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Success Page ---

const SuccessPage = ({ onHome, onViewOrders }: { onHome: () => void, onViewOrders: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-pastel-blue/10 p-4">
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-2xl text-center space-y-8"
    >
      <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto">
        <Star size={48} className="fill-green-500" />
      </div>
      <h2 className="text-4xl font-display">Pagamento Confirmado!</h2>
      <p className="text-gray-500">
        Oba! O pedido da Sophia já está sendo preparado com muito carinho. 
        Você receberá as atualizações por email.
      </p>
      <div className="bg-gray-50 p-6 rounded-3xl text-left space-y-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status do Pedido</p>
        <p className="text-green-600 font-bold flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Pago e em Processamento
        </p>
      </div>
      <div className="space-y-3">
        <button 
          onClick={onViewOrders}
          className="w-full py-4 bg-pastel-pink hover:bg-pink-300 text-gray-800 font-bold rounded-2xl transition-all shadow-md"
        >
          Ver Meus Pedidos
        </button>
        <button 
          onClick={onHome}
          className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl transition-all"
        >
          Voltar para a Loja
        </button>
      </div>
    </motion.div>
  </div>
);

// --- Order History Page ---

const OrderHistoryPage = ({ user, onBack }: { user: UserProfile | null, onBack: () => void }) => {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });
    return unsubscribe;
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-pink-400 mb-8 font-bold">
          <X size={20} /> Voltar para a loja
        </button>

        <h2 className="text-4xl font-display mb-12">Meus Pedidos</h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-pastel-pink border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-12 rounded-[3rem] text-center space-y-4 shadow-sm">
            <Package size={64} className="mx-auto text-gray-200" />
            <p className="text-gray-500">Você ainda não fez nenhum pedido.</p>
            <button onClick={onBack} className="text-pink-400 font-bold hover:underline">Começar a comprar</button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Pedido #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500">{order.createdAt.toDate().toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {order.status === 'pending' ? 'Pendente' : 
                     order.status === 'paid' ? 'Pago' : 
                     order.status === 'shipped' ? 'Enviado' : 'Entregue'}
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-xl" />
                        <span className="text-sm font-medium">{item.quantity}x {item.name}</span>
                      </div>
                      <span className="text-sm font-bold">R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-6 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Truck size={18} />
                    <span>Entrega estimada: {order.estimatedDeliveryDate?.toDate().toLocaleDateString('pt-BR') || 'A calcular'}</span>
                  </div>
                  <p className="text-xl font-display text-pink-500">Total: R$ {order.total.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Profile Page ---

const ProfilePage = ({ user, onBack, onUpdate }: { user: UserProfile, onBack: () => void, onUpdate: (u: UserProfile) => void }) => {
  const [address, setAddress] = React.useState(user.address || { street: '', city: '', state: '', zip: '' });
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onUpdate({ ...user, address });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-pink-400 mb-8 font-bold">
          <X size={20} /> Voltar para a loja
        </button>

        <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-sm space-y-8">
          <div className="flex items-center gap-4 border-b pb-8">
            <div className="w-20 h-20 bg-pastel-pink rounded-full flex items-center justify-center text-white">
              <UserIcon size={40} />
            </div>
            <div>
              <h2 className="text-3xl font-display">{user.displayName}</h2>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <MapPin size={20} className="text-pink-400" /> Endereço Salvo
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 ml-2">Rua e Número</label>
                <input 
                  value={address.street}
                  onChange={e => setAddress({...address, street: e.target.value})}
                  className="w-full px-6 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-pastel-pink" 
                  placeholder="Ex: Rua das Flores, 123" 
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600 ml-2">Cidade</label>
                  <input 
                    value={address.city}
                    onChange={e => setAddress({...address, city: e.target.value})}
                    className="w-full px-6 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-pastel-pink" 
                    placeholder="Cidade" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600 ml-2">Estado (UF)</label>
                  <input 
                    value={address.state}
                    onChange={e => setAddress({...address, state: e.target.value.toUpperCase().slice(0, 2)})}
                    className="w-full px-6 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-pastel-pink" 
                    placeholder="Ex: SP" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 ml-2">CEP</label>
                <input 
                  value={address.zip}
                  onChange={e => setAddress({...address, zip: e.target.value})}
                  className="w-full px-6 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-pastel-pink" 
                  placeholder="00000-000" 
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-pastel-pink hover:bg-pink-300 text-gray-800 font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Admin Panel Page ---

const AdminPanelPage = ({ onBack }: { onBack: () => void }) => {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });
    return unsubscribe;
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-pink-400 mb-8 font-bold">
          <X size={20} /> Voltar para a loja
        </button>

        <div className="flex justify-between items-center mb-12">
          <h2 className="text-4xl font-display">Gerenciamento de Pedidos</h2>
          <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-2xl font-bold text-sm flex items-center gap-2">
            <Star size={18} /> Modo Administrador
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-pastel-pink border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <div className="flex flex-wrap justify-between items-start gap-6">
                  <div className="flex-1 min-w-[300px] space-y-4">
                    <div className="flex items-center gap-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pedido #{order.id}</p>
                      <span className="text-sm text-gray-500">{order.createdAt.toDate().toLocaleString('pt-BR')}</span>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
                      <p className="text-sm font-bold flex items-center gap-2"><MapPin size={16} /> Endereço de Entrega:</p>
                      <p className="text-sm text-gray-600">
                        {order.deliveryAddress.street}, {order.deliveryAddress.city} - {order.deliveryAddress.state} ({order.deliveryAddress.zip})
                      </p>
                      {order.estimatedDeliveryDate && (
                        <p className="text-xs text-blue-500 font-bold mt-2 flex items-center gap-1">
                          <Clock size={14} /> Entrega estimada até: {order.estimatedDeliveryDate.toDate().toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-bold">Itens:</p>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="text-sm text-gray-600 flex justify-between">
                          <span>{item.quantity}x {item.name}</span>
                          <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="w-full md:w-64 space-y-6">
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total do Pedido</p>
                      <p className="text-3xl font-display text-pink-500">R$ {order.total.toFixed(2)}</p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold text-gray-400 uppercase">Alterar Status</p>
                      <select 
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none text-sm font-bold focus:ring-2 focus:ring-pastel-pink"
                      >
                        <option value="pending">Pendente</option>
                        <option value="paid">Pago (Preparando)</option>
                        <option value="shipped">Enviado</option>
                        <option value="delivered">Entregue</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
