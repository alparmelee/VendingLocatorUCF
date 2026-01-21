// script.js

// State Management
let machines = [];

// DOM Elements
const machineListEl = document.getElementById('machine-list');
const searchInput = document.getElementById('search-input');
const addMachineBtn = document.getElementById('open-add-machine-btn');
const addMachineModal = document.getElementById('add-machine-modal');
const addMachineForm = document.getElementById('add-machine-form');
const editMachineModal = document.getElementById('edit-machine-modal');
const editMachineForm = document.getElementById('edit-machine-form');
const addItemModal = document.getElementById('add-item-modal');
const addItemForm = document.getElementById('add-item-form');
const closeModalBtns = document.querySelectorAll('.close-modal-btn');

// Map Variables
let map;
let markers = [];
let tempMarker = null;
let isSelectionMode = false;
let selectionModeContext = 'add'; // 'add' or 'edit'

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

    // Map Click Listener for selecting location
    map.on('click', (e) => {
        if (isSelectionMode) {
            const { lat, lng } = e.latlng;
            
            if (selectionModeContext === 'add') {
                // Set hidden inputs for add
                document.getElementById('machine-lat').value = lat;
                document.getElementById('machine-lng').value = lng;
            } else {
                // Set hidden inputs for edit
                document.getElementById('edit-machine-lat').value = lat;
                document.getElementById('edit-machine-lng').value = lng;
                
                // Update UI for edit
                document.getElementById('edit-location-status-text').innerHTML = `
                    <i data-lucide="check-circle" size="14" style="vertical-align: middle; color: #2ed573;"></i> 
                    New location: ${lat.toFixed(4)}, ${lng.toFixed(4)}
                `;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
            
            // Show temp marker
            if (tempMarker) {
                tempMarker.setLatLng(e.latlng);
            } else {
                tempMarker = L.marker(e.latlng, {
                    icon: L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    })
                }).addTo(map);
            }

            // Exit selection mode and open appropriate modal
            const modalToOpen = selectionModeContext === 'add' ? addMachineModal : editMachineModal;
            exitSelectionMode();
            openModal(modalToOpen);
        }
    });
}

function enterSelectionMode(context = 'add') {
    selectionModeContext = context;
    isSelectionMode = true;
    document.getElementById('map-instruction').classList.remove('hidden');
    document.getElementById('map').style.cursor = 'crosshair';
}

function exitSelectionMode() {
    isSelectionMode = false;
    document.getElementById('map-instruction').classList.add('hidden');
    document.getElementById('map').style.cursor = '';
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
    const currentUserId = session?.user?.id;
    const currentUserEmail = session?.user?.email;
    
    // Define admin emails here
    const ADMIN_EMAILS = ['an798200@ucf.edu']; 
    const isAdmin = currentUserEmail && ADMIN_EMAILS.includes(currentUserEmail);

    machinesToRender.forEach(machine => {
        const isOwner = currentUserId && machine.user_id === currentUserId;
        const canEdit = isOwner || isAdmin;
        
        const card = document.createElement('div');
        card.className = 'machine-card glass-panel';

        const itemsByStatus = machine.items ? machine.items.reduce((acc, item) => {
            const category = item.category || 'other';
            if (!acc[category]) acc[category] = [];
            acc[category].push(item);
            return acc;
        }, {}) : {};

        const renderCategory = (categoryName, items) => {
            if (!items || items.length === 0) return '';
            return `
                <div class="category-section" style="margin-bottom: 15px;">
                    <h4 style="font-size: 0.8rem; color: var(--ucf-gold); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; border-bottom: 1px solid rgba(255, 201, 4, 0.2); padding-bottom: 3px;">
                        ${categoryName}
                    </h4>
                    ${items.map(item => `
                        <div class="item-row">
                            <span class="item-name">${item.name}</span>
                            <div class="item-meta">
                                <span class="item-price">$${item.price.toFixed(2)}</span>
                                <span class="stock-badge ${item.stock ? '' : 'out'}" title="${item.stock ? 'In Stock' : 'Out of Stock'}"></span>
                                ${canEdit ? `
                                <button class="delete-item-btn" onclick="deleteItem('${item.id}')" title="Delete Item">
                                    <i data-lucide="x" size="12"></i>
                                </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        };

        const itemsHtml = `
            ${renderCategory('Beverages', itemsByStatus.beverages)}
            ${renderCategory('Snacks', itemsByStatus.snacks)}
            ${renderCategory('Other', itemsByStatus.other)}
        `;

        card.innerHTML = `
            <div class="machine-header">
                <div class="machine-info">
                    <h3>${machine.name}</h3>
                    <div class="machine-location">
                        <i data-lucide="map-pin" size="14"></i>
                        <span>${machine.location}</span>
                    </div>
                </div>
                ${canEdit ? `
                <div class="owner-actions">
                    <button class="btn-icon" onclick="openEditMachineModal('${machine.id}')" title="Edit Machine">
                        <i data-lucide="edit-2" size="14"></i>
                    </button>
                    <button class="btn-icon danger" onclick="deleteMachine('${machine.id}')" title="Delete Machine">
                        <i data-lucide="trash-2" size="14"></i>
                    </button>
                </div>
                ` : ''}
            </div>
            <div class="items-list">
                ${(machine.items && machine.items.length > 0) ? itemsHtml : '<p class="text-secondary" style="font-size: 0.9rem; padding: 10px;">No items added yet.</p>'}
            </div>
            <div class="add-item-btn-container ${session ? '' : 'hidden'}">
                <button class="btn-secondary" onclick="openAddItemModal('${machine.id}')">
                    + Add Items
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
    
    // Cleanup temp marker if closing a machine modal
    if ((modal.id === 'add-machine-modal' || modal.id === 'edit-machine-modal') && tempMarker) {
        map.removeLayer(tempMarker);
        tempMarker = null;
    }
}

if (addMachineBtn) {
    addMachineBtn.addEventListener('click', enterSelectionMode);
}

const cancelSelectionBtn = document.getElementById('cancel-selection');
if (cancelSelectionBtn) {
    cancelSelectionBtn.addEventListener('click', exitSelectionMode);
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

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        alert('You must be logged in to add a machine!');
        return;
    }

    const name = document.getElementById('machine-name').value;
    const location = document.getElementById('machine-location').value;
    const lat = parseFloat(document.getElementById('machine-lat').value);
    const lng = parseFloat(document.getElementById('machine-lng').value);

    if (isNaN(lat) || isNaN(lng)) {
        alert('Please click on the map to select a location first!');
        return;
    }

    const { data, error } = await supabase
        .from('machines')
        .insert([{ 
            name, 
            location, 
            lat, 
            lng,
            user_id: session.user.id 
        }])
        .select();

    if (error) {
        alert(error.message);
    } else {
        await fetchMachines();
        addMachineForm.reset();
        
        // Reset location selection
        if (tempMarker) {
            map.removeLayer(tempMarker);
            tempMarker = null;
        }
        
        closeModal(addMachineModal);
    }
});

// Edit Machine Logic
window.openEditMachineModal = function (machineId) {
    const machine = machines.find(m => m.id == machineId);
    if (!machine) return;

    document.getElementById('edit-machine-id').value = machine.id;
    document.getElementById('edit-machine-name').value = machine.name;
    document.getElementById('edit-machine-location').value = machine.location;
    document.getElementById('edit-machine-lat').value = machine.lat;
    document.getElementById('edit-machine-lng').value = machine.lng;
    
    // Reset edit location UI
    document.getElementById('edit-location-status-text').innerHTML = `
        <i data-lucide="map-pin" size="14" style="vertical-align: middle;"></i> 
        Location fixed. Click "Change Location" to move.
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    openModal(editMachineModal);
};

const changeLocationBtn = document.getElementById('change-location-btn');
if (changeLocationBtn) {
    changeLocationBtn.addEventListener('click', () => {
        closeModal(editMachineModal);
        enterSelectionMode('edit');
    });
}

editMachineForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('edit-machine-id').value;
    const name = document.getElementById('edit-machine-name').value;
    const location = document.getElementById('edit-machine-location').value;
    const lat = parseFloat(document.getElementById('edit-machine-lat').value);
    const lng = parseFloat(document.getElementById('edit-machine-lng').value);

    const { error } = await supabase
        .from('machines')
        .update({ name, location, lat, lng })
        .eq('id', id);

    if (error) {
        alert(error.message);
    } else {
        await fetchMachines();
        closeModal(editMachineModal);
    }
});

// Delete Machine Logic
window.deleteMachine = async function (machineId) {
    if (!confirm('Are you sure you want to delete this machine? This will also remove all items inside it.')) {
        return;
    }

    const { error } = await supabase
        .from('machines')
        .delete()
        .eq('id', machineId);

    if (error) {
        alert(error.message);
    } else {
        await fetchMachines();
    }
};

// Delete Item Logic
window.deleteItem = async function (itemId) {
    if (!confirm('Are you sure you want to remove this item?')) {
        return;
    }

    const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

    if (error) {
        alert(error.message);
    } else {
        await fetchMachines();
    }
};

// Add Item Logic
const itemsContainer = document.getElementById('items-container');
const addMoreItemsBtn = document.getElementById('add-more-items-btn');
let itemRowCount = 1;

window.openAddItemModal = function (machineId) {
    const machine = machines.find(m => m.id == machineId);
    if (!machine) return;

    document.getElementById('target-machine-id').value = machineId;
    document.getElementById('target-machine-name').textContent = machine.name;
    
    // Reset to one row
    itemsContainer.innerHTML = createItemRow(0);
    itemRowCount = 1;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    openModal(addItemModal);
};

function createItemRow(index) {
    return `
        <div class="item-entry-row glass-panel" style="padding: 15px; margin-bottom: 15px; border: 1px solid var(--glass-border);">
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 10px; margin-bottom: 10px;">
                <div class="form-group" style="margin-bottom: 0;">
                    <label>Item Name</label>
                    <input type="text" class="item-name-input" required placeholder="e.g. Coca Cola">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label>Price ($)</label>
                    <input type="number" class="item-price-input" step="0.01" required placeholder="1.50">
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: center;">
                <div class="form-group" style="margin-bottom: 0;">
                    <label>Category</label>
                    <select class="item-category-input" style="width: 100%; padding: 10px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--glass-border); border-radius: 8px; color: var(--text-primary); outline: none;">
                        <option value="beverages">Beverage</option>
                        <option value="snacks">Snack</option>
                    </select>
                </div>
                <div class="form-group checkbox-group" style="margin-bottom: 0;">
                    <input type="checkbox" class="item-stock-input" checked id="stock-check-${index}">
                    <label for="stock-check-${index}">In Stock</label>
                </div>
            </div>
        </div>
    `;
}

if (addMoreItemsBtn) {
    addMoreItemsBtn.addEventListener('click', () => {
        const div = document.createElement('div');
        div.innerHTML = createItemRow(itemRowCount++);
        itemsContainer.appendChild(div.firstElementChild);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    });
}

addItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const machine_id = document.getElementById('target-machine-id').value;
    const itemRows = document.querySelectorAll('.item-entry-row');
    const itemsToInsert = [];

    itemRows.forEach(row => {
        const name = row.querySelector('.item-name-input').value;
        const price = parseFloat(row.querySelector('.item-price-input').value);
        const category = row.querySelector('.item-category-input').value;
        const stock = row.querySelector('.item-stock-input').checked;
        
        itemsToInsert.push({ machine_id, name, price, category, stock });
    });

    const { data, error } = await supabase
        .from('items')
        .insert(itemsToInsert);

    if (error) {
        alert(error.message);
    } else {
        await fetchMachines();
        addItemForm.reset();
        closeModal(addItemModal);
    }
});
