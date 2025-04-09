## 🚗 Booking Management App (Django + DRF)

This app provides a CRUD interface for managing bookings and vehicles, including the ability to import data from an Excel `.xlsx` file using a modal-based form with live feedback via JavaScript.

---

## ✅ Features Implemented

- Booking/Vehicle CRUD table with modal forms
- Live search input with debounced keystroke filtering (API-powered)
- API-based Excel import (.xlsx only, using `openpyxl`)
- Secure upload via `FormData` and authenticated API views
- Error handling for invalid files and formats
- Query syncing to URL params for filter persistence
- Extensible API backend using Django REST Framework

---

## 🛠️ Key Decisions & Technical Considerations

### 1. **File Import Format**
- Chose `.xlsx` (Excel OpenXML) format for compatibility and validation with `openpyxl`.
- Rejected `.xls` and `.csv` to avoid extra parsing complexity and inconsistent encoding.

### 2. **DRF + AJAX**
- Used `APIView` from Django REST Framework to leverage flexible parsing (`request.FILES`, `request.data`) and easier integration with authenticated routes.
- AJAX upload uses `fetch()` with `FormData`, avoiding full page reloads or jQuery dependencies.

### 3. **Client-Side Filtering**
- Implemented debounced keystroke filtering using vanilla JavaScript and URL query syncing to maintain filter state on page reload.
- All filtering is done via API (`GET /api/vehicles/?search=...`) or (`GET /api/bookings/?search=...`), keeping the UI fast and data fresh.

### 4. **Modal Forms**
- Used Bootstrap modals (or similar CSS-free handling) for create/update without page transitions.
- Errors and validation are displayed inline using dynamic DOM updates.

---

## ⚠️ Limitations / Known Issues

- Bulk import is simplistic (no preview, no batch rollback).
- No server-side validation for required Excel columns.

---

## 🚀 Possible Improvements

### 1. **Improve Import Workflow**

- Add preview of file before confirming import.
- Validate required fields and show row-by-row errors.

### 2. **UX Enhancements**

- Add loading spinners and inline feedback for imports/search.
- Improve data refresh on filter changes and form submission.

---

## 🧪 Tech Stack

- **Backend**: Django, Django REST Framework, openpyxl
- **Frontend**: Vanilla JS (no jQuery), Bootstrap (optional)
- **Data Storage**: SQLite or PostgreSQL
- **Auth**: DRF Token or Session Auth
- **File Handling**: FormData + `request.FILES` (DRF)