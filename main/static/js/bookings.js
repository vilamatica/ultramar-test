const cuBookingModal = document.getElementById('cu-booking-modal');
const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
let currentBookingId = null;

function openBookingModal(data=null) {
  const cuModalTitle = document.getElementById('cu-modal-title');
  cuModalTitle.innerText = !data?.id ? 'Create Booking' : 'Edit Booking';

  // Populate modal fields
  document.getElementById('modal-booking_id').value = data?.id ?? '';
  document.getElementById('modal-booking_number').value = data?.booking_number ?? '';
  document.getElementById('modal-loading_port').value = data?.loading_port ?? '';
  document.getElementById('modal-discharge_port').value = data?.discharge_port ?? '';
  document.getElementById('modal-ship_arrival_date').value = data?.ship_arrival_date ?? new Date().toISOString().split('T')[0];
  document.getElementById('modal-ship_departure_date').value = data?.ship_departure_date ?? new Date().toISOString().split('T')[0];
}


document.getElementById('cu-booking-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const bookingID = document.getElementById('modal-booking_id').value;
    const bookingNumber = document.getElementById('modal-booking_number').value;
    const loadingPort = document.getElementById('modal-loading_port').value;
    const dischargePort = document.getElementById('modal-discharge_port').value;
    const shipArrivalDate = document.getElementById('modal-ship_arrival_date').value;
    const shipDepartureDate = document.getElementById('modal-ship_departure_date').value;

  const url = bookingID ? `/api/bookings/${bookingID}/` : '/api/bookings/';
  
    const data = new FormData();
    data.append('booking_number', bookingNumber);
    data.append('loading_port', loadingPort);
    data.append('discharge_port', dischargePort);
    data.append('ship_arrival_date', shipArrivalDate);
    data.append('ship_departure_date', shipDepartureDate);
    
    const method = bookingID ? 'PATCH' : 'POST';

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
const bookingTableBody = document.getElementById('booking-table-body');
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
    fetch(`/api/bookings/${getQueryString()}`)
      .then(res => res.json())
      .then(data => {
            bookingTableBody.innerHTML = '';
            if (data.results.length === 0) {
                bookingTableBody.innerHTML = `
                    <tr><td colspan="6" class="text-center">No bookings found.</td></tr>
                `;
                return;
            }

            for (const booking of data.results) {
              bookingTableBody.insertAdjacentHTML('beforeend', `
                  <tr data-id="${booking.id}">
                    <td class="sticky-col first-col">${booking.booking_number ?? '-'}</td>
                    <td>${booking.loading_port ?? '-'}</td>
                    <td>${booking.discharge_port ?? '-'}</td>
                    <td>${booking.ship_arrival_date ?? '-'}</td>
                    <td>${booking.ship_departure_date ?? '-'}</td>
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
                              onclick='openDetailsBookingModal(${JSON.stringify(booking)})'
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
                              data-bs-target="#cu-booking-modal"
                              onclick='openBookingModal(${JSON.stringify(booking)})'
                            >
                              Edit booking
                            </button></a
                          >
                        </li>
                        <li>
                          <a class="dropdown-item" href="#">
                            <button
                              type="button"
                              class="btn"
                              data-bs-toggle="modal"
                              data-bs-target="#delete-booking-modal"
                              onclick='openDeleteBookingModal(${JSON.stringify(booking.id)})'
                            >
                              Delete booking
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
  const page = parseInt(bookingTableBody.dataset.page);
  if (page === parseInt(bookingTableBody.dataset.total_pages)) return;

  updateQueryParam('page', page + 1);
  fetchAndRender();
}

function previousPage() {
  const page = parseInt(bookingTableBody.dataset.page);
  if (page === 1) return;
  updateQueryParam('page', page - 1);
  fetchAndRender();
}

function goToPage(page) {
  updateQueryParam('page', page);
  fetchAndRender();
}


// Booking Details Modal
function openDetailsBookingModal(data = {}) {
  currentBookingId = data?.id;
  // Populate modal fields
  document.getElementById('details-booking_number').innerHTML = data?.booking_number;
  document.getElementById('details-loading_port').innerHTML = data?.loading_port;
  document.getElementById('details-discharge_port').innerHTML = data?.discharge_port;
  document.getElementById('details-ship_arrival_date').innerHTML = data?.ship_arrival_date;
  document.getElementById('details-ship_departure_date').innerHTML = data?.ship_departure_date;
}

function openDeleteBookingModal(id) {
  fetch(`/api/bookings/${id}/`, {
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

document.addEventListener('DOMContentLoaded', function() {
  var datepickerArrivalElement = document.getElementById('modal-ship-arrival-date');
  var datepickerDepartureElement = document.getElementById('modal-ship-departure-date');
  
  if (datepickerArrivalElement) {
    $(datepickerArrivalElement).datepicker({
      format: 'mm/dd/yyyy',
      autoclose: true,
    });
  }

  if (datepickerDepartureElement) {
    $(datepickerDepartureElement).datepicker({
      format: 'mm/dd/yyyy',
      autoclose: true,
    });
  }
});

// Add event listener for delete button
document.addEventListener('DOMContentLoaded', function() {
  const deleteButton = document.getElementById('details-delete-btn');
  if (deleteButton) {
    deleteButton.addEventListener('click', function() {
      if (currentBookingId) {
        openDeleteBookingModal(currentBookingId);
      }
    });
  }
});

function exportBookingsXLS() {
  fetch(`/api/bookings/export-xls/${getQueryString()}`, {
    method: 'GET'
  })
  .then(response => response.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookings.xlsx';
    a.click();
  }).catch(err => console.error('Error:', err));
}

function exportBookingsPDF() {
  fetch(`/api/bookings/export-pdf/${getQueryString()}`, {
    method: 'GET'
  })
  .then(response => response.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookings.pdf';
    a.click();
  }).catch(err => console.error('Error:', err));
}

document.getElementById('import-xls-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const formData = new FormData();
  formData.append('file', fileInput.files[0]);

  fetch(`/api/bokking/import-xls/`, {
    method: 'POST',
    body: formData,
    headers: {
      'X-CSRFToken': csrftoken,
    },
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showToast('Bokking imported successfully', 'success');
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