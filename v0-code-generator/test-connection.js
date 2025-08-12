import { supabase, supabaseAdmin } from './lib/supabase.js';

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test basic connection
    if (supabase) {
      console.log('✅ Supabase client initialized');
      
      // Test connection with a simple query
      const { data, error } = await supabase
        .from('projects')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.log('❌ Database query failed:', error.message);
        console.log('This is expected if the projects table doesn\'t exist yet');
      } else {
        console.log('✅ Database connection successful');
      }
    } else {
      console.log('❌ Supabase client not initialized - check environment variables');
    }
    
    if (supabaseAdmin) {
      console.log('✅ Supabase admin client initialized');
    } else {
      console.log('❌ Supabase admin client not initialized');
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

testConnection();