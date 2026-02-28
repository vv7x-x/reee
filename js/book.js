/**
 * Cosmic Living Library — Book detail page
 */

import { fetchBookById, incrementBookViews, recordDownload, getSession } from './api.js';

const params = new URLSearchParams(window.location.search);
const bookId = params.get('id');

const bookLoading = document.getElementById('bookLoading');
const bookError = document.getElementById('bookError');
const bookDetail = document.getElementById('bookDetail');
const bookCover = document.getElementById('bookCover');
const bookTitle = document.getElementById('bookTitle');
const bookMeta = document.getElementById('bookMeta');
const bookDesc = document.getElementById('bookDesc');
const btnRead = document.getElementById('btnRead');
const btnDownload = document.getElementById('btnDownload');

function escapeHtml(s) {
  if (!s) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

async function loadBook() {
  if (!bookId) {
    bookLoading.hidden = true;
    bookError.hidden = false;
    return;
  }

  try {
    const book = await fetchBookById(bookId);
    if (!book) {
      bookLoading.hidden = true;
      bookError.hidden = false;
      return;
    }

    bookCover.src = book.cover_url || 'https://picsum.photos/400/600?random=book';
    bookCover.alt = book.title;
    bookTitle.textContent = book.title;
    bookMeta.innerHTML = `
      <span>${escapeHtml(book.category)}</span>
      &nbsp;·&nbsp;
      <span>${book.view_count ?? 0} مشاهدة</span>
      &nbsp;·&nbsp;
      <span>${book.is_paid ? 'مدفوع' : 'مجاني'}</span>
    `;
    bookDesc.textContent = book.description || 'لا يوجد وصف.';

    const pdfUrl = (book.pdf_url || '').trim();
    const hasPdf = pdfUrl && pdfUrl !== '#';

    if (hasPdf) {
      btnRead.href = pdfUrl;
      btnRead.target = '_blank';
      btnRead.rel = 'noopener';
      btnRead.style.display = '';
      btnRead.title = '';

      btnDownload.href = pdfUrl;
      btnDownload.download = (book.title || 'book').replace(/[^\w\u0600-\u06FF\s-]/g, '') + '.pdf';
      btnDownload.target = '_blank';
      btnDownload.style.display = '';
      btnDownload.onclick = async () => {
        const { data: { session } } = await getSession();
        if (session?.user) await recordDownload(session.user.id, book.id);
      };
    } else {
      btnRead.href = '#';
      btnRead.style.display = 'none';
      btnDownload.style.display = 'none';
    }

    document.title = `${book.title} | المكتبة الحية الكونية`;

    await incrementBookViews(book.id);

    bookLoading.hidden = true;
    bookDetail.hidden = false;
  } catch (err) {
    console.error(err);
    bookLoading.hidden = true;
    bookError.hidden = false;
  }
}

loadBook();

if (window.createStarfield) window.createStarfield(document.body);
if (window.createParticles) window.createParticles(document.body, 20);
