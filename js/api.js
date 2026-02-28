/**
 * Cosmic Living Library — API layer (Supabase)
 * Clean separation between UI and backend logic.
 */

const getSupabase = () => {
  const url = window.COSMIC_SUPABASE_URL || '';
  const key = window.COSMIC_SUPABASE_ANON_KEY || '';
  if (!url || !key || url.includes('YOUR_PROJECT')) {
    console.warn('Cosmic Library: Supabase not configured. Using mock data.');
    return null;
  }
  const sb = typeof window !== 'undefined' ? window.supabase : null;
  if (!sb?.createClient) return null;
  return sb.createClient(url, key);
};

const supabase = getSupabase();

// ——— Books ———
export async function fetchBooks(category = null) {
  if (!supabase) return getMockBooks();
  let q = supabase.from('books').select('*').order('created_at', { ascending: false });
  if (category && category !== 'all') q = q.eq('category', category);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function fetchBookById(id) {
  if (!supabase) return getMockBooks().find(b => b.id === id) || null;
  const { data, error } = await supabase.from('books').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function incrementBookViews(id) {
  if (!supabase) return;
  try {
    await supabase.rpc('increment_book_views', { book_uuid: id });
  } catch (_) { /* non-blocking */ }
}

export async function createBook(payload) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.from('books').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateBook(id, payload) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.from('books').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteBook(id) {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('books').delete().eq('id', id);
  if (error) throw error;
}

// ——— Storage (upload cover & PDF) ———
export async function uploadFile(bucket, path, file) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
}

// ——— Downloads ———
export async function recordDownload(userId, bookId) {
  if (!supabase) return;
  await supabase.from('downloads').insert({ user_id: userId, book_id: bookId });
}

// ——— Auth ———
export function getSession() {
  return supabase?.auth.getSession() ?? Promise.resolve({ data: { session: null } });
}

export function onAuthStateChange(callback) {
  if (!supabase) return () => {};
  return supabase.auth.onAuthStateChange(callback);
}

export async function signIn(email, password) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email, password, meta = {}) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: meta } });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

// ——— Admin: profile & stats ———
export async function getProfile(userId) {
  if (!supabase) return { role: 'READER' };
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) return null;
  return data;
}

export async function getDownloadStats() {
  if (!supabase) return [];
  const { data, error } = await supabase.from('downloads').select('book_id, downloaded_at');
  if (error) return [];
  return data || [];
}

// ——— Mock data when Supabase not configured ———
function getMockBooks() {
  return [
    {
      id: 'mock-1',
      title: 'كتاب الكون السري',
      description: 'رحلة في أعماق الفضاء والزمن.',
      cover_url: 'https://picsum.photos/400/600?random=1',
      pdf_url: '#',
      category: 'science',
      is_paid: false,
      view_count: 42,
      created_at: new Date().toISOString(),
    },
    {
      id: 'mock-2',
      title: 'أسرار المكتبة الحية',
      description: 'حكايات من عالم الكتب الخالدة.',
      cover_url: 'https://picsum.photos/400/600?random=2',
      pdf_url: '#',
      category: 'literature',
      is_paid: false,
      view_count: 18,
      created_at: new Date().toISOString(),
    },
  ];
}
