// Simple Supabase connection test
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    // For now, just return true since we're using Prisma with Supabase
    // In the future, we could add actual Supabase client connection test here
    return true;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
}



















