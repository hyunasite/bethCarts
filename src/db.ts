import { Product, Order, DatabaseStatus, CartItem, Sale } from './types';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase dynamically if valid credentials are provided
let db: any = null;
let isCloudMode = false;

const isConfigValid = !!(
  firebaseConfig &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId.trim() !== "" &&
  !firebaseConfig.projectId.includes("YOUR_") &&
  !firebaseConfig.projectId.includes("YOUR_ACTUAL")
);

// Seeds for product data the absolute first time database initializes
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-item-1',
    name: 'Classic White Tee',
    price: 250,
    stock: 3,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
    description: 'A timeless crewneck t-shirt crafted from 100% organic cotton, offering a relaxed fit and ultimate daily comfort.',
    category: 'Clothes',
    status: 'available'
  },
  {
    id: 'prod-item-2',
    name: 'Summer Slip-On',
    price: 120,
    stock: 8,
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80',
    description: 'Charming polished pink topaz and rose gold statement band, designed for sunny strolls and elegant evenings.',
    category: 'Slippers',
    status: 'available'
  },
  {
    id: 'prod-item-3',
    name: 'Vintage Denim Shorts',
    price: 350,
    stock: 2,
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=600&q=80',
    description: 'Distressed high-waisted denim shorts in a classic summer light-wash, with functional pockets and raw edge hem.',
    category: 'Clothes',
    status: 'available'
  },
  {
    id: 'prod-item-4',
    name: 'Aline Floral Dress',
    price: 499,
    stock: 3,
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80',
    description: 'An elegant long flowing ankle-length dress featuring high-quality fabric and handcrafted floral stitching.',
    category: 'Clothes',
    status: 'available'
  },
  {
    id: 'prod-item-5',
    name: 'Denim Cap / Hat',
    price: 180,
    stock: 1,
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80',
    description: 'Curated mesh trucker-style white baseball cap. Light, breathable, and matching with relaxed daily leisure attire.',
    category: 'Other',
    status: 'available'
  },
  {
    id: 'prod-item-6',
    name: 'Canvas Tote Bag',
    price: 150,
    stock: 15,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
    description: 'Eco-friendly heavy-duty duck canvas carrying tote with spacious interior and durable parallel shoulder straps.',
    category: 'Accessories',
    status: 'available'
  }
];

// Memory state variables for local mode fallback and subscriber triggers
let localProducts: Product[] = [];
let localOrders: Order[] = [];
let localSales: Sale[] = [];
const productListeners: Array<(products: Product[]) => void> = [];
const orderListeners: Array<(orders: Order[]) => void> = [];
const saleListeners: Array<(sales: Sale[]) => void> = [];

// Initialize local mode contents
const loadFromLocalStorage = () => {
  try {
    const productsJson = localStorage.getItem('bethcart_products');
    const ordersJson = localStorage.getItem('bethcart_orders');
    const salesJson = localStorage.getItem('bethcart_sales');

    if (productsJson) {
      localProducts = JSON.parse(productsJson);
    } else {
      localProducts = [...DEFAULT_PRODUCTS];
      localStorage.setItem('bethcart_products', JSON.stringify(localProducts));
    }

    if (ordersJson) {
      localOrders = JSON.parse(ordersJson);
    } else {
      localOrders = [];
      localStorage.setItem('bethcart_orders', JSON.stringify(localOrders));
    }

    if (salesJson) {
      localSales = JSON.parse(salesJson);
    } else {
      localSales = [];
      localStorage.setItem('bethcart_sales', JSON.stringify(localSales));
    }
  } catch (e) {
    console.error('Failed to read from localStorage', e);
    localProducts = [...DEFAULT_PRODUCTS];
    localOrders = [];
    localSales = [];
  }
};

const saveToLocalStorage = () => {
  try {
    localStorage.setItem('bethcart_products', JSON.stringify(localProducts));
    localStorage.setItem('bethcart_orders', JSON.stringify(localOrders));
    localStorage.setItem('bethcart_sales', JSON.stringify(localSales));
    notifySubscribers();
  } catch (e) {
    console.error('Failed to write to localStorage', e);
  }
};

const notifySubscribers = () => {
  productListeners.forEach((listener) => listener([...localProducts]));
  orderListeners.forEach((listener) => listener([...localOrders]));
  saleListeners.forEach((listener) => listener([...localSales]));
};

// Handle localStorage cross-tab updates magically
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'bethcart_products' || event.key === 'bethcart_orders' || event.key === 'bethcart_sales') {
      loadFromLocalStorage();
      notifySubscribers();
    }
  });
}

// Dynamically load Firebase SDK if credentials exist
if (isConfigValid) {
  try {
    // We use dynamic imports to prevent startup crashes when building/running if config is invalid
    const { initializeApp: initApp } = await import('firebase/app');
    const { getFirestore: initFirestore } = await import('firebase/firestore');
    
    const app = initApp(firebaseConfig);
    db = initFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
    isCloudMode = true;
    console.log('Firebase initialized successfully connection to project:', firebaseConfig.projectId);
  } catch (e) {
    console.warn('Firebase failed to initialize. Falling back to Simulated Local Database.', e);
    isCloudMode = false;
  }
}

if (!isCloudMode) {
  loadFromLocalStorage();
}

/**
 * Check and return database state
 */
export function getDatabaseStatus(): DatabaseStatus {
  return {
    isCloud: isCloudMode,
    isConnected: isCloudMode && !!db,
    projectId: isCloudMode ? firebaseConfig.projectId : null
  };
}

/**
 * Handle Firestore API operation wrapper with error reporting conforming to schema rules
 */
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null, // Simple storefront uses public client for mock or empty auth
      email: null,
      emailVerified: null,
      isAnonymous: true,
    },
    operationType,
    path
  };
  console.error('Firestore Error Detailed Logs: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Retrieves the current product list
 */
export async function getProducts(): Promise<Product[]> {
  if (isCloudMode && db) {
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const querySnapshot = await getDocs(collection(db, 'products'));
      
      if (querySnapshot.empty) {
        // If blank, let's self-seed!
        await seedDatabase();
        return DEFAULT_PRODUCTS;
      }
      
      const products: Product[] = [];
      querySnapshot.forEach((docSnap) => {
        products.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      return products;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, 'products');
    }
  }
  return [...localProducts];
}

/**
 * Listen to product list updates in real-time
 */
export function onProductsChange(callback: (products: Product[]) => void): () => void {
  if (isCloudMode && db) {
    let unsubscribe = () => {};
    // Asynchronously set up subscriber so it doesn't block caller
    (async () => {
      try {
        const { collection, onSnapshot } = await import('firebase/firestore');
        unsubscribe = onSnapshot(collection(db, 'products'), (querySnapshot) => {
          if (querySnapshot.empty) {
            seedDatabase(); // Seed if blank
            callback([...DEFAULT_PRODUCTS]);
            return;
          }
          const products: Product[] = [];
          querySnapshot.forEach((docSnap) => {
            products.push({ id: docSnap.id, ...docSnap.data() } as Product);
          });
          callback(products);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'products');
        });
      } catch (err) {
        console.error('Failed to subscribe to cloud products', err);
      }
    })();
    return () => unsubscribe();
  } else {
    productListeners.push(callback);
    callback([...localProducts]);
    return () => {
      const index = productListeners.indexOf(callback);
      if (index > -1) productListeners.splice(index, 1);
    };
  }
}

/**
 * Listen to orders list in real-time
 */
export function onOrdersChange(callback: (orders: Order[]) => void): () => void {
  if (isCloudMode && db) {
    let unsubscribe = () => {};
    (async () => {
      try {
        const { collection, onSnapshot, query, orderBy } = await import('firebase/firestore');
        const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        unsubscribe = onSnapshot(ordersQuery, (querySnapshot) => {
          const orders: Order[] = [];
          querySnapshot.forEach((docSnap) => {
            orders.push({ id: docSnap.id, ...docSnap.data() } as Order);
          });
          callback(orders);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'orders');
        });
      } catch (err) {
        console.error('Failed to subscribe to cloud orders', err);
      }
    })();
    return () => unsubscribe();
  } else {
    orderListeners.push(callback);
    callback([...localOrders]);
    return () => {
      const index = orderListeners.indexOf(callback);
      if (index > -1) orderListeners.splice(index, 1);
    };
  }
}

/**
 * Listen to Sales list in real-time
 */
export function onSalesChange(callback: (sales: Sale[]) => void): () => void {
  if (isCloudMode && db) {
    let unsubscribe = () => {};
    (async () => {
      try {
        const { collection, onSnapshot, query, orderBy } = await import('firebase/firestore');
        const salesQuery = query(collection(db, 'sales'), orderBy('createdAt', 'desc'));
        unsubscribe = onSnapshot(salesQuery, (querySnapshot) => {
          const sales: Sale[] = [];
          querySnapshot.forEach((docSnap) => {
            sales.push({ id: docSnap.id, ...docSnap.data() } as Sale);
          });
          callback(sales);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'sales');
        });
      } catch (err) {
        console.error('Failed to subscribe to cloud sales', err);
      }
    })();
    return () => unsubscribe();
  } else {
    saleListeners.push(callback);
    callback([...localSales]);
    return () => {
      const index = saleListeners.indexOf(callback);
      if (index > -1) saleListeners.splice(index, 1);
    };
  }
}

/**
 * Places a customer reservation, checks duplicate queuing numbers and available stock.
 * If duplicate queuing number exists, or stock is insufficient or 0, it throws standard errors.
 */
export async function reserveProducts(
  cart: CartItem[], 
  customerName: string, 
  queuingNumber: number
): Promise<void> {
  if (cart.length === 0) throw new Error('Cannot reserve an empty cart.');
  if (queuingNumber < 1 || queuingNumber > 100) throw new Error('Queuing number must be between 1 and 100.');

  if (isCloudMode && db) {
    try {
      const { runTransaction, doc, collection, getDocs } = await import('firebase/firestore');
      
      // 1. Fetch current orders to check duplicate queueing number
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const activeQueueNumbers: number[] = [];
      ordersSnapshot.forEach(docSnap => {
        const ord = docSnap.data();
        if (ord.queuingNumber) {
          activeQueueNumbers.push(Number(ord.queuingNumber));
        }
      });

      if (activeQueueNumbers.includes(queuingNumber)) {
        throw new Error(`Queuing number ${queuingNumber} is already occupied! Please choose another number (1-100).`);
      }

      await runTransaction(db, async (transaction) => {
        const productDocs = [];
        
        // 2. Check stock levels for all products in cart
        for (const cartItem of cart) {
          const pRef = doc(db, 'products', cartItem.productId);
          const pDoc = await transaction.get(pRef);
          
          if (!pDoc.exists()) {
            throw new Error(`Product referenced by ID "${cartItem.productId}" does not exist.`);
          }
          
          const currentStock = pDoc.data().stock;
          const currentStatus = pDoc.data().status;
          
          if (currentStock < cartItem.quantity) {
            throw new Error(`Item "${pDoc.data().name}" already reserved or sold out!`);
          }
          
          productDocs.push({ pRef, currentStock, quantity: cartItem.quantity, name: pDoc.data().name, price: pDoc.data().price, currentStatus });
        }
        
        // 3. Write reservation & decrement stock
        const orderId = 'order-' + Math.random().toString(36).substr(2, 9);
        const orderRef = doc(collection(db, 'orders'), orderId);
        
        const orderItems = productDocs.map(item => ({
          productId: item.pRef.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price
        }));
        
        const totalPrice = orderItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
        
        const orderData: Order = {
          id: orderId,
          customerName,
          queuingNumber,
          items: orderItems,
          totalPrice,
          createdAt: new Date().toISOString()
        };
        
        // Perform updates inside transaction
        for (const item of productDocs) {
          const newStock = item.currentStock - item.quantity;
          // Automap status: If stock = 0, mark as reserved (unless sold)
          const newStatus = newStock === 0 ? 'reserved' : (item.currentStatus || 'available');
          transaction.update(item.pRef, { 
            stock: newStock,
            status: newStatus
          });
        }
        
        transaction.set(orderRef, orderData);
      });
      return;
    } catch (e: any) {
      if (e.message && e.message.includes('occupied')) {
        throw e;
      }
      handleFirestoreError(e, OperationType.WRITE, 'orders/reserve');
    }
  }

  // Local Mode Implementation
  const activeQueueNumbers = localOrders.map(o => o.queuingNumber);
  if (activeQueueNumbers.includes(queuingNumber)) {
    throw new Error(`Queuing number ${queuingNumber} is already occupied! Please choose another number (1-100).`);
  }

  const updatedProducts = [...localProducts];
  const orderItems = [];

  for (const item of cart) {
    const productIdx = updatedProducts.findIndex(p => p.id === item.productId);
    if (productIdx === -1) throw new Error('Product not found.');
    
    const p = updatedProducts[productIdx];
    if (p.stock < item.quantity) {
      throw new Error(`Item ${p.name} already reserved or sold out!`);
    }
    
    const newStock = p.stock - item.quantity;
    const newStatus = newStock === 0 ? 'reserved' : (p.status || 'available');

    // Deduct stock in memory
    updatedProducts[productIdx] = {
      ...p,
      stock: newStock,
      status: newStatus
    };

    orderItems.push({
      productId: p.id,
      productName: p.name,
      quantity: item.quantity,
      price: p.price
    });
  }

  const orderId = 'order-local-' + Math.random().toString(36).substr(2, 9);
  const total = orderItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  const orderData: Order = {
    id: orderId,
    customerName,
    queuingNumber,
    items: orderItems,
    totalPrice: total,
    createdAt: new Date().toISOString()
  };

  localProducts = updatedProducts;
  localOrders = [orderData, ...localOrders];
  saveToLocalStorage();
}

/**
 * Updates stock level of a specific product (Admin function)
 */
export async function updateStock(productId: string, newStock: number): Promise<void> {
  if (newStock < 0) throw new Error('Stock cannot be negative.');

  if (isCloudMode && db) {
    try {
      const { doc, updateDoc, getDoc } = await import('firebase/firestore');
      const pRef = doc(db, 'products', productId);
      const snap = await getDoc(pRef);
      if (snap.exists()) {
        const currentStatus = snap.data().status;
        const newStatus = newStock > 0 
          ? (currentStatus === 'reserved' || currentStatus === 'sold' ? 'available' : currentStatus || 'available')
          : (currentStatus || 'reserved');
        await updateDoc(pRef, { 
          stock: newStock,
          status: newStatus
        });
      }
      return;
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `products/${productId}`);
    }
  }

  const idx = localProducts.findIndex(p => p.id === productId);
  if (idx !== -1) {
    const currentStatus = localProducts[idx].status;
    const newStatus = newStock > 0 
      ? (currentStatus === 'reserved' || currentStatus === 'sold' ? 'available' : currentStatus || 'available')
      : (currentStatus || 'reserved');
    localProducts[idx] = { 
      ...localProducts[idx], 
      stock: newStock,
      status: newStatus
    };
    saveToLocalStorage();
  }
}

/**
 * Adds an entirely new product (Admin function)
 */
export async function addProduct(productData: Omit<Product, 'id'>): Promise<void> {
  const newId = 'prod-' + Math.random().toString(36).substr(2, 9);
  const fullProduct: Product = { 
    id: newId, 
    ...productData,
    status: productData.stock > 0 ? 'available' : 'reserved'
  };

  if (isCloudMode && db) {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'products', newId), fullProduct);
      return;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `products/${newId}`);
    }
  }

  localProducts.push(fullProduct);
  saveToLocalStorage();
}

/**
 * Edits details of an existing product (Admin function)
 */
export async function editProduct(productId: string, updatedFields: Partial<Product>): Promise<void> {
  if (isCloudMode && db) {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'products', productId), updatedFields);
      return;
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `products/${productId}`);
    }
  }

  const idx = localProducts.findIndex(p => p.id === productId);
  if (idx !== -1) {
    localProducts[idx] = { ...localProducts[idx], ...updatedFields };
    saveToLocalStorage();
  }
}

/**
 * Deletes a product entirely from the store inventory (Admin function)
 */
export async function deleteProduct(productId: string): Promise<void> {
  if (isCloudMode && db) {
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'products', productId));
      return;
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `products/${productId}`);
    }
  }

  localProducts = localProducts.filter(p => p.id !== productId);
  saveToLocalStorage();
}

/**
 * Confirms a reservation hold: Deletes the reservation, adds entries to "sales" ledger,
 * and records total earnings automatically. (Admin click: "Mark as Sold & Paid")
 */
export async function markReservationAsSoldAndPaid(orderId: string): Promise<void> {
  if (isCloudMode && db) {
    try {
      const { doc, getDoc, collection, setDoc, deleteDoc, writeBatch } = await import('firebase/firestore');
      
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) {
        throw new Error('Reservation not found.');
      }
      
      const ordData = orderSnap.data() as Order;
      
      // Batch writes
      const batchRef = collection(db, 'sales');
      for (const item of ordData.items) {
        const saleId = 'sale-' + Math.random().toString(36).substr(2, 9);
        const saleRef = doc(batchRef, saleId);
        
        const saleData: Sale = {
          id: saleId,
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
          createdAt: new Date().toISOString()
        };
        await setDoc(saleRef, saleData);
        
        // Update product's explicit status to "sold" if stock is 0
        const pRef = doc(db, 'products', item.productId);
        const pSnap = await getDoc(pRef);
        if (pSnap.exists()) {
          const currentStock = pSnap.data().stock;
          const status = currentStock === 0 ? 'sold' : (pSnap.data().status || 'available');
          await setDoc(pRef, { ...pSnap.data(), status }, { merge: true });
        }
      }
      
      // Delete the active reservation order
      await deleteDoc(orderRef);
      return;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `orders/completePaid/${orderId}`);
    }
  }

  // Local Mode Implementation
  const orderIdx = localOrders.findIndex(o => o.id === orderId);
  if (orderIdx === -1) throw new Error('Reservation not found.');
  
  const ord = localOrders[orderIdx];
  const updatedProducts = [...localProducts];
  const newSales: Sale[] = [];

  for (const item of ord.items) {
    const saleId = 'sale-local-' + Math.random().toString(36).substr(2, 9);
    const sale: Sale = {
      id: saleId,
      productId: item.productId,
      productName: item.productName,
      price: item.price,
      quantity: item.quantity,
      createdAt: new Date().toISOString()
    };
    newSales.push(sale);

    // Update product status to sold if stock 0
    const pIdx = updatedProducts.findIndex(p => p.id === item.productId);
    if (pIdx !== -1) {
      const p = updatedProducts[pIdx];
      const status = p.stock === 0 ? 'sold' : (p.status || 'available');
      updatedProducts[pIdx] = { ...p, status };
    }
  }

  localProducts = updatedProducts;
  localSales = [...newSales, ...localSales];
  localOrders = localOrders.filter(o => o.id !== orderId);
  saveToLocalStorage();
}

/**
 * Releases/Cancels a reservation: restocks the items, deletes the reserve queue hold.
 */
export async function releaseReservation(orderId: string): Promise<void> {
  if (isCloudMode && db) {
    try {
      const { doc, getDoc, deleteDoc, updateDoc } = await import('firebase/firestore');
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (orderSnap.exists()) {
        const ordData = orderSnap.data() as Order;
        
        // Restore inventory stock levels
        for (const item of ordData.items) {
          const pRef = doc(db, 'products', item.productId);
          const pSnap = await getDoc(pRef);
          if (pSnap.exists()) {
            const currentStock = pSnap.data().stock || 0;
            const newStock = currentStock + item.quantity;
            await updateDoc(pRef, { 
              stock: newStock,
              status: newStock > 0 ? 'available' : 'reserved'
            });
          }
        }
        await deleteDoc(orderRef);
      }
      return;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `orders/cancel/${orderId}`);
    }
  }

  // Local Mode Implementation
  const orderIdx = localOrders.findIndex(o => o.id === orderId);
  if (orderIdx === -1) return;

  const ord = localOrders[orderIdx];
  const updatedProducts = [...localProducts];

  for (const item of ord.items) {
    const pIdx = updatedProducts.findIndex(p => p.id === item.productId);
    if (pIdx !== -1) {
      const p = updatedProducts[pIdx];
      const newStock = p.stock + item.quantity;
      updatedProducts[pIdx] = {
        ...p,
        stock: newStock,
        status: newStock > 0 ? 'available' : 'reserved'
      };
    }
  }

  localProducts = updatedProducts;
  localOrders = localOrders.filter(o => o.id !== orderId);
  saveToLocalStorage();
}

/**
 * Scans all active reservations and releases those older than 24 hours.
 */
export async function checkExpiredReservations(): Promise<number> {
  const cutoffTime = 24 * 60 * 60 * 1000; // 24 hours.
  const now = Date.now();
  let countExpired = 0;

  if (isCloudMode && db) {
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      
      for (const orderSnap of ordersSnapshot.docs) {
        const ord = orderSnap.data() as Order;
        const createdMs = new Date(ord.createdAt).getTime();
        if (now - createdMs > cutoffTime) {
          await releaseReservation(orderSnap.id);
          countExpired++;
        }
      }
      return countExpired;
    } catch (e) {
      console.error('Failed to purge expired reservations in cloud db', e);
      return 0;
    }
  }

  // Local Mode Implementation
  const expiredOrders = localOrders.filter((ord) => {
    const createdMs = new Date(ord.createdAt).getTime();
    return now - createdMs > cutoffTime;
  });

  for (const ord of expiredOrders) {
    await releaseReservation(ord.id);
    countExpired++;
  }
  return countExpired;
}

/**
 * Reset data back to default preset and wipes order & sales history
 */
export async function resetDatabase(): Promise<void> {
  if (isCloudMode && db) {
    try {
      const { collection, getDocs, doc, deleteDoc } = await import('firebase/firestore');
      
      // Wipe orders
      const orderDocs = await getDocs(collection(db, 'orders'));
      for (const orderSnap of orderDocs.docs) {
        await deleteDoc(doc(db, 'orders', orderSnap.id));
      }
      
      // Wipe sales
      const salesDocs = await getDocs(collection(db, 'sales'));
      for (const saleSnap of salesDocs.docs) {
        await deleteDoc(doc(db, 'sales', saleSnap.id));
      }

      // Wipes current products
      const productDocs = await getDocs(collection(db, 'products'));
      for (const prodSnap of productDocs.docs) {
        await deleteDoc(doc(db, 'products', prodSnap.id));
      }

      await seedDatabase();
      return;
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'reset_all');
    }
  }

  // Local Storage Mode resetting
  localProducts = [...DEFAULT_PRODUCTS];
  localOrders = [];
  localSales = [];
  saveToLocalStorage();
}

/**
 * Internal seed writer for fresh setups
 */
async function seedDatabase(): Promise<void> {
  if (db) {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      for (const prod of DEFAULT_PRODUCTS) {
        await setDoc(doc(db, 'products', prod.id), prod);
      }
      console.log('Database seeded with standard boutique items.');
    } catch (err) {
      console.error('Error seeding Firestore', err);
    }
  }
}

