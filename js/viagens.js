// --- NOVIDADE: ATUALIZA O SALDO QUANDO A PÁGINA CARREGA ---
document.addEventListener('DOMContentLoaded', () => {
    // Chama a função do script global para mostrar o saldo
    if (typeof atualizarSaldoGlobal === 'function') {
        atualizarSaldoGlobal();
    }
});

// Opcional: Atualiza o saldo na index.html se outra aba alterar os dados
window.addEventListener('storage', (event) => {
    if (event.key === 'financeiro-widget') {
        if (typeof atualizarSaldoGlobal === 'function') {
            atualizarSaldoGlobal();
        }
    }
});

document.addEventListener("DOMContentLoaded", () => {
  const travelForm = document.getElementById("travel-form");
  const travelCards = document.getElementById("travel-cards");
  const addTravelPopup = document.getElementById("add-travel-popup");
  const dataManagementPopup = document.getElementById("data-management-popup");
  const addTravelBtn = document.getElementById("add-travel-btn");
  const exportDataBtn = document.getElementById("export-data");
  const importDataBtn = document.getElementById("import-data");
  const fileInput = document.getElementById("file-input");
  const popupTitle = document.getElementById("popup-title");
  const submitBtn = document.getElementById("submit-btn");
  const deleteTravelBtn = document.getElementById("delete-travel-btn");
  const prevPageBtn = document.getElementById("prev-page");
  const nextPageBtn = document.getElementById("next-page");
  const pageInfoSpan = document.getElementById("page-info");

  let travels = [];
  let map;
  let markers = [];
  const geocodeCache = new Map();
  let isEditing = false;
  let editingIndex = -1;

  // Variáveis de paginação
  const CARDS_PER_PAGE = 6; // <-- AJUSTADO DE 15 PARA 6
  let currentPage = 1;
  let totalPages = 1;

  // Inicializar o mapa
  function initMap() {
    map = L.map("map", {
      worldCopyJump: true,
      minZoom: 3,
      maxZoom: 18,
      zoomSnap: 1,
    }).setView([-14.235, -51.925], 4); // Centro do Brasil

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      noWrap: false,
    }).addTo(map);
  }

  // Função para obter coordenadas de um destino
  async function getCoordinates(destination) {
    if (!destination) return null;
    if (geocodeCache.has(destination)) {
      return geocodeCache.get(destination);
    }

    try {
      // API principal: Open-Meteo Geocoding (mais estável para uso em navegador)
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          destination
        )}&count=1&language=pt&format=json`
      );
      const geoData = await geoResponse.json();
      if (geoData && Array.isArray(geoData.results) && geoData.results.length > 0) {
        const coords = {
          lat: parseFloat(geoData.results[0].latitude),
          lng: parseFloat(geoData.results[0].longitude),
        };
        geocodeCache.set(destination, coords);
        return coords;
      }

      // Fallback: Nominatim
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          destination
        )}&limit=1`
      );
      const nominatimData = await nominatimResponse.json();
      if (nominatimData && nominatimData.length > 0) {
        const coords = {
          lat: parseFloat(nominatimData[0].lat),
          lng: parseFloat(nominatimData[0].lon),
        };
        geocodeCache.set(destination, coords);
        return coords;
      }
    } catch (error) {
      console.error("Erro ao obter coordenadas:", error);
    }

    geocodeCache.set(destination, null);
    return null;
  }

  // Função para obter informações de clima (usando Open-Meteo)
  async function getWeatherInfo(destination) {
    const coords = await getCoordinates(destination);
    if (!coords) return null;

    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current_weather=true&hourly=temperature_2m,weather_code&forecast_days=1`
      );
      const data = await response.json();

      if (data && data.current_weather) {
        const weatherCode = data.current_weather.weathercode;
        const temperature = data.current_weather.temperature;
        let description = "";

        // Mapeamento simples de códigos de clima (WMO Weather interpretation codes)
        if (weatherCode === 0) description = "Céu limpo";
        else if (weatherCode > 0 && weatherCode < 4) description = "Parcialmente nublado";
        else if (weatherCode >= 51 && weatherCode <= 67) description = "Chuva";
        else if (weatherCode >= 71 && weatherCode <= 75) description = "Neve";
        else if (weatherCode >= 95 && weatherCode <= 99) description = "Tempestade";
        else description = "Condições variadas";

        return {
          temperature: `${temperature}°C`,
          description: description,
          icon: getWeatherIcon(weatherCode),
        };
      }
      return null;
    } catch (error) {
      console.error("Erro ao obter clima:", error);
      return null;
    }
  }

  // Função para obter ícone de clima
  function getWeatherIcon(weatherCode) {
    if (weatherCode === 0) return "fas fa-sun";
    else if (weatherCode > 0 && weatherCode < 4) return "fas fa-cloud-sun";
    else if (weatherCode >= 51 && weatherCode <= 67) return "fas fa-cloud-showers-heavy";
    else if (weatherCode >= 71 && weatherCode <= 75) return "fas fa-snowflake";
    else if (weatherCode >= 95 && weatherCode <= 99) return "fas fa-bolt";
    else return "fas fa-cloud";
  }

  function getCategoryClass(category) {
    const c = (category || "").toLowerCase();
    if (c.includes("parque")) return "travel-card--park";
    if (c.includes("restaurante")) return "travel-card--restaurant";
    if (c.includes("hotel")) return "travel-card--hotel";
    if (c.includes("ponto turístico") || c.includes("museu")) return "travel-card--landmark";
    return "";
  }

  function getCategoryIcon(category) {
    const c = (category || "").toLowerCase();
    if (c.includes("parque")) return "fas fa-tree";
    if (c.includes("restaurante")) return "fas fa-utensils";
    if (c.includes("hotel")) return "fas fa-bed";
    if (c.includes("ponto turístico") || c.includes("museu")) return "fas fa-landmark";
    return "";
  }

  function getMapMarkerStyle(category, destination) {
    const c = (category || "").toLowerCase();
    const d = (destination || "").toLowerCase();

    // Montanhas e trilhas podem vir no destino mesmo sem categoria formal.
    if (d.includes("montanha") || d.includes("serra") || d.includes("trilha")) {
      return { fillColor: "#cba6f7", radius: 9, label: "Montanha/Trilha" };
    }
    if (c.includes("restaurante")) {
      return { fillColor: "#fab387", radius: 8, label: "Restaurante" };
    }
    if (c.includes("parque")) {
      return { fillColor: "#a6e3a1", radius: 8, label: "Parque" };
    }
    if (c.includes("hotel")) {
      return { fillColor: "#89b4fa", radius: 8, label: "Hotel" };
    }
    if (c.includes("ponto turístico") || c.includes("museu")) {
      return { fillColor: "#f9e2af", radius: 8, label: "Ponto Turístico" };
    }
    if (c.includes("cidade/país")) {
      return { fillColor: "#94e2d5", radius: 8, label: "Cidade/País" };
    }
    if (c.includes("desejo")) {
      return { fillColor: "#f5c2e7", radius: 7, label: "Desejo" };
    }
    return { fillColor: "#89b4fa", radius: 8, label: "Outro" };
  }

  function getCountryFlag(destination) {
    const parts = destination.split(",").map(s => s.trim());
    const country = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
    const map = {
      "brasil": { emoji: "🇧🇷", label: "Bandeira do Brasil" },
      "portugal": { emoji: "🇵🇹", label: "Bandeira de Portugal" },
      "frança": { emoji: "🇫🇷", label: "Bandeira da França" },
      "italia": { emoji: "🇮🇹", label: "Bandeira da Itália" },
      "itália": { emoji: "🇮🇹", label: "Bandeira da Itália" },
      "espanha": { emoji: "🇪🇸", label: "Bandeira da Espanha" },
      "alemanha": { emoji: "🇩🇪", label: "Bandeira da Alemanha" },
      "reino unido": { emoji: "🇬🇧", label: "Bandeira do Reino Unido" },
      "inglaterra": { emoji: "🇬🇧", label: "Bandeira do Reino Unido" },
      "estados unidos": { emoji: "🇺🇸", label: "Bandeira dos Estados Unidos" },
      "eua": { emoji: "🇺🇸", label: "Bandeira dos Estados Unidos" },
      "canadá": { emoji: "🇨🇦", label: "Bandeira do Canadá" },
      "argentina": { emoji: "🇦🇷", label: "Bandeira da Argentina" },
      "chile": { emoji: "🇨🇱", label: "Bandeira do Chile" },
      "méxico": { emoji: "🇲🇽", label: "Bandeira do México" },
      "japão": { emoji: "🇯🇵", label: "Bandeira do Japão" },
      "japao": { emoji: "🇯🇵", label: "Bandeira do Japão" },
      "china": { emoji: "🇨🇳", label: "Bandeira da China" },
      "austrália": { emoji: "🇦🇺", label: "Bandeira da Austrália" },
      "australia": { emoji: "🇦🇺", label: "Bandeira da Austrália" }
    };
    return map[country] || null;
  }

  // Função para obter informações de eventos (simulado por enquanto)
  async function getEventsInfo(destination) {
    // Em um cenário real, você integraria uma API de eventos aqui (ex: Eventbrite, Google Events)
    // Por enquanto, vamos retornar dados simulados
    const events = [
      { name: "Festival de Verão", date: "2025-12-20", location: destination },
      { name: "Show de Jazz", date: "2025-12-25", location: destination },
    ];
    return events.filter((event) =>
      event.location.includes(destination.split(",")[0])
    );
  }

  // Adicionar marcador no mapa
  async function addMarkerToMap(travel, index) {
    const coords = travel.coords || (await getCoordinates(travel.destination));

    if (coords) {
      const markerStyle = getMapMarkerStyle(travel.category, travel.destination);
      const marker = L.circleMarker([coords.lat, coords.lng], {
        radius: markerStyle.radius,
        fillColor: markerStyle.fillColor,
        color: "#0f172a",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.95,
      }).addTo(map);

      const popupContent = `
        <div style="text-align: center; min-width: 200px;">
          <h4 style="margin: 0 0 10px 0; color: #333;">${travel.destination}</h4>
          <p style="margin: 5px 0; color: #666;"><i class="fas fa-tag"></i> ${travel.category || markerStyle.label}</p>
          <p style="margin: 5px 0; color: #666;"><i class="fas fa-calendar"></i> ${formatDate(
            travel.startDate
          )} - ${formatDate(travel.endDate)}</p>
          <p style="margin: 5px 0; color: #666;"><i class="fas fa-dollar-sign"></i> R$ ${travel.budget.toFixed(
            2
          )}</p>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.bindTooltip(travel.category || markerStyle.label, {
        direction: "top",
        offset: [0, -8],
      });
      markers.push({ marker, index });
      if (!travel.coords) {
        travel.coords = coords;
      }

      // Ajustar visualização do mapa se for a primeira viagem
      if (travels.length === 1) {
        map.setView([coords.lat, coords.lng], 6);
      }
    }
  }

  // Limpar marcadores do mapa
  function clearMapMarkers() {
    markers.forEach(({ marker }) => {
      map.removeLayer(marker);
    });
    markers = [];
  }

  // Atualizar marcadores do mapa
  async function updateMapMarkers() {
    clearMapMarkers();

    for (let i = 0; i < travels.length; i++) {
      await addMarkerToMap(travels[i], i);
    }

    saveTravels();

    if (markers.length > 1) {
      const group = L.featureGroup(markers.map((m) => m.marker));
      map.fitBounds(group.getBounds(), { padding: [20, 20], maxZoom: 6 });
    } else if (markers.length === 1) {
      map.setView(markers[0].marker.getLatLng(), 6);
    }
  }

  // Formatar data para exibição
  function formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  }

  // Calcular duração da viagem
  function calculateDuration(startDate, endDate) {
    if (!startDate || !endDate) return "N/A";
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    if (diffTime < 0) return "N/A";
    if (diffTime === 0) return 1;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Obter ícone baseado no destino
  function getDestinationIcon(destination) {
    const dest = destination.toLowerCase();
    if (
      dest.includes("praia") ||
      dest.includes("beach") ||
      dest.includes("rio") ||
      dest.includes("salvador") ||
      dest.includes("fortaleza")
    ) {
      return "fas fa-umbrella-beach";
    } else if (
      dest.includes("montanha") ||
      dest.includes("serra") ||
      dest.includes("gramado") ||
      dest.includes("campos")
    ) {
      return "fas fa-mountain";
    } else if (
      dest.includes("paris") ||
      dest.includes("roma") ||
      dest.includes("londres") ||
      dest.includes("europa")
    ) {
      return "fas fa-landmark";
    } else if (
      dest.includes("tokyo") ||
      dest.includes("china") ||
      dest.includes("japão") ||
      dest.includes("ásia")
    ) {
      return "fas fa-torii-gate";
    } else {
      return "fas fa-map-marker-alt";
    }
  }

  // Obter gradiente baseado no índice
  function getCardAccent(index) {
    const accents = [
      "#89b4fa",
      "#f38ba8",
      "#a6e3a1",
      "#f9e2af",
      "#fab387",
      "#cba6f7",
      "#94e2d5",
      "#f5c2e7",
    ];
    return accents[index % accents.length];
  }

  // Funções de paginação
  function updatePagination() {
    totalPages = Math.ceil(travels.length / CARDS_PER_PAGE);
    const paginationControls = document.getElementById("pagination-controls");

    if (totalPages <= 1) {
      paginationControls.style.display = "none";
    } else {
      paginationControls.style.display = "flex";
      pageInfoSpan.textContent = `Página ${currentPage} de ${totalPages}`;

      prevPageBtn.disabled = currentPage === 1;
      nextPageBtn.disabled = currentPage === totalPages;
    }
  }

  function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTravels();
  }

  function getCurrentPageTravels() {
    const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
    const endIndex = startIndex + CARDS_PER_PAGE;
    return travels.slice(startIndex, endIndex);
  }

  function saveTravels() {
    try {
      const dataToSave = {
        travels: travels,
        lastUpdated: new Date().toISOString(),
        version: "1.0",
      };
      localStorage.setItem("travels", JSON.stringify(dataToSave));
      console.log("Dados salvos com sucesso:", dataToSave);
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
      alert("Erro ao salvar dados. Verifique o espaço de armazenamento.");
    }
  }

  function loadTravels() {
    try {
      const savedData = localStorage.getItem("travels");
      if (savedData) {
        const parsedData = JSON.parse(savedData);

        // Compatibilidade com versões antigas
        if (Array.isArray(parsedData)) {
          travels = parsedData;
        } else if (parsedData.travels) {
          travels = parsedData.travels;
        }

        console.log("Dados carregados:", travels);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      travels = [];
    }
  }

  // Função para exportar dados
  function exportData() {
    try {
      const dataToExport = {
        travels: travels,
        exportDate: new Date().toISOString(),
        version: "1.0",
        appName: "Sol de Sóter - Planejamento de Viagens",
      };

      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(dataBlob);
      link.download = `viagens_backup_${new Date().toISOString().split("T")[0]}.json`;
      link.click();

      alert("Dados exportados com sucesso!");
      closePopup("data-management-popup");
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      alert("Erro ao exportar dados.");
    }
  }

  // Função para importar dados
  function importData(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const importedData = JSON.parse(e.target.result);

        if (importedData.travels && Array.isArray(importedData.travels)) {
          const confirmImport = confirm(
            `Deseja importar ${importedData.travels.length} viagem(ns)? Isso substituirá os dados atuais.`
          );

          if (confirmImport) {
            travels = importedData.travels;
            currentPage = 1; // Reset para primeira página
            saveTravels();
            renderTravels();
            alert("Dados importados com sucesso!");
            closePopup("data-management-popup");
          }
        } else {
          alert("Arquivo inválido. Verifique se é um backup válido.");
        }
      } catch (error) {
        console.error("Erro ao importar dados:", error);
        alert("Erro ao importar dados. Verifique se o arquivo é válido.");
      }
    };
    reader.readAsText(file);
  }

  // Função para editar uma viagem
  function editTravel(index) {
    const travel = travels[index];
    if (!travel) return;

    isEditing = true;
    editingIndex = index;

    // Preencher o formulário com os dados da viagem
    document.getElementById("destination").value = travel.destination;
    document.getElementById("travel-type").value = travel.category || ""; // ATUALIZADO
    document.getElementById("start-date").value = travel.startDate;
    document.getElementById("end-date").value = travel.endDate;
    document.getElementById("budget").value = travel.budget || "";
    document.getElementById("local-description").value = travel.localDescription || travel.descricaoLocal || travel.descricao || "";
    const existingImage = travel.image || travel.imagem || "";
    document.getElementById("travel-image-url").value = existingImage && !String(existingImage).startsWith("data:image") ? existingImage : "";
    document.getElementById("travel-image-data").value = existingImage && String(existingImage).startsWith("data:image") ? existingImage : "";
    document.getElementById("travel-image-file").value = "";

    // Alterar o título e botão do popup
    popupTitle.textContent = "Editar Viagem";
    submitBtn.textContent = "Salvar Alterações";
    deleteTravelBtn.style.display = "inline-block"; // Mostrar botão de excluir

    // Abrir o popup
    openPopup("add-travel-popup");
  }

  // Função para resetar o formulário para modo de adição
  function resetFormToAddMode() {
    isEditing = false;
    editingIndex = -1;
    popupTitle.textContent = "Adicionar Nova Viagem";
    submitBtn.textContent = "Adicionar Viagem";
    deleteTravelBtn.style.display = "none"; // Ocultar botão de excluir
    travelForm.reset();
  }

  function renderTravels() {
    if (travels.length === 0) {
      travelCards.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-suitcase-rolling"></i>
          <h4>Nenhuma viagem planejada</h4>
          <p>Adicione sua primeira viagem para começar!</p>
        </div>
      `;
      updatePagination();
      return;
    }

    const currentTravels = getCurrentPageTravels();
    travelCards.innerHTML = "";

    currentTravels.forEach((travel, pageIndex) => {
      const globalIndex = (currentPage - 1) * CARDS_PER_PAGE + pageIndex;
      const duration = calculateDuration(travel.startDate, travel.endDate);
      const categoryIcon = getCategoryIcon(travel.category);
      const icon = categoryIcon || getDestinationIcon(travel.destination);
      const categoryClass = getCategoryClass(travel.category);
      const accent = getCardAccent(globalIndex);
      const isWish = travel.category === 'Desejo';
      const country = getCountryFlag(travel.destination);

      const card = document.createElement("div");
      card.className = "travel-card";
      if (categoryClass) {
        card.classList.add(categoryClass);
      }
      if (isWish) {
          card.classList.add("wish-category");
      }
      card.style.borderTopColor = accent;
      card.dataset.index = globalIndex;
      card.setAttribute("role", "listitem");

      let weatherHtml = "";
      if (travel.weather) {
        weatherHtml = `
          <p><i class="${travel.weather.icon}"></i> ${travel.weather.temperature}, ${travel.weather.description}</p>
        `;
      }

      let eventsHtml = "";
      if (travel.events && travel.events.length > 0) {
        eventsHtml = `
          <p><i class="fas fa-calendar-check"></i> Eventos: ${travel.events
            .map((event) => event.name)
            .join(", ")}</p>
        `;
      }

      const flagHtml = country ? `<span class="flag-badge" role="img" aria-label="${country.label}">${country.emoji}</span>` : "";

      const budgetHtml = travel.budget
        ? `<div class="travel-card-budget"><i class="fas fa-dollar-sign"></i> R$ ${parseFloat(travel.budget).toFixed(2)}</div>`
        : "";

      const durationHtml = duration !== "N/A"
        ? `<p><i class="fas fa-clock"></i> ${duration} ${duration === 1 ? "dia" : "dias"}</p>`
        : "";

      const dateHtml = (travel.startDate && travel.endDate)
        ? `<p><i class="fas fa-calendar-alt"></i> ${formatDate(travel.startDate)} - ${formatDate(travel.endDate)}</p>`
        : "";
      
      const categoryHtml = travel.category
        ? `<p class="travel-category" style="font-weight: 600;">${travel.category}</p>`
        : "";
      const localDescHtml = (travel.localDescription || travel.descricaoLocal || travel.descricao)
        ? `<p><i class="fas fa-map-marked-alt"></i> ${travel.localDescription || travel.descricaoLocal || travel.descricao}</p>`
        : "";

      card.innerHTML = `
        <div class="travel-card-header">
          <h4>${travel.destination}${flagHtml}</h4>
          <i class="${icon} travel-card-icon"></i>
        </div>
        
        <div class="travel-card-details">
          ${dateHtml}
          ${durationHtml}
          ${budgetHtml}
          ${weatherHtml}
          ${eventsHtml}
          ${categoryHtml}
          ${localDescHtml}
        </div>
      `;

      // Adicionar event listener para clicar no card (mostrar/ocultar botão de excluir e abrir edição)
      card.addEventListener("click", (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        editTravel(index);
      });

      travelCards.appendChild(card);
    });

    updatePagination();
    // Atualizar mapa
    updateMapMarkers();
  }

  // Funções para gerenciar popups
  function openPopup(popupId) {
    const popup = document.getElementById(popupId);
    if (popup) {
      popup.style.display = "flex";
    }
  }

  function closePopup(popupId) {
    const popup = document.getElementById(popupId);
    if (popup) {
      popup.style.display = "none";
      // Resetar formulário quando fechar popup
      if (popupId === "add-travel-popup") {
        resetFormToAddMode();
      }
    }
  }

  // Event listeners para os botões de ação
  addTravelBtn.addEventListener("click", () => {
    resetFormToAddMode();
    openPopup("add-travel-popup");
  });

  // Event listeners para fechar popups
  document.querySelectorAll(".close-popup, .cancel-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const popupId = e.target.dataset.popup || e.target.closest("[data-popup]").dataset.popup;
      closePopup(popupId);
    });
  });

  // Fechar popup clicando no overlay
  document.querySelectorAll(".popup-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.style.display = "none";
        if (overlay.id === "add-travel-popup") {
          resetFormToAddMode();
        }
      }
    });
  });

  // Event listeners para paginação
  prevPageBtn.addEventListener("click", () => {
    goToPage(currentPage - 1);
  });

  nextPageBtn.addEventListener("click", () => {
    goToPage(currentPage + 1);
  });

  // Event listener para o formulário de viagem
  travelForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const destinationInput = document.getElementById("destination");
    const startDateInput = document.getElementById("start-date");
    const endDateInput = document.getElementById("end-date");
    const budgetInput = document.getElementById("budget");
    const travelTypeInput = document.getElementById("travel-type"); // ATUALIZADO
    const localDescriptionInput = document.getElementById("local-description");
    const imageUrlInput = document.getElementById("travel-image-url");
    const imageFileInput = document.getElementById("travel-image-file");
    const imageDataInput = document.getElementById("travel-image-data");

    const destination = destinationInput.value.trim();
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const budget = parseFloat(budgetInput.value) || 0;
    const category = travelTypeInput.value; // ATUALIZADO
    const localDescription = (localDescriptionInput && localDescriptionInput.value ? localDescriptionInput.value.trim() : "");
    const imageUrl = (imageUrlInput && imageUrlInput.value ? imageUrlInput.value.trim() : "");

    console.log("Dados do formulário:", { destination, startDate, endDate, budget, category, localDescription, imageUrl });

    // Validação
    if (!destination) {
      alert("Por favor, insira um destino.");
      destinationInput.focus();
      return;
    }
    
    // Validação de datas se ambas forem preenchidas
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        alert("A data de início deve ser menor ou igual à data de término.");
        return;
    }


    try {
      const fileToDataUrl = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Falha ao ler imagem"));
        reader.readAsDataURL(file);
      });

      let image = "";
      const selectedFile = imageFileInput && imageFileInput.files ? imageFileInput.files[0] : null;
      if (selectedFile) {
        image = await fileToDataUrl(selectedFile);
      } else if (imageUrl) {
        image = imageUrl;
      } else if (imageDataInput && imageDataInput.value) {
        image = imageDataInput.value;
      } else if (isEditing && travels[editingIndex]) {
        image = travels[editingIndex].image || travels[editingIndex].imagem || "";
      }

      if (imageDataInput) imageDataInput.value = image;

      // Obter informações de clima e eventos
      const weatherInfo = await getWeatherInfo(destination);
      const eventsInfo = await getEventsInfo(destination);
      
      // A lógica de categoria "Desejo" agora vem do dropdown
      // const category = (!startDate && !budgetInput.value) ? "Desejo" : null; // LÓGICA ANTIGA REMOVIDA

      const travelData = {
        destination,
        startDate,
        endDate,
        budget,
        category, // ATUALIZADO
        localDescription,
        descricao: localDescription,
        image,
        imagem: image,
        weather: weatherInfo,
        events: eventsInfo,
        createdAt: isEditing ? travels[editingIndex].createdAt : new Date().toISOString(),
        updatedAt: isEditing ? new Date().toISOString() : undefined,
      };

      console.log("Dados da viagem:", travelData);

      if (isEditing) {
        // Atualizar viagem existente
        travels[editingIndex] = travelData;
        alert("Viagem atualizada com sucesso!");
      } else {
        // Adicionar nova viagem
        travels.push(travelData);
        alert("Viagem adicionada com sucesso!");
      }

      saveTravels();
      await renderTravels();
      closePopup("add-travel-popup");
    } catch (error) {
      console.error("Erro ao processar viagem:", error);
      alert("Erro ao processar viagem. Tente novamente.");
    }
  });

  // Função para excluir uma viagem
  function deleteTravel(index) {
    const travel = travels[index];
    if (!travel) return;

    const confirmMessage = `Tem certeza que deseja excluir a viagem para "${travel.destination}"?\n\Nesta ação não pode ser desfeita.`;
    
    if (confirm(confirmMessage)) {
      // Remover a viagem do array
      travels.splice(index, 1);

      // Ajustar página atual se necessário
      const newTotalPages = Math.ceil(travels.length / CARDS_PER_PAGE);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        currentPage = newTotalPages;
      } else if (travels.length === 0) {
        currentPage = 1;
      }

      // Salvar e re-renderizar
      saveTravels();
      renderTravels();
      
      // Mostrar feedback de sucesso
      alert(`Viagem para "${travel.destination}" excluída com sucesso!`);
      closePopup("add-travel-popup"); // Fechar o popup após a exclusão
    }
  }
  
  // Event listener para o botão de excluir no popup
  deleteTravelBtn.addEventListener("click", () => {
      if (isEditing && editingIndex !== -1) {
          deleteTravel(editingIndex);
      }
  });


  // Event listener para ações dos cards (excluir) - removido, a edição agora lida com isso.
  // travelCards.addEventListener("click", (e) => {
  //   if (e.target.closest(".delete")) {
  //     const index = parseInt(e.target.closest(".delete").dataset.index);
  //     deleteTravel(index);
  //   }
  // });

  // Event listeners para gerenciamento de dados
  exportDataBtn.addEventListener("click", exportData);

  importDataBtn.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      importData(file);
    }
  });

  // Inicializar
  loadTravels(); // Carregar dados salvos
  initMap();
  renderTravels();
});


