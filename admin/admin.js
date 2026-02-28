/**
 * Cosmic Living Library — Admin panel logic
 */

import {
  getSession,
  getProfile,
  signIn,
  signOut,
  fetchBooks,
  createBook,
  updateBook,
  deleteBook,
  getDownloadStats,
  uploadFile,
} from '../js/api.js';

const BUCKET_COVERS = 'covers';
const BUCKET_PDFS = 'pdfs';

const screenLogin = document.getElementById('screenLogin');
const screenDashboard = document.getElementById('screenDashboard');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const btnLogout = document.getElementById('btnLogout');
const btnAddBook = document.getElementById('btnAddBook');
const adminTableBody = document.getElementById('adminTableBody');
const statBooks = document.getElementById('statBooks');
const statDownloads = document.getElementById('statDownloads');
const bookModal = document.getElementById('bookModal');
const bookModalTitle = document.getElementById('bookModalTitle');
const bookForm = document.getElementById('bookForm');
const bookFormError = document.getElementById('bookFormError');
const btnCancelBook = document.getElementById('btnCancelBook');
const coverUpload = document.getElementById('coverUpload');
const pdfUpload = document.getElementById('pdfUpload');

let currentUserId = null;
let coverFile = null;
let pdfFile = null;

// ——— Auth ———
async function checkAuth() {
  const { data: { session } } = await getSession();
  if (!session) {
    screenLogin.hidden = false;
    screenDashboard.hidden = true;
    return;
  }
  const profile = await getProfile(session.user.id);
  if (profile?.role !== 'ADMIN') {
    loginError.textContent = 'ليس لديك صلاحية إدارة.';
    screenLogin.hidden = false;
    screenDashboard.hidden = true;
    return;
  }
  currentUserId = session.user.id;
  screenLogin.hidden = true;
  screenDashboard.hidden = false;
  loginError.textContent = '';
  loadDashboard();
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value;
  try {
    await signIn(email, password);
    await checkAuth();
  } catch (err) {
    loginError.textContent = err.message || 'فشل تسجيل الدخول.';
  }
});

btnLogout.addEventListener('click', async () => {
  await signOut();
  currentUserId = null;
  screenLogin.hidden = false;
  screenDashboard.hidden = true;
});

// ——— Dashboard ———
async function loadDashboard() {
  await loadStats();
  await loadBooksTable();
}

async function loadStats() {
  try {
    const books = await fetchBooks(null);
    const downloads = await getDownloadStats();
    statBooks.textContent = books.length;
    statDownloads.textContent = downloads.length;
  } catch (_) {
    statBooks.textContent = '—';
    statDownloads.textContent = '—';
  }
}

async function loadBooksTable() {
  try {
    const books = await fetchBooks(null);
    adminTableBody.innerHTML = '';
    if (books.length === 0) {
      adminTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;opacity:0.8">لا توجد كتب. انقر "إضافة كتاب" للبدء.</td></tr>';
      return;
    }
    books.forEach((book) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><img class="cover-thumb" src="${escapeAttr(book.cover_url || 'https://picsum.photos/100/140')}" alt="" /></td>
        <td>${escapeHtml(book.title)}</td>
        <td>${escapeHtml(book.category)}</td>
        <td>${book.view_count ?? 0}</td>
        <td>${book.is_paid ? 'نعم' : 'لا'}</td>
        <td>
          <button type="button" class="btn-cosmic btn-sm btn-edit" data-id="${escapeAttr(book.id)}">تعديل</button>
          <button type="button" class="btn-cosmic btn-sm btn-delete" data-id="${escapeAttr(book.id)}">حذف</button>
        </td>
      `;
      tr.querySelector('.btn-edit').addEventListener('click', () => openEditBook(book));
      tr.querySelector('.btn-delete').addEventListener('click', () => confirmDelete(book));
      adminTableBody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    adminTableBody.innerHTML = '<tr><td colspan="6">فشل تحميل القائمة.</td></tr>';
  }
}

function escapeAttr(s) {
  if (!s) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML.replace(/"/g, '&quot;');
}

function escapeHtml(s) {
  if (!s) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

// ——— Book modal ———
function openAddBook() {
  bookModalTitle.textContent = 'إضافة كتاب';
  bookForm.reset();
  document.getElementById('bookId').value = '';
  coverFile = null;
  pdfFile = null;
  coverUpload.classList.remove('has-file');
  coverUpload.querySelector('span').textContent = 'اسحب الصورة هنا أو انقر للاختيار';
  pdfUpload.classList.remove('has-file');
  pdfUpload.querySelector('span').textContent = 'اسحب PDF هنا أو انقر للاختيار';
  bookFormError.textContent = '';
  bookModal.hidden = false;
}

function openEditBook(book) {
  bookModalTitle.textContent = 'تعديل كتاب';
  document.getElementById('bookId').value = book.id;
  bookForm.title.value = book.title || '';
  bookForm.description.value = book.description || '';
  bookForm.category.value = book.category || 'general';
  bookForm.is_paid.value = book.is_paid ? 'true' : 'false';
  coverFile = null;
  pdfFile = null;
  coverUpload.classList.add('has-file');
  coverUpload.querySelector('span').textContent = book.cover_url ? 'غلاف حالي (اختر لاستبدال)' : 'لا غلاف';
  pdfUpload.classList.add('has-file');
  pdfUpload.querySelector('span').textContent = book.pdf_url ? 'PDF حالي (اختر لاستبدال)' : 'لا PDF';
  bookFormError.textContent = '';
  bookModal.hidden = false;
}

btnAddBook.addEventListener('click', openAddBook);

btnCancelBook.addEventListener('click', () => {
  bookModal.hidden = true;
});

bookModal.addEventListener('click', (e) => {
  if (e.target === bookModal) bookModal.hidden = true;
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !bookModal.hidden) bookModal.hidden = true;
});

// ——— File upload zones ———
coverUpload.addEventListener('click', () => coverUpload.querySelector('input').click());
coverUpload.querySelector('input').addEventListener('change', (e) => {
  coverFile = e.target.files[0] || null;
  coverUpload.classList.toggle('has-file', !!coverFile);
  coverUpload.querySelector('span').textContent = coverFile ? coverFile.name : 'اسحب الصورة هنا أو انقر للاختيار';
});

pdfUpload.addEventListener('click', () => pdfUpload.querySelector('input').click());
pdfUpload.querySelector('input').addEventListener('change', (e) => {
  pdfFile = e.target.files[0] || null;
  pdfUpload.classList.toggle('has-file', !!pdfFile);
  pdfUpload.querySelector('span').textContent = pdfFile ? pdfFile.name : 'اسحب PDF هنا أو انقر للاختيار';
});

// Drag and drop
function setupDrop(zone, input, setFile) {
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && (zone === coverUpload ? file.type.startsWith('image/') : file.name.toLowerCase().endsWith('.pdf'))) {
      setFile(file);
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      zone.classList.add('has-file');
      zone.querySelector('span').textContent = file.name;
    }
  });
}
setupDrop(coverUpload, coverUpload.querySelector('input'), (f) => { coverFile = f; });
setupDrop(pdfUpload, pdfUpload.querySelector('input'), (f) => { pdfFile = f; });

// ——— Save book ———
bookForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  bookFormError.textContent = '';
  const id = document.getElementById('bookId').value;
  const title = bookForm.title.value.trim();
  const description = bookForm.description.value.trim();
  const category = bookForm.category.value.trim() || 'general';
  const is_paid = bookForm.is_paid.value === 'true';

  let cover_url = null;
  let pdf_url = null;

  try {
    if (!currentUserId && (coverFile || pdfFile)) {
      bookFormError.textContent = 'يجب تسجيل الدخول أولاً.';
      return;
    }
    const uid = currentUserId || 'anon';
    const safeName = (name) => (name || 'file').replace(/[^\w\u0600-\u06FF.-]/g, '_');

    if (coverFile) {
      const path = `${uid}/${Date.now()}-${safeName(coverFile.name)}`;
      cover_url = await uploadFile(BUCKET_COVERS, path, coverFile);
    }
    if (pdfFile) {
      const path = `${uid}/${Date.now()}-${safeName(pdfFile.name)}`;
      pdf_url = await uploadFile(BUCKET_PDFS, path, pdfFile);
    }

    if (id) {
      const payload = { title, description, category, is_paid };
      if (cover_url) payload.cover_url = cover_url;
      if (pdf_url) payload.pdf_url = pdf_url;
      await updateBook(id, payload);
    } else {
      if (!cover_url) cover_url = 'https://picsum.photos/400/600?random=book';
      await createBook({ title, description, cover_url, pdf_url: pdf_url || '', category, is_paid });
    }

    bookModal.hidden = true;
    loadDashboard();
  } catch (err) {
    bookFormError.textContent = err.message || 'فشل الحفظ.';
  }
});

// ——— Delete ———
async function confirmDelete(book) {
  if (!confirm(`حذف "${book.title}"؟`)) return;
  try {
    await deleteBook(book.id);
    loadDashboard();
  } catch (err) {
    alert(err.message || 'فشل الحذف.');
  }
}

// ——— Init ———
checkAuth();
