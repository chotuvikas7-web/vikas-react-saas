export const adminResourceConfig = {
  categories: {
    title: 'Categories',
    columns: ['id', 'name', 'slug', 'status', 'created_at'],
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'slug', label: 'Slug' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] }
    ]
  },
  products: {
    title: 'Products',
    columns: ['id', 'name', 'category_name', 'sku', 'price', 'stock_quantity', 'status'],
    fields: [
      { name: 'name', label: 'Product Name', required: true },
      { name: 'category_id', label: 'Category', type: 'select', optionSource: 'categories', optionLabel: 'name', optionValue: 'id' },
      { name: 'sku', label: 'SKU', required: true },
      { name: 'product_code', label: 'Product Code' },
      { name: 'hsn_code', label: 'HSN Code' },
      { name: 'unit', label: 'Unit', defaultValue: 'PCS' },
      { name: 'cost', label: 'Purchase/Manufacturing Cost', type: 'number', step: '0.01', defaultValue: 0 },
      { name: 'price', label: 'Selling Price', type: 'number', step: '0.01', defaultValue: 0 },
      { name: 'gst_rate', label: 'GST %', type: 'number', step: '0.01', defaultValue: 18 },
      { name: 'stock_quantity', label: 'Opening / Current Stock', type: 'number', defaultValue: 0 },
      { name: 'min_stock', label: 'Minimum Stock Alert', type: 'number', defaultValue: 5 },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
      { name: 'main_image', label: 'Product Photo', type: 'file', uploadFolder: 'products' },
      { name: 'description', label: 'Description', type: 'textarea', span: 2 },
      { name: 'specifications', label: 'Technical Specifications', type: 'textarea', span: 2 }
    ]
  },
  clients: {
    title: 'Clients',
    columns: ['id', 'name', 'mobile', 'email', 'gst_number', 'status'],
    fields: [
      { name: 'name', label: 'Client Name', required: true },
      { name: 'mobile', label: 'Mobile Number', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'gst_number', label: 'GST Number' },
      { name: 'address', label: 'Address', type: 'textarea', span: 2 },
      { name: 'photo', label: 'Client Photo/Logo', type: 'file', uploadFolder: 'clients' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] }
    ]
  },
  suppliers: {
    title: 'Suppliers',
    columns: ['id', 'name', 'mobile', 'email', 'state', 'gst_number', 'opening_balance', 'status'],
    fields: [
      { name: 'name', label: 'Supplier Name', required: true },
      { name: 'mobile', label: 'Mobile' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'gst_number', label: 'GST Number' },
      { name: 'state', label: 'State' },
      { name: 'opening_balance', label: 'Opening Payable', type: 'number', step: '0.01', defaultValue: 0 },
      { name: 'address', label: 'Address', type: 'textarea', span: 2 },
      { name: 'photo', label: 'Photo / Document', type: 'file', uploadFolder: 'suppliers' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] }
    ]
  }
};
