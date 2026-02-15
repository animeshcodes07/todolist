import './style.css'

// State Management
const state = {
  todos: [],
  filter: 'all'
};

// DOM Elements
const elements = {
  input: document.getElementById('todo-input'),
  addBtn: document.getElementById('add-btn'),
  list: document.getElementById('todo-list'),
  filters: document.querySelectorAll('.filter-btn'),
  itemsLeft: document.getElementById('items-left'),
  clearCompleted: document.getElementById('clear-completed'),
  notification: document.getElementById('notification-area')
};

// --- CRUD Operations ---

// Create
function addTodo(text) {
  const trimmedText = text.trim();
  if (!trimmedText) return;

  const newTodo = {
    id: Date.now(),
    text: trimmedText,
    completed: false,
    createdAt: new Date().toISOString()
  };

  state.todos.unshift(newTodo);
  saveTodos();
  renderTodos();
  elements.input.value = '';
  showNotification('Task added successfully', 'success');
}

// Read (Filtering happens in render)

// Update (Toggle)
function toggleTodo(id) {
  const todo = state.todos.find(t => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    saveTodos();
    renderTodos();
  }
}

// Update (Edit)
function editTodo(id, newText) {
  const todo = state.todos.find(t => t.id === id);
  if (todo && newText.trim()) {
    todo.text = newText.trim();
    saveTodos();
    renderTodos();
    showNotification('Task updated', 'success');
  }
}

// Delete
function deleteTodo(id) {
  state.todos = state.todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
  showNotification('Task removed', 'info');
}

// Clear Completed
function clearCompleted() {
  const originalLength = state.todos.length;
  state.todos = state.todos.filter(t => !t.completed);

  if (state.todos.length < originalLength) {
    saveTodos();
    renderTodos();
    showNotification('Completed tasks cleared', 'info');
  }
}

// --- Persistence ---
function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(state.todos));
}

function loadTodos() {
  const saved = localStorage.getItem('todos');
  if (saved) {
    try {
      state.todos = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse todos', e);
      state.todos = [];
    }
  }
}

// --- Rendering ---
function renderTodos() {
  const filteredTodos = state.todos.filter(todo => {
    if (state.filter === 'active') return !todo.completed;
    if (state.filter === 'completed') return todo.completed;
    return true;
  });

  elements.list.innerHTML = '';

  if (filteredTodos.length === 0) {
    elements.list.innerHTML = `
      <li class="empty-state" style="text-align: center; padding: 2rem; color: var(--text-light);">
        ${state.filter === 'all' ? 'No tasks yet. Add one above!' : 'No tasks in this filter.'}
      </li>
    `;
  } else {
    filteredTodos.forEach(todo => {
      const li = document.createElement('li');
      li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
      li.dataset.id = todo.id;

      li.innerHTML = `
        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} aria-label="Toggle task">
        <span class="todo-text" contenteditable="false">${escapeHtml(todo.text)}</span>
        <div class="actions">
          <button class="edit-btn" aria-label="Edit task">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="delete-btn" aria-label="Delete task">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      `;

      elements.list.appendChild(li);
    });
  }

  updateMeta();
}

function updateMeta() {
  const activeCount = state.todos.filter(t => !t.completed).length;
  elements.itemsLeft.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message, type = 'info') {
  // Simple notification logic
  console.log(`[${type.toUpperCase()}] ${message}`);
  // In a real app, create a toast element
}

// --- Event Listeners ---
function setupEventListeners() {
  // Add Todo
  elements.addBtn.addEventListener('click', () => {
    addTodo(elements.input.value);
  });

  elements.input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addTodo(elements.input.value);
    }
  });

  // Filter
  elements.filters.forEach(btn => {
    btn.addEventListener('click', (e) => {
      elements.filters.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.filter = e.target.dataset.filter;
      renderTodos();
    });
  });

  // Clear Completed
  elements.clearCompleted.addEventListener('click', clearCompleted);

  // List Interactions (Delegation)
  elements.list.addEventListener('click', (e) => {
    const item = e.target.closest('.todo-item');
    if (!item) return;
    const id = parseInt(item.dataset.id);

    // Initial Toggle Checkbox
    if (e.target.classList.contains('todo-checkbox')) {
      toggleTodo(id);
    }

    // Delete Button
    if (e.target.closest('.delete-btn')) {
      deleteTodo(id);
    }

    // Edit Button
    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) {
      const span = item.querySelector('.todo-text');
      const isEditing = span.getAttribute('contenteditable') === 'true';

      if (isEditing) {
        // Save
        span.setAttribute('contenteditable', 'false');
        item.classList.remove('editing');
        editTodo(id, span.textContent);
        editBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
        editBtn.setAttribute('aria-label', 'Edit task');
      } else {
        // Start Edit
        span.setAttribute('contenteditable', 'true');
        span.focus();
        item.classList.add('editing');
        // Change icon to Check/Save
        editBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        editBtn.setAttribute('aria-label', 'Save task');
      }
    }
  });

  // Handle Enter key on contenteditable
  elements.list.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('todo-text')) {
      e.preventDefault();
      e.target.blur(); // Triggers the save logic above? No, blur doesn't. 
      // We need to handle saving here or on blur
      // Let's just trigger the edit button click to save
      const item = e.target.closest('.todo-item');
      // Find the save button (which is the edit button in save mode)
      // This is a bit hacky, let's just save directly
      const id = parseInt(item.dataset.id);
      editTodo(id, e.target.textContent);

      // Reset UI
      e.target.setAttribute('contenteditable', 'false');
      item.classList.remove('editing');
      const editBtn = item.querySelector('.edit-btn');
      editBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
    }
  });
}

// Initialization
function init() {
  loadTodos();
  renderTodos();
  setupEventListeners();
}

init();
