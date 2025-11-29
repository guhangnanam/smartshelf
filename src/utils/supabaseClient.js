import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Check if we have valid Supabase credentials
const hasValidSupabaseConfig = supabaseUrl && supabaseUrl.startsWith('http') && supabaseAnonKey && supabaseAnonKey.length > 10;

// Mock data store for frontend development
const mockDataStore = {
  containers: [
    { id: 1, user_id: 'mock-user-id', name: 'Refrigerator Shelf', created_at: new Date().toISOString() },
    { id: 2, user_id: 'mock-user-id', name: 'Pantry Box 1', created_at: new Date().toISOString() },
    { id: 3, user_id: 'mock-user-id', name: 'Freezer Container', created_at: new Date().toISOString() },
  ],
  shelf_items: [
    {
      id: 1,
      user_id: 'mock-user-id',
      name: 'Milk Jug',
      food_name: 'Whole Milk',
      calories_per_gram: 0.64,
      current_weight: 800,
      max_weight: 1000,
      container_id: 1,
      containers: { name: 'Refrigerator Shelf' },
      last_updated: new Date().toISOString()
    },
    {
      id: 2,
      user_id: 'mock-user-id',
      name: 'Cereal Box',
      food_name: 'Breakfast Cereal',
      calories_per_gram: 3.8,
      current_weight: 600,
      max_weight: 800,
      container_id: 2,
      containers: { name: 'Pantry Box 1' },
      last_updated: new Date().toISOString()
    },
    {
      id: 3,
      user_id: 'mock-user-id',
      name: 'Frozen Berries',
      food_name: 'Mixed Berries',
      calories_per_gram: 0.32,
      current_weight: 450,
      max_weight: 500,
      container_id: 3,
      containers: { name: 'Freezer Container' },
      last_updated: new Date().toISOString()
    },
    {
      id: 4,
      user_id: 'mock-user-id',
      name: 'Olive Oil',
      food_name: 'Extra Virgin Olive Oil',
      calories_per_gram: 8.8,
      current_weight: 350,
      max_weight: 500,
      container_id: 1,
      containers: { name: 'Refrigerator Shelf' },
      last_updated: new Date().toISOString()
    },
  ],
};

// Create a mock client if credentials are not available for frontend development
let authCallbacks = [];

export const supabase = hasValidSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        onAuthStateChange: (callback) => {
          // Simulate a logged-in user for frontend development
          const mockSession = {
            user: {
              id: 'mock-user-id',
              email: 'demo@smartshelf.dev',
              user_metadata: {}
            },
            access_token: 'mock-token',
            expires_in: 3600
          };
          callback('SIGNED_IN', mockSession);
          
          // Store callback for sign out
          authCallbacks.push(callback);
          
          return {
            data: {
              subscription: {
                unsubscribe: () => {
                  // Remove callback when unsubscribed
                  authCallbacks = authCallbacks.filter(cb => cb !== callback);
                }
              }
            }
          };
        },
        getSession: async () => ({
          data: {
            session: {
              user: {
                id: 'mock-user-id',
                email: 'demo@smartshelf.dev',
                user_metadata: {}
              },
              access_token: 'mock-token',
              expires_in: 3600
            }
          },
          error: null
        }),
        signInWithPassword: async () => ({ data: null, error: new Error('Supabase not configured') }),
        signUp: async () => ({ data: null, error: new Error('Supabase not configured') }),
        signOut: async () => {
          // Trigger sign out event for all listeners
          authCallbacks.forEach(callback => callback('SIGNED_OUT', null));
          return { error: null };
        },
      },
      from: (table) => ({
        select: function(columns) {
          return {
            eq: (column, value) => {
              // Return a Promise-like object that can be awaited AND chained
              const promise = Promise.resolve().then(() => {
                // Mock returning filtered data
                if (table === 'containers') {
                  const filtered = mockDataStore.containers.filter(c => c.user_id === value);
                  return { data: filtered, error: null };
                } else if (table === 'shelf_items') {
                  const filtered = mockDataStore.shelf_items.filter(s => s.user_id === value);
                  // Join with containers data
                  const withContainers = filtered.map(item => ({
                    ...item,
                    containers: mockDataStore.containers.find(c => c.id === item.container_id) || { name: 'Container' }
                  }));
                  return { data: withContainers, error: null };
                }
                return { data: [], error: null };
              });
              
              // Add order method to the promise
              promise.order = async (column, options) => {
                const result = await promise;
                if (options?.ascending === false) {
                  return { data: [...(result.data || [])].reverse(), error: null };
                }
                return result;
              };
              
              return promise;
            },
            order: async (column, options) => {
              // Mock returning all data of table, ordered
              if (table === 'shelf_items') {
                const data = mockDataStore.shelf_items || [];
                // Join with containers data
                const withContainers = data.map(item => ({
                  ...item,
                  containers: mockDataStore.containers.find(c => c.id === item.container_id) || { name: 'Container' }
                }));
                if (options?.ascending === false) {
                  return { data: [...withContainers].reverse(), error: null };
                }
                return { data: withContainers, error: null };
              }
              return { data: [], error: null };
            }
          };
        },
        insert: async (records) => {
          // Add records to mock store with ID and timestamp
          const newRecords = records.map((record, idx) => ({
            id: Date.now() + idx,
            created_at: new Date().toISOString(),
            ...record
          }));
          mockDataStore[table] = [...(mockDataStore[table] || []), ...newRecords];
          console.log(`Added to ${table}:`, newRecords);
          return { data: newRecords, error: null };
        },
        update: async (data) => ({ data: data, error: null }),
        delete: () => {
          return {
            eq: (column, value) => {
              // Remove records from mock store
              mockDataStore[table] = mockDataStore[table].filter(item => item.id !== value);
              console.log(`Deleted from ${table} where id=${value}`);
              return Promise.resolve({ data: null, error: null });
            }
          };
        },
      }),
    }
