export const packagesToBaseUnits = (packages, qtyPerPackage) => {
  const pkg = parseFloat(packages || 0);
  const base = parseFloat(qtyPerPackage || 0);
  if (isNaN(pkg) || isNaN(base)) return 0;
  return pkg * base;
};

export const normalizeCategoryKey = (value, categories = []) => {
  if (!value) return '';
  const normalized = value.trim().toLowerCase();
  const keys = categories.length > 0 ? categories : [];
  const match = keys.find((cat) => cat.toLowerCase() === normalized);
  return match || value;
};


