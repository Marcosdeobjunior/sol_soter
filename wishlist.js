// js/wishlist.js

document.addEventListener('DOMContentLoaded', () => {
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

    // --- CARREGAMENTO DE DADOS DO LOCALSTORAGE ---
    let wishlistItems = JSON.parse(localStorage.getItem('wishlistItems')) || [];
    let purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || [];
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

    // --- LÓGICA DO BADGE DO CARRINHO ---
    const updateCartBadge = () => {
        // A contagem de itens únicos é simplesmente o tamanho do array 'cartItems'
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
            cartGrid.innerHTML = `<p style="text-align: center; color: #666;">Seu carrinho está vazio.</p>`;
        } else {
            cartItems.forEach((item, index) => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('cart-item');
                const subtotal = parseFloat(item.price) * item.quantity;
                total += subtotal;

                itemElement.innerHTML = `
                    <div class="cart-item-image">
                        <img src="${item.image || 'img/placeholder.png'}" alt="${item.name}" onerror="this.onerror=null;this.src='img/placeholder.png';">
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
            purchaseHistoryGrid.innerHTML = `<p style="text-align: center; color: #666; grid-column: 1 / -1;">Seu histórico de compras está vazio.</p>`;
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
    
    // --- RENDERIZAÇÃO DA WISHLIST (CATÁLOGO COM ESTOQUE) ---
    const renderWishlist = () => {
        // ... (lógica de busca e filtro continua a mesma)
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
        wishlistGrid.innerHTML = '';
        if (filteredItems.length === 0) {
            wishlistGrid.innerHTML = `<p style="text-align: center; color: #666; grid-column: 1 / -1;">Nenhum item encontrado.</p>`;
        } else {
            filteredItems.forEach((item, itemIndex) => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('wishlist-item');
                // Desabilita o botão se o estoque for 0
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
        }
    };

    // --- ADICIONAR NOVO ITEM (COM QUANTIDADE) ---
    addItemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newItem = {
            name: document.getElementById('itemName').value,
            price: document.getElementById('itemPrice').value,
            quantity: parseInt(document.getElementById('itemQuantity').value, 10), // Captura a quantidade
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

    // --- EVENTOS DA WISHLIST (COM CONTROLE DE ESTOQUE) ---
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
            } else {
                alert('Você não pode adicionar mais deste item. Limite de estoque atingido no carrinho.');
            }
        }
    });
    
    // --- EVENTOS DO CARRINHO (COM CONTROLE DE ESTOQUE) ---
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

    // --- ESVAZIAR CARRINHO (NÃO EXCLUI ITENS) ---
    clearCartBtn.addEventListener('click', () => {
        if (cartItems.length > 0 && confirm('Tem certeza que deseja esvaziar o carrinho? Os itens não serão excluídos da sua lista.')) {
            cartItems = [];
            saveData();
            renderCart();
        }
    });

    // --- FINALIZAR COMPRA (DEDUZ DO ESTOQUE) ---
    checkoutBtn.addEventListener('click', () => {
        if (cartItems.length > 0 && confirm(`Deseja finalizar a compra no valor de ${cartTotalElement.textContent}?`)) {
            const now = new Date().toISOString();
    
            // Deduz a quantidade do estoque da wishlist
            cartItems.forEach(cartItem => {
                const wishlistItem = wishlistItems.find(item => item.name === cartItem.name);
                if (wishlistItem) {
                    wishlistItem.quantity -= cartItem.quantity;
                }
            });
    
            const purchased = cartItems.map(item => ({...item, purchaseDate: now }));
            purchasedItems.push(...purchased);
            cartItems = []; // Esvazia o carrinho
            
            saveData();
            renderAll(); // Atualiza todas as exibições
            shoppingCartModal.classList.remove('active');
            alert('Compra realizada com sucesso!');
        } else if (cartItems.length === 0) {
            alert('Seu carrinho está vazio.');
        }
    });

    // --- EVENTOS DOS FILTROS ---
    searchInput.addEventListener('input', renderWishlist);
    filterSelect.addEventListener('change', renderWishlist);

    // Renderiza tudo na inicialização
    renderAll();
});