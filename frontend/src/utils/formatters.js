export const capitalizeWords = (value = '') => {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const formatQuantityDisplay = ({ FormattedPackages, QtyInTotal, BaseUnitAbbr }, showPackage) => {
  if (showPackage && FormattedPackages) {
    return FormattedPackages;
  }
  const qty = Number(QtyInTotal);
  const rounded = Number.isFinite(qty) ? Math.round(qty) : 0;
  return `${rounded}${BaseUnitAbbr || ''}`;
};

export const computeRelativeExpiration = (targetDate) => {
  if (!targetDate) return 'unknown';
  const diffMs = new Date(targetDate) - new Date();
  if (diffMs <= 0) return 'expired';

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    const dayLabel = `${days} day${days > 1 ? 's' : ''}`;
    return hours ? `${dayLabel} ${hours} hr` : dayLabel;
  }

  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  }

  return `${minutes} min`;
};


