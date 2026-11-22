// URL of the PHP API running on XAMPP (Apache).
// Change this if your project folder is not C:\xampp\htdocs\April
// Production (Docker) builds set VITE_API_URL=/api so the site and API share one domain.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/April/api';

export const imageUrl = (path) => (!path ? null : path.startsWith('http') ? path : `${API_URL}/${path}`);

// first name for greetings, skipping Filipino honorifics ("Mang Pedro Santos" → "Pedro")
export const firstName = (name = '') => {
  const parts = name.trim().split(/\s+/);
  return (/^(mang|aling|manong|manang|lola|lolo|tito|tita|kuya|ate|ka)$/i.test(parts[0]) && parts[1] ? parts[1] : parts[0]) || '';
};

export const peso =(n) =>
  '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = localStorage.getItem('ah_token');
  if (token) headers['X-Auth-Token'] = token;
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_URL}/${path}`, {
    method,
    headers,
    body: form ? form : body ? JSON.stringify(body) : undefined,
  });
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('Server error — is XAMPP (Apache + MySQL) running?');
  }
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}
