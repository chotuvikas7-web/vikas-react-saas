export const productFallbacks = {
  transformers: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=900&q=80',
  chargers: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=80',
  'pcb-cards': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
  'jhatka-machines': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80',
  'custom-manufacturing': 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=900&q=80'
};

export function money(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

export function excerpt(value, limit = 92) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > limit ? `${text.slice(0, limit - 3).trim()}...` : text;
}

export function fallbackImage(product) {
  return productFallbacks[product?.category_slug] || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80';
}

export function cartItems() {
  try {
    return JSON.parse(localStorage.getItem('ve_cart') || '[]');
  } catch {
    return [];
  }
}

export function saveCart(items) {
  localStorage.setItem('ve_cart', JSON.stringify(items));
  window.dispatchEvent(new Event('ve-cart-change'));
}

export function addCartItem(id, quantity = 1, buyNow = false) {
  const items = cartItems();
  const existing = items.find((item) => Number(item.id) === Number(id));
  if (existing) existing.quantity += Number(quantity || 1);
  else items.push({ id: Number(id), quantity: Number(quantity || 1) });
  saveCart(items);
  if (buyNow) window.location.href = '/checkout';
}

export function cartCount() {
  return cartItems().reduce((total, item) => total + Number(item.quantity || 0), 0);
}
