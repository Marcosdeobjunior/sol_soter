// Lógica de Dropdown aprimorada para todos os menus
document.querySelectorAll('.dropdown').forEach(dropdownContainer => {
  const toggle = dropdownContainer.querySelector('.dropdown-header, .profile');
  if (toggle) {
    toggle.addEventListener('click', (event) => {
      if (event.target.tagName === 'A') return;
      document.querySelectorAll('.dropdown.active').forEach(activeDropdown => {
        if (activeDropdown !== dropdownContainer) {
          activeDropdown.classList.remove('active');
        }
      });
      dropdownContainer.classList.toggle('active');
    });
  }
});

document.addEventListener('click', e => {
  if (!e.target.closest('.dropdown')) {
    document.querySelectorAll('.dropdown.active').forEach(dropdown => {
      dropdown.classList.remove('active');
    });
  }
});

// Atualiza o saldo
document.addEventListener('DOMContentLoaded', () => {
    if (typeof atualizarSaldoGlobal === 'function') {
        atualizarSaldoGlobal();
    }
});

window.addEventListener('storage', (event) => {
    if (event.key === 'financeiro-widget') {
        if (typeof atualizarSaldoGlobal === 'function') {
            atualizarSaldoGlobal();
        }
    }
});

// js/wishlist.js
document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS MENU HAMBÚRGUER ---
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const actionButtons = document.getElementById('actionButtons');

    // Toggle do Menu Hambúrguer
    if (hamburgerBtn && actionButtons) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.toggle('active');
            actionButtons.classList.toggle('show');
        });

        // Fechar menu ao clicar em uma ação
        actionButtons.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                hamburgerBtn.classList.remove('active');
                actionButtons.classList.remove('show');
            });
        });
    }

    // --- ELEMENTOS DOS MODAIS ---
    const modal = document.getElementById('addItemModal');
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = modal.querySelector('.close-btn');

    const historyModal = document.getElementById('historyModal');
    const openHistoryModalBtn = document.getElementById('openHistoryModalBtn');
    const closeHistoryModalBtn = historyModal.querySelector('.close-btn');
    
    const shoppingCartModal = document.getElementById('shoppingCartModal');
    const shoppingCartBtn = document.getElementById('shoppingCartBtn');
    const closeShoppingCartModalBtn = shoppingCartModal.querySelector('.close-btn');
    
    const cartItemCountBadge = document.getElementById('cartItemCount');

    // --- ELEMENTOS DAS GRIDS E FORMULÁRIOS ---
    const addItemForm = document.getElementById('addItemForm');
    const wishlistGrid = document.getElementById('wishlistGrid');
    const purchaseHistoryGrid = document.getElementById('purchaseHistoryGrid');
    const cartGrid = document.getElementById('cartGrid');

    // --- ELEMENTOS DE AÇÃO DO CARRINHO ---
    const cartTotalElement = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const clearCartBtn = document.getElementById('clearCartBtn');
    
    // --- CONTROLES ---
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');

    // --- CARREGAMENTO DE DADOS ---
    let wishlistItems = JSON.parse(localStorage.getItem('wishlistItems')) || [];
    let purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || [];
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

    // --- LÓGICA DO BADGE DO CARRINHO ---
    const updateCartBadge = () => {
        const uniqueItemCount = cartItems.length;
        cartItemCountBadge.textContent = uniqueItemCount;
        if (uniqueItemCount === 0) {
            cartItemCountBadge.classList.add('hidden');
        } else {
            cartItemCountBadge.classList.remove('hidden');
        }
    };

    // --- LÓGICA DOS MODAIS ---
    openModalBtn.addEventListener('click', () => modal.classList.add('active'));
    closeModalBtn.addEventListener('click', () => modal.classList.remove('active'));
    
    openHistoryModalBtn.addEventListener('click', () => historyModal.classList.add('active'));
    closeHistoryModalBtn.addEventListener('click', () => historyModal.classList.remove('active'));

    shoppingCartBtn.addEventListener('click', () => shoppingCartModal.classList.add('active'));
    closeShoppingCartModalBtn.addEventListener('click', () => shoppingCartModal.classList.remove('active'));

    window.addEventListener('click', (e) => {
        if (e.target == modal) modal.classList.remove('active');
        if (e.target == historyModal) historyModal.classList.remove('active');
        if (e.target == shoppingCartModal) shoppingCartModal.classList.remove('active');
    });

    // --- LÓGICA GERAL ---
    const saveData = () => {
        localStorage.setItem('wishlistItems', JSON.stringify(wishlistItems));
        localStorage.setItem('purchasedItems', JSON.stringify(purchasedItems));
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    };

    const renderAll = () => {
        renderWishlist();
        renderPurchaseHistory();
        renderCart();
    }

    // --- RENDERIZAÇÃO DO CARRINHO ---
    const renderCart = () => {
        cartGrid.innerHTML = '';
        let total = 0;

        if (cartItems.length === 0) {
            cartGrid.innerHTML = `<p style="text-align: center; color: var(--texto-secundario);">Seu carrinho está vazio.</p>`;
        } else {
            cartItems.forEach((item, index) => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('cart-item');
                const subtotal = parseFloat(item.price) * item.quantity;
                total += subtotal;

                itemElement.innerHTML = `
                    <div class="cart-item-image" style="display:none;"> <img src="${item.image || 'img/placeholder.png'}" alt="${item.name}">
                    </div>
                    <div class="cart-item-info">
                        <h5>${item.name}</h5>
                        <p>R$ ${parseFloat(item.price).toFixed(2)}</p>
                        <p class="cart-item-subtotal">Subtotal: R$ ${subtotal.toFixed(2)}</p>
                    </div>
                    <div class="quantity-controls">
                        <button class="btn-quantity-decrease" data-index="${index}">-</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="btn-quantity-increase" data-index="${index}">+</button>
                    </div>
                    <button class="btn-remove-from-cart" data-index="${index}" title="Remover item">&times;</button>
                `;
                cartGrid.appendChild(itemElement);
            });
        }
        cartTotalElement.textContent = `R$ ${total.toFixed(2)}`;
        updateCartBadge();
    };

    // --- RENDERIZAÇÃO DO HISTÓRICO ---
    const renderPurchaseHistory = () => {
        purchaseHistoryGrid.innerHTML = '';
        if (purchasedItems.length === 0) {
            purchaseHistoryGrid.innerHTML = `<p style="text-align: center; color: var(--texto-secundario); grid-column: 1 / -1;">Seu histórico de compras está vazio.</p>`;
        } else {
            purchasedItems.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
            purchasedItems.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('purchased-item');
                const purchaseDate = new Date(item.purchaseDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const quantityBadge = item.quantity > 1 ? `<span class="purchased-quantity">x${item.quantity}</span>` : '';

                itemElement.innerHTML = `
                    <div class="item-image">
                        <img src="${item.image || 'img/placeholder.png'}" alt="${item.name}" onerror="this.onerror=null;this.src='img/placeholder.png';">
                    </div>
                    <div class="purchased-item-info">
                        <h4 class="item-name">
                            <span>${item.name}</span>
                            ${quantityBadge}
                        </h4>
                        <p class="item-price">R$ ${parseFloat(item.price).toFixed(2)}</p>
                        <p class="purchase-date">Comprado em: ${purchaseDate}</p>
                    </div>
                `;
                purchaseHistoryGrid.appendChild(itemElement);
            });
        }
    };
    
    // --- RENDERIZAÇÃO DA WISHLIST ---
    const orderKey = 'wishlist-order-wishlist-v1';
    const loadOrder = () => { try { return JSON.parse(localStorage.getItem(orderKey) || '[]'); } catch { return []; } };
    const saveOrder = (keys) => localStorage.setItem(orderKey, JSON.stringify(keys));
    const sortPrefKey = 'wishlist-sort-pref-v1';
    const loadSortPref = () => { try { return localStorage.getItem(sortPrefKey) || 'default'; } catch { return 'default'; } };
    const saveSortPref = (val) => { try { localStorage.setItem(sortPrefKey, val); } catch {} };
    const announce = (msg) => { const el = document.getElementById('sr-live'); if (el) el.textContent = msg; };

    const renderWishlist = () => {
        const searchTerm = searchInput.value.toLowerCase();
        let filteredItems = wishlistItems.filter(item => item.name.toLowerCase().includes(searchTerm));
        const filterValue = filterSelect.value;
        const priorityOrder = { 'urgente': 4, 'alta': 3, 'media': 2, 'baixa': 1 };
        if (filterValue !== 'default') {
            filteredItems.sort((a, b) => {
                switch (filterValue) {
                    case 'priority': return priorityOrder[b.priority] - priorityOrder[a.priority];
                    case 'price-desc': return b.price - a.price;
                    case 'price-asc': return a.price - b.price;
                    case 'name-asc': return a.name.localeCompare(b.name);
                    case 'name-desc': return b.name.localeCompare(a.name);
                    default: return 0;
                }
            });
        }
        // Reorganiza pela ordenação personalizada APENAS quando estiver na opção padrão
        const savedOrder = loadOrder();
        if (filterValue === 'default' && savedOrder.length) {
            const byKey = new Map(filteredItems.map(it => [it.name, it]));
            const inOrder = savedOrder.filter(k => byKey.has(k)).map(k => byKey.get(k));
            const notInOrder = filteredItems.filter(it => !savedOrder.includes(it.name));
            filteredItems = [...inOrder, ...notInOrder];
        }
        wishlistGrid.innerHTML = '';
        if (filteredItems.length === 0) {
            wishlistGrid.innerHTML = `<p style="text-align: center; color: var(--texto-secundario); grid-column: 1 / -1;">Nenhum item encontrado.</p>`;
        } else {
            filteredItems.forEach((item, itemIndex) => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('wishlist-item');
                itemElement.setAttribute('draggable', 'true');
                itemElement.setAttribute('data-key', item.name);
                itemElement.setAttribute('aria-label', 'Item da wishlist');
                
                const isOutOfStock = item.quantity <= 0;
                const disabledAttribute = isOutOfStock ? 'disabled' : '';
                const buttonText = isOutOfStock ? 'Sem Estoque' : 'Adicionar ao Carrinho';

                itemElement.innerHTML = `
                    <div class="item-stock">Estoque: ${item.quantity}</div>
                    <div class="priority-badge priority-${item.priority}">${item.priority}</div>
                    <div class="item-image">
                        <img src="${item.image || 'img/placeholder.png'}" alt="${item.name}" onerror="this.onerror=null;this.src='img/placeholder.png';">
                    </div>
                    <div class="item-info">
                        <h4 class="item-name">${item.name}</h4>
                        <p class="item-price">R$ ${parseFloat(item.price).toFixed(2)}</p>
                        <div class="item-actions">
                            <button class="btn-add-to-cart" data-index="${itemIndex}" ${disabledAttribute}>${buttonText}</button>
                            <button class="btn-remove" data-index="${itemIndex}">Remover</button>
                        </div>
                    </div>
                `;
                wishlistGrid.appendChild(itemElement);
            });
            // Drag & Drop nativo
            let dragEl = null;
            let lastTarget = null;
            wishlistGrid.setAttribute('aria-dropeffect', 'move');
            wishlistGrid.addEventListener('dragstart', (e) => {
                const card = e.target.closest('.wishlist-item');
                if (!card) return;
                dragEl = card;
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', card.dataset.key || 'drag');
            });
            wishlistGrid.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                const target = e.target.closest('.wishlist-item');
                if (!dragEl || !target || target === dragEl) return;
                if (lastTarget && lastTarget !== target) lastTarget.classList.remove('drop-target');
                target.classList.add('drop-target');
                lastTarget = target;
                const rect = target.getBoundingClientRect();
                const insertBefore = e.clientX < rect.left + rect.width / 2;
                wishlistGrid.insertBefore(dragEl, insertBefore ? target : target.nextSibling);
            });
            const persistOrder = () => {
                const keys = [...wishlistGrid.querySelectorAll('.wishlist-item')].map(el => el.dataset.key);
                saveOrder(keys);
                announce('Ordem atualizada.');
            };
            wishlistGrid.addEventListener('drop', (e) => { e.preventDefault(); if (lastTarget) lastTarget.classList.remove('drop-target'); if (dragEl) { dragEl.classList.remove('dragging'); dragEl.classList.add('drop-confirm'); setTimeout(()=>dragEl && dragEl.classList.remove('drop-confirm'), 260); } persistOrder(); renderWishlist(); });
            wishlistGrid.addEventListener('dragend', () => { if (lastTarget) lastTarget.classList.remove('drop-target'); if (dragEl) { dragEl.classList.remove('dragging'); dragEl.classList.add('drop-confirm'); setTimeout(()=>dragEl && dragEl.classList.remove('drop-confirm'), 260); } dragEl = null; persistOrder(); renderWishlist(); });

            const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
            const supportsDnD = 'draggable' in document.createElement('div');
            if (coarse || !supportsDnD) setupPointerDnD();

            function setupPointerDnD() {
                let proxy = null, ph = null, startX = 0, startY = 0;
                wishlistGrid.addEventListener('pointerdown', onPointerDown, { passive: true });
                function onPointerDown(ev) {
                    const card = ev.target.closest('.wishlist-item');
                    if (!card) return;
                    dragEl = card;
                    const rect = card.getBoundingClientRect();
                    ph = document.createElement('div');
                    ph.className = 'drop-placeholder';
                    ph.style.height = rect.height + 'px';
                    card.parentNode.insertBefore(ph, card.nextSibling);
                    card.classList.add('dragging');
                    card.style.visibility = 'hidden';
                    proxy = card.cloneNode(true);
                    proxy.classList.add('drag-proxy');
                    document.body.appendChild(proxy);
                    startX = ev.clientX - rect.left;
                    startY = ev.clientY - rect.top;
                    moveProxy(ev.clientX, ev.clientY);
                    document.addEventListener('pointermove', onPointerMove, { passive: true });
                    document.addEventListener('pointerup', onPointerUp, { passive: true });
                }
                function moveProxy(x, y) {
                    proxy.style.transform = `translate3d(${x - startX}px, ${y - startY}px, 0) scale(1.03)`;
                }
                function onPointerMove(ev) {
                    if (!proxy || !dragEl) return;
                    moveProxy(ev.clientX, ev.clientY);
                    const cards = [...wishlistGrid.querySelectorAll('.wishlist-item')].filter(el => el !== dragEl);
                    let best = null, bestDist = Infinity;
                    for (const el of cards) {
                        const r = el.getBoundingClientRect();
                        const cx = r.left + r.width / 2;
                        const cy = r.top + r.height / 2;
                        const dx = ev.clientX - cx;
                        const dy = ev.clientY - cy;
                        const d = dx*dx + dy*dy;
                        if (d < bestDist) { bestDist = d; best = el; }
                    }
                    if (best) {
                        if (lastTarget && lastTarget !== best) lastTarget.classList.remove('drop-target');
                        best.classList.add('drop-target');
                        lastTarget = best;
                        const r = best.getBoundingClientRect();
                        const before = ev.clientX < r.left + r.width / 2;
                        wishlistGrid.insertBefore(ph, before ? best : best.nextSibling);
                    }
                }
                function onPointerUp() {
                    document.removeEventListener('pointermove', onPointerMove);
                    document.removeEventListener('pointerup', onPointerUp);
                    if (lastTarget) lastTarget.classList.remove('drop-target');
                    if (ph && ph.parentNode) ph.parentNode.insertBefore(dragEl, ph);
                    if (ph && ph.parentNode) ph.parentNode.removeChild(ph);
                    if (proxy && proxy.parentNode) proxy.parentNode.removeChild(proxy);
                    if (dragEl) {
                        dragEl.style.visibility = '';
                        dragEl.classList.remove('dragging');
                        dragEl.classList.add('drop-confirm');
                        setTimeout(()=>dragEl && dragEl.classList.remove('drop-confirm'), 260);
                    }
                    persistOrder();
                    renderWishlist();
                    dragEl = null; proxy = null; ph = null;
                }
            }
        }
    };

    // --- ADICIONAR NOVO ITEM ---
    addItemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newItem = {
            name: document.getElementById('itemName').value,
            price: document.getElementById('itemPrice').value,
            quantity: parseInt(document.getElementById('itemQuantity').value, 10),
            image: document.getElementById('itemImage').value,
            link: document.getElementById('itemLink').value,
            priority: document.getElementById('itemPriority').value
        };
        if (newItem.name && newItem.price && newItem.priority && newItem.quantity > 0) {
            wishlistItems.push(newItem);
            saveData();
            renderAll();
            addItemForm.reset();
            modal.classList.remove('active');
        } else {
            alert('Por favor, preencha todos os campos, com uma quantidade de no mínimo 1.');
        }
    });

    // --- EVENTOS DA WISHLIST ---
    wishlistGrid.addEventListener('click', (e) => {
        const target = e.target;
        const index = parseInt(target.getAttribute('data-index'), 10);
        if (isNaN(index)) return;

        if (target.classList.contains('btn-remove')) {
            if (confirm('Tem certeza que deseja remover este item permanentemente?')) {
                wishlistItems.splice(index, 1);
                saveData();
                renderAll();
            }
        }

        if (target.classList.contains('btn-add-to-cart')) {
            const wishlistItem = wishlistItems[index];
            const cartItem = cartItems.find(item => item.name === wishlistItem.name);
            const currentCartQuantity = cartItem ? cartItem.quantity : 0;

            if (currentCartQuantity < wishlistItem.quantity) {
                if (cartItem) {
                    cartItem.quantity++;
                } else {
                    cartItems.push({ ...wishlistItem, quantity: 1 });
                }
                saveData();
                renderCart();
                // Feedback visual opcional: abrir carrinho
                // shoppingCartModal.classList.add('active'); 
            } else {
                alert('Você não pode adicionar mais deste item. Limite de estoque atingido no carrinho.');
            }
        }
    });
    
    // --- EVENTOS DO CARRINHO ---
    cartGrid.addEventListener('click', (e) => {
        const target = e.target;
        const index = parseInt(target.getAttribute('data-index'), 10);
        if (isNaN(index)) return;
    
        const cartItem = cartItems[index];
        const wishlistItem = wishlistItems.find(item => item.name === cartItem.name);
        const stock = wishlistItem ? wishlistItem.quantity : 0;
    
        if (target.classList.contains('btn-quantity-increase')) {
            if (cartItem.quantity < stock) {
                cartItem.quantity++;
            } else {
                alert('Quantidade máxima em estoque atingida.');
            }
        } else if (target.classList.contains('btn-quantity-decrease')) {
            cartItem.quantity--;
            if (cartItem.quantity <= 0) {
                cartItems.splice(index, 1);
            }
        } else if (target.classList.contains('btn-remove-from-cart')) {
            cartItems.splice(index, 1);
        }
        
        saveData();
        renderCart();
    });

    clearCartBtn.addEventListener('click', () => {
        if (cartItems.length > 0 && confirm('Tem certeza que deseja esvaziar o carrinho? Os itens não serão excluídos da sua lista.')) {
            cartItems = [];
            saveData();
            renderCart();
        }
    });

    checkoutBtn.addEventListener('click', () => {
        if (cartItems.length > 0 && confirm(`Deseja finalizar a compra no valor de ${cartTotalElement.textContent}?`)) {
            const now = new Date().toISOString();
    
            cartItems.forEach(cartItem => {
                const wishlistItem = wishlistItems.find(item => item.name === cartItem.name);
                if (wishlistItem) {
                    wishlistItem.quantity -= cartItem.quantity;
                }
            });
    
            const purchased = cartItems.map(item => ({...item, purchaseDate: now }));
            purchasedItems.push(...purchased);
            cartItems = [];
            
            saveData();
            renderAll();
            shoppingCartModal.classList.remove('active');
            alert('Compra realizada com sucesso!');
        } else if (cartItems.length === 0) {
            alert('Seu carrinho está vazio.');
        }
    });

    searchInput.addEventListener('input', renderWishlist);
    // Persistir preferência ao trocar ordenação
    filterSelect.addEventListener('change', () => { saveSortPref(filterSelect.value); renderWishlist(); });

    // Aplicar preferência ao abrir a página
    const initialSort = loadSortPref();
    if (filterSelect && initialSort) {
        filterSelect.value = initialSort;
    }

    renderAll();
});