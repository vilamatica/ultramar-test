function showToast(message="", type='', duration = 5000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `show ${type}`;

  setTimeout(() => {
    toast.className = toast.className.replace('show', '');
  }, duration);
}