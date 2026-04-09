/* ═══════════════════════════════════════════════════════
   Library OS — script.js
   School Library Management System
   ═══════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════
//  STORAGE HELPERS
// ═══════════════════════════════════════════
const S = {
  get: (k, d = []) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};

// ═══════════════════════════════════════════
//  APP STATE
// ═══════════════════════════════════════════
let currentUser = null;
let currentSort = 'title';
let borrowingBookId = null;

// ═══════════════════════════════════════════
//  SEED DATA  (runs once on first load)
// ═══════════════════════════════════════════
function seedData() {
  if (S.get('seeded', false)) return;

  const users = [
    { id: 'u1', username: 'admin',     password: 'admin123', role: 'admin',   name: 'Administrator',  studentId: 'ADMIN-001',       borrowHistory: [] },
    { id: 'u2', username: 'student01', password: 'pass123',  role: 'student', name: 'Alex Johnson',   studentId: 'STU-2024-001',    borrowHistory: [] },
    { id: 'u3', username: 'student02', password: 'pass123',  role: 'student', name: 'Maria Garcia',   studentId: 'STU-2024-002',    borrowHistory: [] }
  ];
  S.set('users', users);

  const books = [
    { id: 'b1',  title: 'The Great Gatsby',                         author: 'F. Scott Fitzgerald', genre: 'Classic',         isbn: '978-0743273565', year: 1925, qty: 3, cover: '', addedAt: Date.now() - 86400000*6, favBy: [] },
    { id: 'b2',  title: 'To Kill a Mockingbird',                    author: 'Harper Lee',           genre: 'Classic',         isbn: '978-0061935466', year: 1960, qty: 2, cover: '', addedAt: Date.now() - 86400000*5, favBy: [] },
    { id: 'b3',  title: '1984',                                     author: 'George Orwell',        genre: 'Dystopian',       isbn: '978-0451524935', year: 1949, qty: 4, cover: '', addedAt: Date.now() - 86400000*4, favBy: [] },
    { id: 'b4',  title: 'Brave New World',                          author: 'Aldous Huxley',        genre: 'Dystopian',       isbn: '978-0060850524', year: 1932, qty: 2, cover: '', addedAt: Date.now() - 86400000*3, favBy: [] },
    { id: 'b5',  title: "The Hitchhiker's Guide to the Galaxy",     author: 'Douglas Adams',        genre: 'Science Fiction', isbn: '978-0345391803', year: 1979, qty: 3, cover: '', addedAt: Date.now() - 86400000*2, favBy: [] },
    { id: 'b6',  title: 'Dune',                                     author: 'Frank Herbert',        genre: 'Science Fiction', isbn: '978-0441013593', year: 1965, qty: 2, cover: '', addedAt: Date.now() - 86400000*1, favBy: [] },
    { id: 'b7',  title: "Harry Potter and the Sorcerer's Stone",    author: 'J.K. Rowling',         genre: 'Fantasy',         isbn: '978-0439708180', year: 1997, qty: 5, cover: '', addedAt: Date.now() - 3600000*6,  favBy: [] },
    { id: 'b8',  title: 'The Lord of the Rings',                    author: 'J.R.R. Tolkien',       genre: 'Fantasy',         isbn: '978-0544003415', year: 1954, qty: 2, cover: '', addedAt: Date.now() - 3600000*4,  favBy: [] },
    { id: 'b9',  title: 'The Alchemist',                            author: 'Paulo Coelho',         genre: 'Philosophy',      isbn: '978-0062315007', year: 1988, qty: 3, cover: '', addedAt: Date.now() - 3600000*2,  favBy: [] },
    { id: 'b10', title: 'Sapiens',                                  author: 'Yuval Noah Harari',    genre: 'Non-Fiction',     isbn: '978-0062316097', year: 2011, qty: 2, cover: '', addedAt: Date.now() - 1800000,     favBy: [] },
    { id: 'b11', title: 'The Catcher in the Rye',                   author: 'J.D. Salinger',        genre: 'Classic',         isbn: '978-0316769174', year: 1951, qty: 2, cover: '', addedAt: Date.now() - 900000,      favBy: [] },
    { id: 'b12', title: 'Ender\'s Game',                            author: 'Orson Scott Card',     genre: 'Science Fiction', isbn: '978-0812550702', year: 1985, qty: 3, cover: '', addedAt: Date.now() - 600000,      favBy: [] }
  ];
  S.set('books', books);
  S.set('borrows', []);
  S.set('seeded', true);
}

// ═══════════════════════════════════════════
//  NOTIFICATIONS
// ═══════════════════════════════════════════
function notify(title, msg, type = 'info') {
  const wrap = document.getElementById('notif-wrap');
  const n = document.createElement('div');
  n.className = `notif ${type}`;
  n.innerHTML = `
    <div class="notif-dot"></div>
    <div class="notif-body">
      <div class="notif-title">${title}</div>
      ${msg ? `<div class="notif-msg">${msg}</div>` : ''}
    </div>`;
  wrap.appendChild(n);
  setTimeout(() => { n.classList.add('out'); setTimeout(() => n.remove(), 350); }, 3500);
}

// ═══════════════════════════════════════════
//  AUTH SYSTEM
// ═══════════════════════════════════════════

/** Switch between Login / Sign Up tabs */
function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t, i) =>
    t.classList.toggle('active', i === (tab === 'login' ? 0 : 1)));
  document.getElementById('login-panel').style.display   = tab === 'login'  ? '' : 'none';
  document.getElementById('signup-panel').style.display  = tab === 'signup' ? '' : 'none';
}

/** Authenticate existing user */
function doLogin() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value;
  const users = S.get('users', []);
  const user = users.find(x => x.username === u && x.password === p);
  if (!user) { notify('Login Failed', 'Invalid username or password', 'error'); return; }
  currentUser = user;
  S.set('session', user.id);
  enterApp();
}

/** Register new user */
function doSignup() {
  const name = document.getElementById('su-name').value.trim();
  const user = document.getElementById('su-user').value.trim();
  const pass = document.getElementById('su-pass').value;
  const role = document.getElementById('su-role').value;
  if (!name || !user || !pass) { notify('Missing Fields', 'Please fill all fields', 'error'); return; }
  if (pass.length < 6) { notify('Weak Password', 'Minimum 6 characters required', 'error'); return; }
  const users = S.get('users', []);
  if (users.find(x => x.username === user)) { notify('Username Taken', 'Choose another username', 'error'); return; }
  const id  = 'u' + Date.now();
  const sid = role === 'student'
    ? 'STU-' + new Date().getFullYear() + '-' + String(users.filter(x => x.role === 'student').length + 1).padStart(3, '0')
    : 'ADMIN-' + String(Date.now()).slice(-3);
  users.push({ id, username: user, password: pass, role, name, studentId: sid, borrowHistory: [] });
  S.set('users', users);
  notify('Account Created', 'You can now sign in', 'success');
  switchAuthTab('login');
  document.getElementById('login-user').value = user;
  document.getElementById('login-pass').value = '';
}

/** Log out and return to auth screen */
function doLogout() {
  currentUser = null;
  S.set('session', null);
  document.getElementById('app').classList.remove('visible');
  document.getElementById('auth-screen').style.display = 'flex';
  notify('Logged Out', 'See you next time!', 'info');
}

/** Initialize the main app after login */
function enterApp() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app').classList.add('visible');
  // Update topbar user info
  document.getElementById('topbar-avatar').textContent = currentUser.name.charAt(0).toUpperCase();
  document.getElementById('topbar-name').textContent   = currentUser.name;
  document.getElementById('topbar-role').textContent   = currentUser.role === 'admin' ? 'Admin' : 'Student';
  // Show/hide admin-only elements
  document.querySelectorAll('.admin-only, .admin-panel').forEach(el => {
    el.style.display = currentUser.role === 'admin' ? '' : 'none';
  });
  showPanel('dashboard');
}

/** Try to restore a previous session from localStorage */
function tryRestoreSession() {
  seedData();
  const sid = S.get('session', null);
  if (sid) {
    const user = S.get('users', []).find(u => u.id === sid);
    if (user) { currentUser = user; enterApp(); return; }
  }
}

// ═══════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════
function showPanel(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + name)?.classList.add('active');
  document.getElementById('nav-' + name)?.classList.add('active');
  // Render the relevant panel
  const renderers = {
    dashboard: renderDashboard,
    books:     renderBooks,
    borrow:    renderBorrows,
    profile:   renderProfile,
    admin:     renderAdmin,
    students:  renderStudents
  };
  renderers[name]?.();
}

// ═══════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════
function renderDashboard() {
  const now  = new Date();
  const h    = now.getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('dash-greeting').textContent = `${greet}, ${currentUser.name}! 👋`;
  document.getElementById('dash-date').textContent     = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const books   = S.get('books',   []);
  const borrows = S.get('borrows', []);
  const active  = borrows.filter(b => !b.returnedAt);
  const overdue = active.filter(b => new Date(b.dueDate) < now);
  const totalCopies    = books.reduce((s, b) => s + b.qty, 0);
  const borrowedCopies = active.length;

  // Stats cards
  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total Books</div>
      <div class="stat-value" style="color:var(--accent2)">${books.length}</div>
      <div class="stat-sub">${totalCopies} total copies</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Available</div>
      <div class="stat-value" style="color:var(--green)">${totalCopies - borrowedCopies}</div>
      <div class="stat-sub">copies on shelf</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Borrowed</div>
      <div class="stat-value" style="color:var(--blue)">${active.length}</div>
      <div class="stat-sub">active loans</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Overdue</div>
      <div class="stat-value" style="color:var(--red)">${overdue.length}</div>
      <div class="stat-sub">need returning</div>
    </div>`;

  // Overdue alert banner
  const ob = document.getElementById('overdue-banner-wrap');
  if (currentUser.role === 'student') {
    const mine = overdue.filter(b => b.userId === currentUser.id);
    ob.innerHTML = mine.length
      ? `<div class="overdue-banner">⚠️ You have ${mine.length} overdue book(s)! Please return them soon.</div>` : '';
  } else {
    ob.innerHTML = overdue.length
      ? `<div class="overdue-banner">⚠️ ${overdue.length} overdue book(s) across all students</div>` : '';
  }

  // Recently added horizontal scroll
  const recent = [...books].sort((a, b) => b.addedAt - a.addedAt).slice(0, 10);
  document.getElementById('recent-scroll').innerHTML = recent.map(b => bookMiniCard(b)).join('');

  // My current borrows
  const myBorrows = borrows.filter(b => b.userId === currentUser.id && !b.returnedAt);
  const ml = document.getElementById('my-borrows-list');
  if (!myBorrows.length) {
    ml.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📭</div>
      <div class="empty-title">No active borrows</div>
      <div>Head to the Books tab to find something to read!</div>
    </div>`;
  } else {
    ml.innerHTML = `<div class="history-list">${myBorrows.map(b => {
      const book = books.find(x => x.id === b.bookId);
      const late = new Date(b.dueDate) < now;
      return `<div class="history-item">
        <div class="history-icon" style="background:${late ? 'rgba(240,86,90,0.15)' : 'rgba(78,168,222,0.15)'}">
          ${late ? '⚠️' : '📖'}
        </div>
        <div style="flex:1">
          <div class="history-title">${book?.title || 'Unknown'}</div>
          <div class="history-meta">
            Due: ${new Date(b.dueDate).toLocaleDateString()}
            ${late ? '<span class="badge badge-red" style="margin-left:6px">OVERDUE</span>' : ''}
          </div>
        </div>
        <button class="btn-sm btn-green" onclick="returnBook('${b.id}')">Return</button>
      </div>`;
    }).join('')}</div>`;
  }
}

/** Mini card for "Recently Added" strip */
function bookMiniCard(b) {
  const emoji = genreEmoji(b.genre);
  return `<div class="recent-card" onclick="showBookDetail('${b.id}')">
    ${b.cover
      ? `<img class="recent-cover" src="${b.cover}" onerror="this.style.display='none';this.nextSibling.style.display='flex'"/>
         <div class="recent-cover-ph" style="display:none">${emoji}</div>`
      : `<div class="recent-cover-ph">${emoji}</div>`}
    <div class="recent-title">${b.title}</div>
    <div class="recent-author">${b.author}</div>
  </div>`;
}

// ═══════════════════════════════════════════
//  BOOKS
// ═══════════════════════════════════════════

/** Map genre to an emoji for visual variety */
function genreEmoji(g) {
  const map = {
    'Science Fiction': '🚀', 'Fantasy': '🧙', 'Classic': '📜',
    'Dystopian': '🌑', 'Non-Fiction': '📊', 'Philosophy': '🤔',
    'History': '🏛️', 'Mystery': '🔍', 'Romance': '💕',
    'Horror': '👻', 'Biography': '👤', 'Science': '🔬'
  };
  return map[g] || '📚';
}

/** How many copies of a book are currently available */
function getAvailableCopies(bookId) {
  const books   = S.get('books',   []);
  const borrows = S.get('borrows', []);
  const book = books.find(b => b.id === bookId);
  if (!book) return 0;
  const out = borrows.filter(b => b.bookId === bookId && !b.returnedAt).length;
  return book.qty - out;
}

/** Change sort mode and re-render */
function setSort(s, el) {
  currentSort = s;
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  el?.classList.add('active');
  renderBooks();
}

/** Render the full book grid with search / filter / sort applied */
function renderBooks() {
  let books = [...S.get('books', [])];
  const q      = document.getElementById('book-search')?.value.toLowerCase() || '';
  const genre  = document.getElementById('filter-genre')?.value  || '';
  const avail  = document.getElementById('filter-avail')?.value  || '';

  // Rebuild genre dropdown while preserving selection
  const genres = [...new Set(books.map(b => b.genre).filter(Boolean))].sort();
  const gsel = document.getElementById('filter-genre');
  if (gsel) {
    const cur = gsel.value;
    gsel.innerHTML = '<option value="">All Genres</option>' +
      genres.map(g => `<option ${g === cur ? 'selected' : ''}>${g}</option>`).join('');
  }

  // Apply filters
  if (q)     books = books.filter(b =>
    b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || (b.isbn || '').includes(q));
  if (genre) books = books.filter(b => b.genre === genre);
  if (avail === 'available') books = books.filter(b => getAvailableCopies(b.id) > 0);
  if (avail === 'borrowed')  books = books.filter(b => getAvailableCopies(b.id) === 0);

  // Apply sort
  if (currentSort === 'title')   books.sort((a, b) => a.title.localeCompare(b.title));
  if (currentSort === 'author')  books.sort((a, b) => a.author.localeCompare(b.author));
  if (currentSort === 'genre')   books.sort((a, b) => (a.genre || '').localeCompare(b.genre || ''));
  if (currentSort === 'year')    books.sort((a, b) => b.year - a.year);
  if (currentSort === 'recent')  books.sort((a, b) => b.addedAt - a.addedAt);

  const grid = document.getElementById('books-grid');
  if (!books.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">🔍</div>
      <div class="empty-title">No books found</div>
      <div>Try adjusting your search or filters</div>
    </div>`;
    return;
  }
  grid.innerHTML = books.map(b => renderBookCard(b)).join('');
}

/** Build HTML for a single book card */
function renderBookCard(b) {
  const avail = getAvailableCopies(b.id);
  const isFav = (b.favBy || []).includes(currentUser.id);
  const emoji = genreEmoji(b.genre);
  return `<div class="book-card" id="card-${b.id}">
    <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav('${b.id}',event)"
      title="${isFav ? 'Unfavourite' : 'Favourite'}">${isFav ? '★' : '☆'}</button>
    ${b.cover
      ? `<img class="book-cover" src="${b.cover}" onclick="showBookDetail('${b.id}')"
           onerror="this.style.display='none';this.nextSibling.style.display='flex'"/>
         <div class="book-cover-placeholder" style="display:none" onclick="showBookDetail('${b.id}')">${emoji}</div>`
      : `<div class="book-cover-placeholder" onclick="showBookDetail('${b.id}')">${emoji}</div>`}
    <div class="book-info">
      <div class="book-title">${b.title}</div>
      <div class="book-author">${b.author}</div>
      <div class="book-meta">
        <span class="badge ${avail > 0 ? 'badge-green' : 'badge-red'}">${avail > 0 ? avail + ' left' : 'None'}</span>
        ${b.genre ? `<span style="font-size:11px;color:var(--text3)">${b.genre}</span>` : ''}
      </div>
      <div class="book-actions">
        <button class="btn-sm ${avail > 0 ? 'btn-accent' : 'btn-outline'}"
          onclick="${avail > 0 ? `openBorrowModal('${b.id}')` : 'void(0)'}"
          style="font-size:11px;padding:5px 0;opacity:${avail > 0 ? 1 : 0.5};flex:1">
          ${avail > 0 ? 'Borrow' : 'Unavailable'}
        </button>
        ${currentUser.role === 'admin' ? `
          <button class="btn-sm btn-outline" onclick="openBookModal('${b.id}')" style="font-size:11px;padding:5px 8px" title="Edit">✏️</button>
          <button class="btn-sm btn-danger"  onclick="deleteBook('${b.id}')"    style="font-size:11px;padding:5px 8px" title="Delete">🗑</button>` : ''}
      </div>
    </div>
  </div>`;
}

/** Toggle a book as favourite for the current user */
function toggleFav(id, e) {
  e.stopPropagation();
  const books = S.get('books', []);
  const b = books.find(x => x.id === id);
  if (!b) return;
  b.favBy = b.favBy || [];
  const idx = b.favBy.indexOf(currentUser.id);
  if (idx > -1) b.favBy.splice(idx, 1);
  else b.favBy.push(currentUser.id);
  S.set('books', books);
  renderBooks();
}

/** Simulate barcode scanner — highlight matching book on ISBN input */
function scanISBN(val) {
  if (val.length >= 10) {
    const books = S.get('books', []);
    const found = books.find(b => b.isbn === val.trim());
    if (found) {
      // Remove previous highlights
      document.querySelectorAll('.book-card.highlight').forEach(c => c.classList.remove('highlight'));
      const el = document.getElementById('card-' + found.id);
      if (el) {
        el.classList.add('highlight');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => el.classList.remove('highlight'), 2500);
      }
      notify('Book Found', `"${found.title}" highlighted`, 'success');
    } else if (val.length >= 13) {
      notify('Not Found', 'No book with that ISBN', 'warn');
    }
  }
}

// ═══════════════════════════════════════════
//  BOOK MODAL (Add / Edit)
// ═══════════════════════════════════════════
function openBookModal(id) {
  document.getElementById('book-modal-title').textContent = id ? 'Edit Book' : 'Add New Book';
  document.getElementById('bm-id').value = id || '';
  if (id) {
    const b = S.get('books', []).find(x => x.id === id);
    if (!b) return;
    document.getElementById('bm-title').value  = b.title;
    document.getElementById('bm-author').value = b.author;
    document.getElementById('bm-genre').value  = b.genre  || '';
    document.getElementById('bm-isbn').value   = b.isbn   || '';
    document.getElementById('bm-year').value   = b.year   || '';
    document.getElementById('bm-qty').value    = b.qty    || 1;
    document.getElementById('bm-cover').value  = b.cover  || '';
  } else {
    ['bm-title','bm-author','bm-genre','bm-isbn','bm-year','bm-cover'].forEach(i => {
      document.getElementById(i).value = '';
    });
    document.getElementById('bm-qty').value = 1;
  }
  document.getElementById('book-modal').classList.add('open');
}

/** Save (add or update) a book */
function saveBook() {
  const title  = document.getElementById('bm-title').value.trim();
  const author = document.getElementById('bm-author').value.trim();
  if (!title || !author) { notify('Missing Fields', 'Title and author are required', 'error'); return; }

  const id    = document.getElementById('bm-id').value;
  const books = S.get('books', []);
  const bookData = {
    title, author,
    genre:  document.getElementById('bm-genre').value.trim(),
    isbn:   document.getElementById('bm-isbn').value.trim(),
    year:   parseInt(document.getElementById('bm-year').value)  || 0,
    qty:    parseInt(document.getElementById('bm-qty').value)   || 1,
    cover:  document.getElementById('bm-cover').value.trim(),
  };

  if (id) {
    // Update existing
    const idx = books.findIndex(b => b.id === id);
    books[idx] = { ...books[idx], ...bookData };
    notify('Book Updated', `"${title}" has been updated`, 'success');
  } else {
    // Add new
    bookData.id      = 'b' + Date.now();
    bookData.addedAt = Date.now();
    bookData.favBy   = [];
    books.push(bookData);
    notify('Book Added', `"${title}" added to the catalog`, 'success');
  }

  S.set('books', books);
  closeModal('book-modal');
  renderBooks();
}

/** Delete a book (admin only) */
function deleteBook(id) {
  if (!confirm('Delete this book? This cannot be undone.')) return;
  const books = S.get('books', []).filter(b => b.id !== id);
  S.set('books', books);
  notify('Book Deleted', 'Book removed from catalog', 'info');
  renderBooks();
}

/** Show the book detail modal */
function showBookDetail(id) {
  const b = S.get('books', []).find(x => x.id === id);
  if (!b) return;
  const avail = getAvailableCopies(id);
  const emoji = genreEmoji(b.genre);
  document.getElementById('detail-modal-content').innerHTML = `
    <div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap">
      <div style="flex-shrink:0;width:100px;height:140px;border-radius:8px;overflow:hidden;
                  background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:40px">
        ${b.cover
          ? `<img src="${b.cover}" style="width:100%;height:100%;object-fit:cover"
               onerror="this.parentNode.innerHTML='${emoji}'">`
          : emoji}
      </div>
      <div style="flex:1;min-width:160px">
        <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:700;margin-bottom:4px;line-height:1.2">
          ${b.title}
        </div>
        <div style="color:var(--text2);margin-bottom:12px">by ${b.author}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px">
          ${b.genre  ? `<span class="badge badge-purple">${b.genre}</span>` : ''}
          ${b.year   ? `<span class="badge badge-blue">${b.year}</span>` : ''}
          <span class="badge ${avail > 0 ? 'badge-green' : 'badge-red'}">${avail} available</span>
        </div>
        ${b.isbn ? `<div style="font-size:12px;color:var(--text3);margin-bottom:4px">ISBN: ${b.isbn}</div>` : ''}
        <div style="font-size:12px;color:var(--text3)">Total copies: ${b.qty}</div>
      </div>
    </div>
    <div style="margin-top:20px;display:flex;gap:8px;flex-wrap:wrap">
      ${avail > 0
        ? `<button class="btn-sm btn-accent" onclick="closeModal('detail-modal');openBorrowModal('${id}')">Borrow this book</button>`
        : `<button class="btn-sm btn-outline" disabled style="opacity:.5">No copies available</button>`}
      ${currentUser.role === 'admin'
        ? `<button class="btn-sm btn-outline" onclick="closeModal('detail-modal');openBookModal('${id}')">Edit</button>` : ''}
    </div>`;
  document.getElementById('detail-modal').classList.add('open');
}

// ═══════════════════════════════════════════
//  BORROW SYSTEM
// ═══════════════════════════════════════════

/** Open the borrow confirmation modal */
function openBorrowModal(bookId) {
  borrowingBookId = bookId;
  const b = S.get('books', []).find(x => x.id === bookId);
  document.getElementById('borrow-modal-info').innerHTML = `
    <div style="background:var(--bg3);border-radius:8px;padding:12px 16px;display:flex;gap:12px;align-items:center">
      <span style="font-size:28px">${genreEmoji(b.genre)}</span>
      <div>
        <div style="font-weight:600">${b.title}</div>
        <div style="font-size:13px;color:var(--text2)">${b.author}</div>
      </div>
    </div>`;
  // Default due date = 14 days from now
  const due = new Date();
  due.setDate(due.getDate() + 14);
  document.getElementById('bm-due').value = due.toISOString().split('T')[0];
  document.getElementById('borrow-modal').classList.add('open');
}

/** Confirm and record a borrow */
function confirmBorrow() {
  if (!borrowingBookId) return;
  const due = document.getElementById('bm-due').value;
  if (!due) { notify('Select Due Date', 'Please pick a return date', 'error'); return; }

  // Re-check availability
  if (getAvailableCopies(borrowingBookId) <= 0) {
    notify('No Copies Available', 'All copies are currently borrowed', 'error');
    return;
  }

  const borrows = S.get('borrows', []);
  const books   = S.get('books',   []);
  const book    = books.find(b => b.id === borrowingBookId);

  borrows.push({
    id:         'br' + Date.now(),
    bookId:     borrowingBookId,
    userId:     currentUser.id,
    borrowedAt: new Date().toISOString(),
    dueDate:    due,
    returnedAt: null,
    notified:   false
  });
  S.set('borrows', borrows);

  closeModal('borrow-modal');
  notify('Book Borrowed!', `"${book.title}" is due ${new Date(due).toLocaleDateString()}`, 'success');
  renderBooks();
}

/** Mark a borrow as returned */
function returnBook(borrowId) {
  const borrows = S.get('borrows', []);
  const b = borrows.find(x => x.id === borrowId);
  if (!b) return;
  b.returnedAt = new Date().toISOString();
  S.set('borrows', borrows);
  const book = S.get('books', []).find(x => x.id === b.bookId);
  notify('Book Returned', `"${book?.title || 'Book'}" returned successfully`, 'success');
  // Re-render whichever panel is active
  const active = document.querySelector('.panel.active')?.id;
  if (active === 'panel-dashboard') renderDashboard();
  else if (active === 'panel-borrow') renderBorrows();
  else if (active === 'panel-profile') renderProfile();
}

/** Render the Borrow/Return panel */
function renderBorrows() {
  const borrows = S.get('borrows', []).filter(b => !b.returnedAt);
  const books   = S.get('books',   []);
  const users   = S.get('users',   []);
  const now     = new Date();

  const myBorrows = currentUser.role === 'admin'
    ? borrows
    : borrows.filter(b => b.userId === currentUser.id);

  document.getElementById('active-borrow-count').textContent = myBorrows.length;
  const wrap = document.getElementById('borrow-list-wrap');

  if (!myBorrows.length) {
    wrap.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📚</div>
      <div class="empty-title">No active borrows</div>
      <div>All books are on the shelves!</div>
    </div>`;
    return;
  }

  const adminCol = currentUser.role === 'admin' ? '<th>Student</th>' : '';
  wrap.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Book</th>${adminCol}<th>Borrowed</th><th>Due</th><th>Status</th><th>Action</th></tr></thead>
    <tbody>${myBorrows.map(b => {
      const book = books.find(x => x.id === b.bookId);
      const user = users.find(x => x.id === b.userId);
      const late = new Date(b.dueDate) < now;
      return `<tr>
        <td>
          <div style="font-weight:500">${book?.title || 'Unknown'}</div>
          <div style="font-size:12px;color:var(--text2)">${book?.author || ''}</div>
        </td>
        ${currentUser.role === 'admin' ? `
          <td>
            <div>${user?.name || '?'}</div>
            <div style="font-size:11px;color:var(--text2)">${user?.studentId || ''}</div>
          </td>` : ''}
        <td>${new Date(b.borrowedAt).toLocaleDateString()}</td>
        <td>${new Date(b.dueDate).toLocaleDateString()}</td>
        <td><span class="badge ${late ? 'badge-red' : 'badge-green'}">${late ? 'Overdue' : 'Active'}</span></td>
        <td>
          <div class="td-actions">
            <button class="btn-sm btn-green" onclick="returnBook('${b.id}')">Return</button>
          </div>
        </td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

// ═══════════════════════════════════════════
//  STUDENT PROFILE
// ═══════════════════════════════════════════
function renderProfile() {
  const borrows = S.get('borrows', []);
  const books   = S.get('books',   []);
  const now     = new Date();
  const myAll    = borrows.filter(b => b.userId === currentUser.id);
  const myActive = myAll.filter(b => !b.returnedAt);
  const myOverdue = myActive.filter(b => new Date(b.dueDate) < now);

  document.getElementById('profile-content').innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar">${currentUser.name.charAt(0)}</div>
      <div>
        <div class="profile-name">${currentUser.name}</div>
        <div class="profile-id">${currentUser.studentId} · ${currentUser.role === 'admin' ? 'Administrator' : 'Student'}</div>
        <div class="profile-stats">
          <div>
            <div class="profile-stat-n">${myActive.length}</div>
            <div class="profile-stat-l">Currently Borrowed</div>
          </div>
          <div>
            <div class="profile-stat-n">${myAll.filter(b => b.returnedAt).length}</div>
            <div class="profile-stat-l">Books Returned</div>
          </div>
          <div>
            <div class="profile-stat-n" style="color:${myOverdue.length ? 'var(--red)' : 'var(--accent2)'}">${myOverdue.length}</div>
            <div class="profile-stat-l">Overdue</div>
          </div>
        </div>
      </div>
    </div>
    <div class="section-head"><div class="section-title">Borrow History</div></div>
    <div class="history-list">
      ${myAll.length ? myAll.reverse().map(b => {
        const book     = books.find(x => x.id === b.bookId);
        const returned = !!b.returnedAt;
        const late     = !returned && new Date(b.dueDate) < now;
        return `<div class="history-item">
          <div class="history-icon" style="background:${returned ? 'rgba(34,201,122,0.12)' : late ? 'rgba(240,86,90,0.12)' : 'rgba(78,168,222,0.12)'}">
            ${returned ? '✅' : late ? '⚠️' : '📖'}
          </div>
          <div style="flex:1">
            <div class="history-title">${book?.title || 'Unknown Book'}</div>
            <div class="history-meta">
              ${returned
                ? `Returned ${new Date(b.returnedAt).toLocaleDateString()}`
                : `Due ${new Date(b.dueDate).toLocaleDateString()}`}
              ${late ? '<span class="badge badge-red" style="margin-left:6px">OVERDUE</span>' : ''}
            </div>
          </div>
          <span class="badge ${returned ? 'badge-green' : late ? 'badge-red' : 'badge-blue'}">
            ${returned ? 'Returned' : late ? 'Overdue' : 'Active'}
          </span>
        </div>`;
      }).join('') : `<div class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-title">No borrow history yet</div>
        <div>Borrow your first book to get started!</div>
      </div>`}
    </div>`;
}

// ═══════════════════════════════════════════
//  ADMIN PANEL
// ═══════════════════════════════════════════
function renderAdmin() {
  const borrows = S.get('borrows', []).filter(b => !b.returnedAt);
  const books   = S.get('books',   []);
  const users   = S.get('users',   []);
  const now     = new Date();
  const overdue = borrows.filter(b => new Date(b.dueDate) < now);

  // Overdue alert
  const ob = document.getElementById('admin-overdue-wrap');
  ob.style.display = overdue.length ? 'flex' : 'none';
  if (overdue.length) document.getElementById('admin-overdue-count').textContent = overdue.length;

  document.getElementById('admin-borrow-tbody').innerHTML = borrows.map(b => {
    const book = books.find(x => x.id === b.bookId);
    const user = users.find(x => x.id === b.userId);
    const late = new Date(b.dueDate) < now;
    return `<tr>
      <td>
        <div style="font-weight:500">${book?.title || '?'}</div>
        <div style="font-size:11px;color:var(--text2)">${book?.isbn || ''}</div>
      </td>
      <td>
        <div>${user?.name || '?'}</div>
        <div style="font-size:11px;color:var(--text2)">${user?.studentId || ''}</div>
      </td>
      <td>${new Date(b.borrowedAt).toLocaleDateString()}</td>
      <td>${new Date(b.dueDate).toLocaleDateString()}</td>
      <td><span class="badge ${late ? 'badge-red' : 'badge-green'}">${late ? 'Overdue' : 'Active'}</span></td>
      <td>
        <button class="btn-sm btn-outline" onclick="adminForceReturn('${b.id}')">Force Return</button>
      </td>
    </tr>`;
  }).join('');
}

/** Admin force-return any borrow */
function adminForceReturn(id) {
  const borrows = S.get('borrows', []);
  const b = borrows.find(x => x.id === id);
  if (b) b.returnedAt = new Date().toISOString();
  S.set('borrows', borrows);
  notify('Force Return', 'Book marked as returned', 'info');
  renderAdmin();
}

/** Render student directory */
function renderStudents() {
  const users   = S.get('users',   []).filter(u => u.role === 'student');
  const borrows = S.get('borrows', []);
  document.getElementById('students-tbody').innerHTML = users.map(u => {
    const myB    = borrows.filter(b => b.userId === u.id);
    const active = myB.filter(b => !b.returnedAt);
    return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:28px;height:28px;border-radius:50%;background:var(--accent);
                      display:flex;align-items:center;justify-content:center;
                      font-size:12px;font-weight:600;color:#fff;flex-shrink:0">
            ${u.name.charAt(0)}
          </div>
          ${u.name}
        </div>
      </td>
      <td><span class="badge badge-blue">${u.studentId}</span></td>
      <td style="color:var(--text2)">${u.username}</td>
      <td>${active.length}</td>
      <td>${myB.length}</td>
    </tr>`;
  }).join('');
}

// ═══════════════════════════════════════════
//  MODALS
// ═══════════════════════════════════════════
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// Close modal when clicking backdrop
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});

// Close modal with Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
});

// ═══════════════════════════════════════════
//  THEME TOGGLE
// ═══════════════════════════════════════════
function toggleTheme() {
  const html  = document.documentElement;
  const isDark = html.dataset.theme === 'dark';
  html.dataset.theme = isDark ? 'light' : 'dark';
  S.set('theme', isDark ? 'light' : 'dark');
}
// Restore saved theme
const savedTheme = S.get('theme', 'dark');
document.documentElement.dataset.theme = savedTheme;

// ═══════════════════════════════════════════
//  OVERDUE POLLING (every 60s while logged in)
// ═══════════════════════════════════════════
setInterval(() => {
  if (!currentUser) return;
  const borrows = S.get('borrows', []);
  const books   = S.get('books',   []);
  const now     = new Date();
  let changed   = false;
  borrows.forEach(b => {
    if (!b.returnedAt && !b.notified && new Date(b.dueDate) < now && b.userId === currentUser.id) {
      const book = books.find(x => x.id === b.bookId);
      notify('Overdue Book', `"${book?.title}" is past its due date!`, 'warn');
      b.notified = true;
      changed = true;
    }
  });
  if (changed) S.set('borrows', borrows);
}, 60000);

// ═══════════════════════════════════════════
//  BOOTSTRAP
// ═══════════════════════════════════════════
tryRestoreSession();
