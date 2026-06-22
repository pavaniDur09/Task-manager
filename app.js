/**
 * TaskFlow — Interactive Task Manager
 * Week 2: JavaScript Fundamentals
 * Features: DOM manipulation, event handling, localStorage,
 *           array methods, form validation, drag & drop,
 *           filtering, sorting, search, dark/light mode
 */

class TaskManager {

  constructor() {
    // Load tasks from localStorage or start with empty array
    this.tasks         = JSON.parse(localStorage.getItem('tf-tasks')) || [];
    this.currentFilter = 'all';
    this.currentSort   = 'created';
    this.searchQuery   = '';
    this.editingId     = null;
    this.dragSrcId     = null;

    this.init();
  }

  // ── Initialise ─────────────────────────────────────────
  init() {
    this.loadTheme();
    this.cacheDOM();
    this.setupEventListeners();
    this.renderTasks();
  }

  // ── Cache DOM references ────────────────────────────────
  cacheDOM() {
    this.addForm       = document.getElementById('add-form');
    this.taskInput     = document.getElementById('task-input');
    this.prioritySelect = document.getElementById('priority-select');
    this.dueDateInput  = document.getElementById('due-date');
    this.categoryInput = document.getElementById('category-input');
    this.charCount     = document.getElementById('char-count');
    this.formError     = document.getElementById('form-error');

    this.searchInput   = document.getElementById('search-input');
    this.filterBtns    = document.querySelectorAll('.filter-btn');
    this.sortBtns      = document.querySelectorAll('.sort-btn');

    this.taskList      = document.getElementById('task-list');
    this.emptyState    = document.getElementById('empty-state');
    this.emptyTitle    = document.getElementById('empty-title');
    this.emptySub      = document.getElementById('empty-sub');
    this.taskCountLabel = document.getElementById('task-count-label');

    this.totalEl      = document.getElementById('total-tasks');
    this.activeEl     = document.getElementById('active-tasks');
    this.completedEl  = document.getElementById('completed-tasks');
    this.progressBar  = document.getElementById('progress-bar');
    this.progressLabel = document.getElementById('progress-label');
    this.progressWrap = document.getElementById('progress-bar-wrap');

    this.themeBtn     = document.getElementById('theme-toggle');
    this.clearBtn     = document.getElementById('clear-completed-btn');

    this.modalOverlay = document.getElementById('modal-overlay');
    this.modalClose   = document.getElementById('modal-close');
    this.modalCancel  = document.getElementById('modal-cancel');
    this.modalSave    = document.getElementById('modal-save');
    this.editText     = document.getElementById('edit-text');
    this.editPriority = document.getElementById('edit-priority');
    this.editDue      = document.getElementById('edit-due');
    this.editCategory = document.getElementById('edit-category');
    this.editError    = document.getElementById('edit-error');
  }

  // ── Event Listeners ────────────────────────────────────
  setupEventListeners() {

    // Add task form
    this.addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddTask();
    });

    // Character counter
    this.taskInput.addEventListener('input', () => {
      const remaining = 120 - this.taskInput.value.length;
      this.charCount.textContent = remaining;
      this.charCount.className = 'char-count' +
        (remaining <= 20 ? ' warn' : '') +
        (remaining <= 0  ? ' over' : '');
      // Clear error on type
      if (this.taskInput.value.trim()) {
        this.formError.textContent = '';
        this.taskInput.classList.remove('error');
      }
    });

    // Search
    this.searchInput.addEventListener('input', () => {
      this.searchQuery = this.searchInput.value.trim().toLowerCase();
      this.renderTasks();
    });

    // Filter buttons
    this.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter;
        this.renderTasks();
      });
    });

    // Sort buttons
    this.sortBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.sortBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentSort = btn.dataset.sort;
        this.renderTasks();
      });
    });

    // Theme toggle
    this.themeBtn.addEventListener('click', () => this.toggleTheme());

    // Clear completed
    this.clearBtn.addEventListener('click', () => this.clearCompleted());

    // Modal close
    this.modalClose.addEventListener('click',  () => this.closeModal());
    this.modalCancel.addEventListener('click', () => this.closeModal());
    this.modalSave.addEventListener('click',   () => this.saveEdit());

    // Close modal on overlay click
    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) this.closeModal();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // / to focus search
      if (e.key === '/' && document.activeElement !== this.taskInput &&
          document.activeElement !== this.searchInput &&
          document.activeElement.tagName !== 'INPUT' &&
          document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        this.searchInput.focus();
      }
      // Esc to close modal or clear search
      if (e.key === 'Escape') {
        if (!this.modalOverlay.hidden) {
          this.closeModal();
        } else if (this.searchQuery) {
          this.searchInput.value = '';
          this.searchQuery = '';
          this.renderTasks();
        }
      }
    });
  }

  // ── Add Task ────────────────────────────────────────────
  handleAddTask() {
    const text = this.taskInput.value.trim();

    // Validation
    if (!text) {
      this.formError.textContent = 'Please enter a task before adding.';
      this.taskInput.classList.add('error');
      this.taskInput.focus();
      return;
    }
    if (text.length > 120) {
      this.formError.textContent = 'Task must be 120 characters or fewer.';
      this.taskInput.classList.add('error');
      return;
    }

    this.addTask(text);

    // Reset form
    this.taskInput.value   = '';
    this.categoryInput.value = '';
    this.dueDateInput.value  = '';
    this.prioritySelect.value = 'medium';
    this.charCount.textContent = '120';
    this.charCount.className = 'char-count';
    this.formError.textContent = '';
    this.taskInput.classList.remove('error');
    this.taskInput.focus();
  }

  // ── Task CRUD ───────────────────────────────────────────
  addTask(text) {
    const task = {
      id:        Date.now(),
      text:      text,
      completed: false,
      priority:  this.prioritySelect.value,
      dueDate:   this.dueDateInput.value || null,
      category:  this.categoryInput.value.trim() || null,
      createdAt: new Date().toISOString(),
    };
    this.tasks.push(task);
    this.saveTasks();
    this.renderTasks();
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.saveTasks();
    this.renderTasks();
  }

  toggleComplete(id) {
    this.tasks = this.tasks.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    this.saveTasks();
    this.renderTasks();
  }

  clearCompleted() {
    const count = this.tasks.filter(t => t.completed).length;
    if (count === 0) return;
    if (!confirm(`Remove ${count} completed task${count > 1 ? 's' : ''}?`)) return;
    this.tasks = this.tasks.filter(t => !t.completed);
    this.saveTasks();
    this.renderTasks();
  }

  // ── Edit Modal ──────────────────────────────────────────
  openEditModal(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;

    this.editingId = id;
    this.editText.value     = task.text;
    this.editPriority.value = task.priority;
    this.editDue.value      = task.dueDate || '';
    this.editCategory.value = task.category || '';
    this.editError.textContent = '';
    this.editText.classList.remove('error');

    this.modalOverlay.hidden = false;
    this.editText.focus();
    this.editText.select();
  }

  closeModal() {
    this.modalOverlay.hidden = true;
    this.editingId = null;
  }

  saveEdit() {
    const text = this.editText.value.trim();
    if (!text) {
      this.editError.textContent = 'Task cannot be empty.';
      this.editText.classList.add('error');
      this.editText.focus();
      return;
    }

    this.tasks = this.tasks.map(t =>
      t.id === this.editingId
        ? { ...t,
            text:     text,
            priority: this.editPriority.value,
            dueDate:  this.editDue.value || null,
            category: this.editCategory.value.trim() || null }
        : t
    );

    this.saveTasks();
    this.renderTasks();
    this.closeModal();
  }

  // ── Filtering ───────────────────────────────────────────
  getFilteredTasks() {
    const today = new Date().toISOString().split('T')[0];

    return this.tasks
      .filter(t => {
        // Filter
        if (this.currentFilter === 'active')    return !t.completed;
        if (this.currentFilter === 'completed') return t.completed;
        if (this.currentFilter === 'high')      return t.priority === 'high';
        if (this.currentFilter === 'overdue')   return t.dueDate && t.dueDate < today && !t.completed;
        return true; // 'all'
      })
      .filter(t => {
        // Search
        if (!this.searchQuery) return true;
        return t.text.toLowerCase().includes(this.searchQuery) ||
               (t.category && t.category.toLowerCase().includes(this.searchQuery));
      });
  }

  // ── Sorting ─────────────────────────────────────────────
  getSortedTasks(tasks) {
    const priorityOrder = { high: 0, medium: 1, low: 2 };

    return [...tasks].sort((a, b) => {
      switch (this.currentSort) {
        case 'priority':
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'due':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        case 'alpha':
          return a.text.localeCompare(b.text);
        default: // 'created' — newest first
          return b.id - a.id;
      }
    });
  }

  // ── Render ──────────────────────────────────────────────
  renderTasks() {
    const filtered = this.getFilteredTasks();
    const sorted   = this.getSortedTasks(filtered);

    this.taskList.innerHTML = '';

    if (sorted.length === 0) {
      this.emptyState.hidden = false;
      if (this.searchQuery) {
        this.emptyTitle.textContent = `No results for "${this.searchQuery}"`;
        this.emptySub.textContent   = 'Try a different search term.';
      } else if (this.currentFilter !== 'all') {
        this.emptyTitle.textContent = 'No tasks here';
        this.emptySub.textContent   = 'Try a different filter.';
      } else {
        this.emptyTitle.textContent = 'No tasks yet';
        this.emptySub.textContent   = 'Add your first task above to get started.';
      }
    } else {
      this.emptyState.hidden = true;
      sorted.forEach(task => {
        const li = this.createTaskElement(task);
        this.taskList.appendChild(li);
      });
    }

    this.taskCountLabel.textContent =
      sorted.length === this.tasks.length
        ? `${this.tasks.length} task${this.tasks.length !== 1 ? 's' : ''}`
        : `Showing ${sorted.length} of ${this.tasks.length}`;

    this.updateStats();
    this.setupDragAndDrop();
  }

  // ── Build a task <li> element ───────────────────────────
  createTaskElement(task) {
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = task.dueDate && task.dueDate < today && !task.completed;

    const li = document.createElement('li');
    li.className = [
      'task-item',
      `priority-${task.priority}`,
      task.completed ? 'completed' : '',
    ].join(' ').trim();
    li.dataset.id = task.id;
    li.setAttribute('draggable', 'true');
    li.setAttribute('role', 'listitem');

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type      = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked   = task.completed;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);
    checkbox.addEventListener('change', () => this.toggleComplete(task.id));

    // Body
    const body = document.createElement('div');
    body.className = 'task-body';

    const textEl = document.createElement('span');
    textEl.className   = 'task-text';
    textEl.textContent = task.text;

    const metaRow = document.createElement('div');
    metaRow.className = 'task-meta-row';

    // Priority badge
    const priorityBadge = document.createElement('span');
    priorityBadge.className = `task-badge badge-${task.priority}`;
    priorityBadge.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
    metaRow.appendChild(priorityBadge);

    // Category badge
    if (task.category) {
      const catBadge = document.createElement('span');
      catBadge.className   = 'task-badge badge-category';
      catBadge.textContent = task.category;
      metaRow.appendChild(catBadge);
    }

    // Due date
    if (task.dueDate) {
      const dueBadge = document.createElement('span');
      dueBadge.className = `badge-due${isOverdue ? ' overdue' : ''}`;
      const dateObj = new Date(task.dueDate + 'T00:00:00');
      dueBadge.textContent = (isOverdue ? '⚠ Overdue · ' : '📅 ') +
        dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      metaRow.appendChild(dueBadge);
    }

    body.appendChild(textEl);
    body.appendChild(metaRow);

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'task-btn edit-btn';
    editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);
    editBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    editBtn.addEventListener('click', () => this.openEditModal(task.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-btn delete-btn';
    deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
    deleteBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>`;
    deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(body);
    li.appendChild(actions);

    return li;
  }

  // ── Stats ───────────────────────────────────────────────
  updateStats() {
    const total     = this.tasks.length;
    const completed = this.tasks.filter(t => t.completed).length;
    const active    = total - completed;
    const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

    this.totalEl.textContent     = total;
    this.completedEl.textContent = completed;
    this.activeEl.textContent    = active;
    this.progressBar.style.width = pct + '%';
    this.progressLabel.textContent = pct + '% done';
    this.progressWrap.setAttribute('aria-valuenow', pct);
    this.progressWrap.setAttribute('aria-label', `${pct}% of tasks complete`);
  }

  // ── localStorage ────────────────────────────────────────
  saveTasks() {
    localStorage.setItem('tf-tasks', JSON.stringify(this.tasks));
  }

  // ── Drag & Drop (reorder tasks) ─────────────────────────
  setupDragAndDrop() {
    const items = this.taskList.querySelectorAll('.task-item');

    items.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        this.dragSrcId = Number(item.dataset.id);
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        items.forEach(i => i.classList.remove('drag-over'));
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        items.forEach(i => i.classList.remove('drag-over'));
        item.classList.add('drag-over');
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetId = Number(item.dataset.id);
        if (this.dragSrcId === targetId) return;

        // Reorder the tasks array
        const srcIdx = this.tasks.findIndex(t => t.id === this.dragSrcId);
        const tgtIdx = this.tasks.findIndex(t => t.id === targetId);
        const [moved] = this.tasks.splice(srcIdx, 1);
        this.tasks.splice(tgtIdx, 0, moved);

        this.saveTasks();
        this.renderTasks();
      });
    });
  }

  // ── Theme toggle ────────────────────────────────────────
  loadTheme() {
    const saved = localStorage.getItem('tf-theme');
    if (saved === 'light') {
      document.body.classList.add('light');
      this.updateThemeIcon(true);
    }
  }

  toggleTheme() {
    const isLight = document.body.classList.toggle('light');
    localStorage.setItem('tf-theme', isLight ? 'light' : 'dark');
    this.updateThemeIcon(isLight);
  }

  updateThemeIcon(isLight) {
    const moon = document.querySelector('.icon-moon');
    const sun  = document.querySelector('.icon-sun');
    if (!moon || !sun) return;
    if (isLight) {
      moon.style.display = 'none';
      sun.style.display  = 'block';
    } else {
      moon.style.display = 'block';
      sun.style.display  = 'none';
    }
  }
}

// ── Boot ─────────────────────────────────────────────────
const taskManager = new TaskManager();
