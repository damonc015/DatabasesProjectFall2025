export const validateForm = (formData, options = {}) => {
  const { requireBaseUnitId = true } = options;

  const requiredFields = [
    'food_name',
    'category',
    'location_id',
    'package_label',
    'package_base_unit_amt',
    'target_level',
    'quantity'
  ];

  for (const field of requiredFields) {
    if (!formData[field]) {
      return 'Please fill in all required fields';
    }
  }

  if (requireBaseUnitId && !formData.base_unit_id) {
    return 'Please fill in all required fields';
  }

  if (!formData.package_label || formData.package_label.trim() === '') {
    return 'Please enter a package label';
  }

  return null;
};

