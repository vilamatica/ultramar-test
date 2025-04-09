const cuVehicleModal = document.getElementById('cu-vehicle-modal');
const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
let currentVehicleId = null;

function openVehicleModal(data=null) {
  const cuModalTitle = document.getElementById('cu-modal-title');
  cuModalTitle.innerText = !data?.id ? 'Create Vehicle' : 'Edit Vehicle';

  // Populate modal fields
  document.getElementById('modal-vehicle_id').value = data?.id ?? '';
  document.getElementById('modal-vehicle_vin').value = data?.vin ?? '';
  document.getElementById('modal-vehicle_make').value = data?.make ?? '';
  document.getElementById('modal-vehicle_model').value = data?.model ?? '';
  document.getElementById('modal-vehicle_weight').value = data?.weight ?? '';
  document.getElementById('modal-vehicle_booking').value = data?.booking.id ?? '';
}


document.getElementById('cu-vehicle-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const vehicleID = document.getElementById('modal-vehicle_id').value;
    const vehicleVin = document.getElementById('modal-vehicle_vin').value;
    const vehicleMake = document.getElementById('modal-vehicle_make').value;
    const vehicleModel = document.getElementById('modal-vehicle_model').value;
    const vehicleWeight = document.getElementById('modal-vehicle_weight').value;
    const vehicleBooking = document.getElementById('modal-vehicle_booking').value;

  const url = vehicleID ? `/api/vehicles/${vehicleID}/` : '/api/vehicles/';
  
    const data = new FormData();
    data.append('vin', vehicleVin);
    data.append('make', vehicleMake);
    data.append('model', vehicleModel);
    data.append('weight', vehicleWeight);
    data.append('booking_id', vehicleBooking);
    
    const method = vehicleID ? 'PATCH' : 'POST';

    fetch(url, {
        method,
        body: data,
        headers: {
          'X-CSRFToken': csrftoken,
        },
    })
    .then(response => response.ok ? response.json() : Promise.reject(response))
    .then(() => location.reload())
    .catch(err => {
      if (err.json) {
          err.json().then(error => showToast(error.detail, type='error'));
      } else {
          console.error('Error:', err);
      }
  });
});

// logic for input search filter
const searchInput = document.getElementById('search-input');
const vehicleTableBody = document.getElementById('vehicle-table-body');
let debounceTimeout;

function updateQueryParam(key, value) {
    const url = new URL(window.location);
    if (value) {
        url.searchParams.set(key, value);
    } else {
        url.searchParams.delete(key);
    }
    window.history.replaceState({}, '', url);
}

function getQueryString() {
  const url = new URL(window.location);
  const params = new URLSearchParams(url.search);
  let queryString = '';
  for (const [key, value] of params.entries()) {
    queryString += queryString ? '&' : '?';
    queryString += `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  }
  return queryString;
}

function fetchAndRender() {
    fetch(`/api/vehicles/${getQueryString()}`)
      .then(res => res.json())
      .then(data => {
            vehicleTableBody.innerHTML = '';
            if (data.results.length === 0) {
                vehicleTableBody.innerHTML = `
                    <tr><td colspan="6" class="text-center">No vehicles found.</td></tr>
                `;
                return;
            }

            for (const vehicle of data.results) {
              vehicleTableBody.insertAdjacentHTML('beforeend', `
                  <tr data-id="${vehicle.id}">
                    <td class="sticky-col first-col">${vehicle.vin}</td>
                    <td>${vehicle.make ?? '-'}</td>
                    <td>${vehicle.model ?? '-'}</td>
                    <td>${vehicle.weight ?? '-'}</td>
                    <td>${vehicle.booking?.booking_number ?? '-'}</td>
                    <td class="sticky-col last-col dropdown dropstart">
                      <button
                        class="btn dropdown-toggle"
                        type="button"
                        id="dropdown-menu-row-actions"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <i class="fa fa-ellipsis-h"></i>
                      </button>
                      <ul
                        class="dropdown-menu"
                        aria-labelledby="dropdown-menu-row-actions"
                      >
                        <li>
                          <a class="dropdown-item" href="#">
                            <button
                              type="button"
                              class="btn"
                              data-bs-toggle="modal"
                              data-bs-target="#view-details-modal"
                              onclick='openDetailsVehicleModal(${JSON.stringify(vehicle)})'
                            >
                              View Details
                            </button></a
                          >
                        </li>
                        <li>
                          <a class="dropdown-item" href="#">
                            <button
                              type="button"
                              class="btn"
                              data-bs-toggle="modal"
                              data-bs-target="#cu-vehicle-modal"
                              onclick='openVehicleModal(${JSON.stringify(vehicle)})'
                            >
                              Edit vehicle
                            </button></a
                          >
                        </li>
                        <li>
                          <a class="dropdown-item" href="#">
                            <button
                              type="button"
                              class="btn"
                              data-bs-toggle="modal"
                              data-bs-target="#delete-vehicle-modal"
                              onclick='openDeleteVehicleModal(${JSON.stringify(vehicle.id)})'
                            >
                              Delete vehicle
                            </button></a
                          >
                        </li>
                      </ul>
                    </td>
                  </tr>
                `);
            }
        }).catch(err => console.log(err));
}

searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        const query = searchInput.value;
        updateQueryParam('search', query);
        fetchAndRender();
    }, 300);
});

// On page load, trigger initial fetch
window.addEventListener('DOMContentLoaded', () => {
  fetchAndRender();
});

function nextPage() {
  const page = parseInt(vehicleTableBody.dataset.page);
  if (page === parseInt(vehicleTableBody.dataset.total_pages)) return;

  updateQueryParam('page', page + 1);
  fetchAndRender();
}

function previousPage() {
  const page = parseInt(vehicleTableBody.dataset.page);
  if (page === 1) return;
  updateQueryParam('page', page - 1);
  fetchAndRender();
}

function goToPage(page) {
  updateQueryParam('page', page);
  fetchAndRender();
}


// Vehicle Details Modal
function openDetailsVehicleModal(data = {}) {
  currentVehicleId = data?.id;
  // Populate modal fields
  document.getElementById('details-vehicle_vin').innerHTML = data?.vin ?? '-';
  document.getElementById('details-vehicle_make').innerHTML = data?.make ?? '-';
  document.getElementById('details-vehicle_model').innerHTML = data?.model ?? '-';
  document.getElementById('details-vehicle_weight').innerHTML = data?.weight ?? '-';
  document.getElementById('details-vehicle_booking').innerHTML = data?.booking?.booking_number ?? '-';
}

function openDeleteVehicleModal(id) {
  fetch(`/api/vehicles/${id}/`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken,
    },
  })
  .then(() => {
    fetchAndRender();
  })
  .catch(err => {
      if (err.json) {
          err.json().then(error => showToast(error.detail, type='error'));
      } else {
          console.error('Error:', err);
      }
  });
}

// Add event listener for delete button
document.addEventListener('DOMContentLoaded', function() {
  const deleteButton = document.getElementById('details-delete-btn');
  if (deleteButton) {
    deleteButton.addEventListener('click', function() {
      if (currentVehicleId) {
        openDeleteVehicleModal(currentVehicleId);
      }
    });
  }
});

function exportVehiclesXLS() {
  fetch(`/api/vehicles/export-xls/${getQueryString()}`, {
    method: 'GET'
  })
  .then(response => response.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vehicles.xlsx';
    a.click();
  }).catch(err => console.error('Error:', err));
}

function exportVehiclesPDF() {
  fetch(`/api/vehicles/export-pdf/${getQueryString()}`, {
    method: 'GET'
  })
  .then(response => response.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vehicles.pdf';
    a.click();
  }).catch(err => console.error('Error:', err));
}

document.getElementById('import-xls-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const formData = new FormData();
  formData.append('file', fileInput.files[0]);

  fetch(`/api/vehicles/import-xls/`, {
    method: 'POST',
    body: formData,
    headers: {
      'X-CSRFToken': csrftoken,
    },
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showToast('Vehicles imported successfully', 'success');
        location.reload();
      } else {
        showToast(data.error, 'error');
      }
    }).catch(err => {
      if (err.json) {
        err.json().then(error => showToast(error.detail, type = 'error'));
      } else {
        console.error('Error:', err);
      }
    })
});