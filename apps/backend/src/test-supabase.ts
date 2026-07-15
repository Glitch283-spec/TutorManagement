import { supabase } from './lib/supabase';

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  try {
    // Attempt to query a non-existent table just to see if the connection and credentials are valid
    // Alternatively, we can just get the session or ping the auth API
    
    // We'll just do a simple select from a common table name that might exist, 
    // or just rely on the API returning a legitimate error (like relation does not exist) rather than an auth error.
    const { data, error } = await supabase.from('users').select('*').limit(1);

    if (error) {
      console.error('Connection tested, but encountered an error querying the "users" table (this might be expected if the table does not exist):');
      console.error(error);
    } else {
      console.log('Successfully connected to Supabase!');
      console.log('Data:', data);
    }
  } catch (err) {
    console.error('Failed to connect or query Supabase:', err);
  }
}

testSupabaseConnection();
