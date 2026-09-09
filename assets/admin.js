/* Fallback loader pointing to /admin/assets/admin.js */
var s = document.createElement('script');
s.src = '/admin/assets/admin.js?v=' + Date.now();
document.head.appendChild(s);
