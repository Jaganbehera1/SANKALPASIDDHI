import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getDatabase,
  ref as dbRef,
  child,
  push,
  set,
  update,
  remove,
  get,
} from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
};

const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

interface Filter {
  field: string;
  op: any;
  value: any;
}

interface OrderBy {
  field: string;
  direction: 'asc' | 'desc';
}

function getTableItems(tableRef: any): Promise<Record<string, any>[]> {
  return get(tableRef).then((snapshot) => {
    if (!snapshot.exists()) return [];
    const value = snapshot.val() as Record<string, any>;
    return Object.entries(value).map(([id, item]) => ({ id, ...(item as Record<string, any>) }));
  });
}

function applyFilters(items: any[], filters: Filter[]) {
  return items.filter((item) => filters.every((filter) => item[filter.field] === filter.value));
}

function applyOrders(items: any[], orders: OrderBy[]) {
  return [...items].sort((a, b) => {
    for (const order of orders) {
      const aValue = a[order.field];
      const bValue = b[order.field];
      if (aValue === bValue) continue;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      if (aValue > bValue) return order.direction === 'asc' ? 1 : -1;
      if (aValue < bValue) return order.direction === 'asc' ? -1 : 1;
    }
    return 0;
  });
}

function createTableClient(tableName: string) {
  const tableRef = dbRef(db, tableName);

  function createQuery() {
    const state = { filters: [] as Filter[], orders: [] as OrderBy[] };

    const execute = async () => {
      const items = await getTableItems(tableRef);
      const filtered = applyFilters(items, state.filters);
      const ordered = applyOrders(filtered, state.orders);
      return { data: ordered, error: null };
    };

    const query: any = {
      select: (_fields?: string) => query,
      order: (field: string, opts: { ascending?: boolean } = { ascending: true }) => {
        state.orders.push({ field, direction: opts.ascending ? 'asc' : 'desc' });
        return query;
      },
      eq: (field: string, value: any) => {
        state.filters.push({ field, op: '==', value });
        return query;
      },
      maybeSingle: async () => {
        const result = await execute();
        return { data: result.data[0] ?? null, error: result.error };
      },
      then: (resolve: any, reject: any) => execute().then(resolve, reject),
      catch: (reject: any) => execute().catch(reject),
    };

    return query;
  }

  const client: any = {
    select: (_fields?: string) => createQuery(),
    insert: async (item: any) => {
      console.log('supabase.insert called', { tableName, item });
      try {
        const newRef = push(tableRef);
        await set(newRef, item);
        console.log('supabase.insert success', { tableName, id: newRef.key });
        return { data: { id: newRef.key, ...item }, error: null };
      } catch (error: any) {
        console.error('supabase.insert error', { tableName, error });
        return { data: null, error };
      }
    },
    update: (item: any) => ({
      eq: async (field: string, value: any) => {
        if (field === 'id') {
          const itemRef = child(tableRef, value);
          await update(itemRef, item);
          return { data: null, error: null };
        }
        const items = await getTableItems(tableRef);
        const matches = items.filter((it) => it[field] === value);
        await Promise.all(matches.map((it) => update(child(tableRef, it.id), item)));
        return { data: null, error: null };
      },
    }),
    delete: () => ({
      eq: async (field: string, value: any) => {
        if (field === 'id') {
          await remove(child(tableRef, value));
          return { data: null, error: null };
        }
        const items = await getTableItems(tableRef);
        const matches = items.filter((it) => it[field] === value);
        await Promise.all(matches.map((it) => remove(child(tableRef, it.id))));
        return { data: null, error: null };
      },
    }),
  };

  return client;
}

export const supabase = {
  from: createTableClient,
  auth: {
    getSession: async () => {
      const currentUser = auth.currentUser;
      return {
        data: {
          session: currentUser
            ? {
                user: {
                  id: currentUser.uid,
                  email: currentUser.email || '',
                },
              }
            : null,
        },
      };
    },
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          callback('SIGNED_IN', { session: { user: { id: user.uid, email: user.email || '' } } });
        } else {
          callback('SIGNED_OUT', { session: null });
        }
      });
      return { data: { subscription: { unsubscribe } } };
    },
    signUp: async ({ email, password }: { email: string; password: string }) => {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return {
          data: {
            user: {
              id: userCredential.user.uid,
              email: userCredential.user.email || '',
            },
          },
          error: null,
        };
      } catch (error: any) {
        return { data: null, error };
      }
    },
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        return { data: null, error: null };
      } catch (error: any) {
        return { data: null, error };
      }
    },
    signOut: async () => {
      try {
        await firebaseSignOut(auth);
        return { data: null, error: null };
      } catch (error: any) {
        return { data: null, error };
      }
    },
  },
  storage: {
    from: (bucketName: string) => ({
      upload: async (fileName: string, file: File) => {
        try {
          const storageReference = storageRef(storage, `${bucketName}/${fileName}`);
          await uploadBytes(storageReference, file);
          return { data: null, error: null };
        } catch (error: any) {
          return { data: null, error };
        }
      },
      getPublicUrl: async (fileName: string) => {
        try {
          const storageReference = storageRef(storage, `${bucketName}/${fileName}`);
          const publicUrl = await getDownloadURL(storageReference);
          return {
            data: { publicUrl },
            error: null,
          };
        } catch (error: any) {
          return { data: null, error };
        }
      },
    }),
  },
  _internal: {
    app,
    auth,
    db,
    storage,
    analytics,
  },
};
