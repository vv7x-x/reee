/**
 * Cosmic Living Library — Main entry: hero, library grid, categories
 */

import { fetchBooks } from './api.js';

const heroBooksContainer = document.getElementById('heroBooks');
const booksGrid = document.getElementById('booksGrid');
const categoryTabs = document.getElementById('categoryTabs');
const libraryLoading = document.getElementById('libraryLoading');
const libraryEmpty = document.getElementById('libraryEmpty');

// ——— Cosmic background ———
if (window.createStarfield) window.createStarfield(document.body);
if (window.createParticles) window.createParticles(document.body, 28);

// ——— Hero: decorative floating books (placeholders) ———
const heroPlaceholders = [
  'https://picsum.photos/400/600?random=cosmic1',
  'https://picsum.photos/400/600?random=cosmic2',
  'https://picsum.photos/400/600?random=cosmic3',
];

heroPlaceholders.forEach((src, i) => {
  const card = document.createElement('div');
  card.className = 'book-card-3d float-animate glow-box';
  card.style.animationDelay = `${i * 0.3}s`;
  card.innerHTML = `
    <div class="cover"><img src="${src}" alt="" loading="lazy" /></div>
    <div class="spine"></div>
  `;
  heroBooksContainer.appendChild(card);
});

// ——— Scroll reveal ———
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('visible');
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );
  els.forEach((el) => observer.observe(el));
}
initReveal();

// ——— Categories (from books or default) ———
const DEFAULT_CATEGORIES = [
  { id: 'all', label: 'الكل' },
  { id: 'general', label: 'عام' },
  { id: 'science', label: 'علم' },
  { id: 'literature', label: 'أدب' },
  { id: 'philosophy', label: 'فلسفة' },
  { id: 'history', label: 'تاريخ' },
];

function renderCategoryTabs(categories, activeId = 'all') {
  categoryTabs.innerHTML = '';
  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'category-tab' + (cat.id === activeId ? ' active' : '');
    btn.textContent = cat.label;
    btn.dataset.category = cat.id;
    btn.addEventListener('click', () => {
      categoryTabs.querySelectorAll('.category-tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      loadBooks(cat.id);
    });
    categoryTabs.appendChild(btn);
  });
}

// ——— Load and render books ———
async function loadBooks(category = 'all') {
  libraryLoading.hidden = false;
  libraryEmpty.hidden = true;
  booksGrid.innerHTML = '';

  try {
    const books = await fetchBooks(category === 'all' ? null : category);

    if (books.length === 0) {
      libraryEmpty.hidden = false;
    } else {
      books.forEach((book) => {
        const wrap = document.createElement('a');
        wrap.href = `book.html?id=${encodeURIComponent(book.id)}`;
        wrap.className = 'book-card-wrap reveal';
        wrap.innerHTML = `
          <div class="book-card-3d glow-box glow-box-hover">
            <div class="cover">
              <img src="${escapeAttr(book.cover_url || 'https://picsum.photos/400/600?random=book')}" alt="${escapeAttr(book.title)}" loading="lazy" />
            </div>
            <div class="spine"></div>
          </div>
          <span class="book-title">${escapeHtml(book.title)}</span>
          <span class="book-meta">${escapeHtml(book.category)} · ${book.view_count || 0} مشاهدة</span>
        `;
        booksGrid.appendChild(wrap);
      });

      if (window.initTilt) window.initTilt(booksGrid.querySelectorAll('.book-card-3d'));
    }
  } catch (err) {
    console.error(err);
    libraryEmpty.textContent = 'حدث خطأ في التحميل.';
    libraryEmpty.hidden = false;
  } finally {
    libraryLoading.hidden = true;
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

// ——— Extract categories from books and merge with defaults ———
async function initCategories() {
  let books = [];
  try {
    books = await fetchBooks(null);
  } catch (_) {}
  const fromBooks = [...new Set((books || []).map((b) => b.category).filter(Boolean))];
  const known = new Set(DEFAULT_CATEGORIES.map((c) => c.id));
  const categories = [...DEFAULT_CATEGORIES];
  fromBooks.forEach((id) => {
    if (!known.has(id)) {
      known.add(id);
      categories.push({ id, label: id });
    }
  });
  renderCategoryTabs(categories);
}

// ——— Init ———
async function init() {
  await initCategories();
  await loadBooks('all');
}

init();
