// script.js

// State Management
let machines = [];

// DOM Elements
const machineListEl = document.getElementById('machine-list');
const searchInput = document.getElementById('search-input');
const addMachineBtn = document.getElementById('open-add-machine-btn');
const addMachineModal = document.getElementById('add-machine-modal');
const addMachineForm = document.getElementById('add-machine-form');
const addItemModal = document.getElementById('add-item-modal');
const addItemForm = document.getElementById('add-item-form');
const closeModalBtns = document.querySelectorAll('.close-modal-btn');

// Map Variables
let map;
let markers = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    initMap();
    await fetchMachines();
});

async function fetchMachines() {
    // Fetch machines and their items
    const { data: machinesData, error: machinesError } = await supabase
        .from('machines')
        .select(`
            *,
            items (*)
        `);

    if (machinesError) {
        console.error('Error fetching machines:', machinesError);
        return;
    }

    machines = machinesData;
    renderMachines(machines);
    updateMapMarkers(machines);
}

function initMap() {
    // Center on UCF
    map = L.map('map').setView([28.6024, -81.2001], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

function updateMapMarkers(machinesToDisplay) {
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    machinesToDisplay.forEach(machine => {
        if (machine.lat && machine.lng) {
            const marker = L.marker([machine.lat, machine.lng]).addTo(map);

            const popupContent = `
                <div style="font-family: 'Outfit', sans-serif;">
                    <h3 style="margin: 0 0 5px 0; color: #000;">${machine.name}</h3>
                    <p style="margin: 0; font-size: 0.9rem; color: #666;">${machine.location}</p>
                    <p style="margin: 5px 0 0 0; font-size: 0.8rem;"><strong>${machine.items ? machine.items.length : 0}</strong> items</p>
                </div>
            `;

            marker.bindPopup(popupContent);
            markers.push(marker);
        }
    });
}

// Render Functions
async function renderMachines(machinesToRender) {
    machineListEl.innerHTML = '';

    if (machinesToRender.length === 0) {
        machineListEl.innerHTML = `
            <div class="empty-state glass-panel">
                <i data-lucide="ghost" size="48"></i>
                <p>No vending machines found matching your search.</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    const { data: { session } } = await supabase.auth.getSession();

    machinesToRender.forEach(machine => {
        const card = document.createElement('div');
        card.className = 'machine-card glass-panel';

        const itemsHtml = machine.items ? machine.items.map(item => `
            <div class="item-row">
                <span class="item-name">${item.name}</span>
                <div class="item-meta">
                    <span class="item-price">$${item.price.toFixed(2)}</span>
                    <span class="stock-badge ${item.stock ? '' : 'out'}" title="${item.stock ? 'In Stock' : 'Out of Stock'}"></span>
                </div>
            </div>
        `).join('') : '';

        card.innerHTML = `
            <div class="machine-header">
                <div class="machine-info">
                    <h3>${machine.name}</h3>
                    <div class="machine-location">
                        <i data-lucide="map-pin" size="14"></i>
                        <span>${machine.location}</span>
                    </div>
                </div>
            </div>
            <div class="items-list">
                ${itemsHtml.length ? itemsHtml : '<p class="text-secondary" style="font-size: 0.9rem; padding: 10px;">No items added yet.</p>'}
            </div>
            <div class="add-item-btn-container ${session ? '' : 'hidden'}">
                <button class="btn-secondary" onclick="openAddItemModal('${machine.id}')">
                    + Add Item
                </button>
            </div>
        `;

        machineListEl.appendChild(card);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Search Logic
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();

    const filteredMachines = machines.filter(machine => {
        // Match machine name or location
        if (machine.name.toLowerCase().includes(query) ||
            machine.location.toLowerCase().includes(query)) {
            return true;
        }

        // Match any item in the machine
        return machine.items && machine.items.some(item => item.name.toLowerCase().includes(query));
    });

    renderMachines(filteredMachines);
    updateMapMarkers(filteredMachines);
});

// Modal Logic
function openModal(modal) {
    modal.classList.remove('hidden');
}

function closeModal(modal) {
    modal.classList.add('hidden');
}

if (addMachineBtn) {
    addMachineBtn.addEventListener('click', () => openModal(addMachineModal));
}

closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-target');
        closeModal(document.getElementById(modalId));
    });
});

// Close modal on outside click
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeModal(e.target);
    }
});

// Add Machine Logic
addMachineForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('machine-name').value;
    const location = document.getElementById('machine-location').value;

    // For demo purposes, randomize location near UCF center slightly
    const lat = 28.6024 + (Math.random() - 0.5) * 0.005;
    const lng = -81.2001 + (Math.random() - 0.5) * 0.005;

    const { data, error } = await supabase
        .from('machines')
        .insert([{ name, location, lat, lng }])
        .select();

    if (error) {
        alert(error.message);
    } else {
        await fetchMachines();
        addMachineForm.reset();
        closeModal(addMachineModal);
    }
});

// Add Item Logic
window.openAddItemModal = function (machineId) {
    const machine = machines.find(m => m.id == machineId);
    if (!machine) return;

    document.getElementById('target-machine-id').value = machineId;
    document.getElementById('target-machine-name').textContent = machine.name;
    openModal(addItemModal);
};

addItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const machine_id = document.getElementById('target-machine-id').value;
    const name = document.getElementById('item-name').value;
    const price = parseFloat(document.getElementById('item-price').value);
    const stock = document.getElementById('item-stock').checked;

    const { data, error } = await supabase
        .from('items')
        .insert([{ machine_id, name, price, stock }]);

    if (error) {
        alert(error.message);
    } else {
        await fetchMachines();
        addItemForm.reset();
        closeModal(addItemModal);
    }
});
