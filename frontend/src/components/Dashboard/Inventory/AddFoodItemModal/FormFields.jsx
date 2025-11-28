import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { CATEGORY_EMOJI } from '../../../../utils/foodEmojis';

export const LeftColumnFields = ({
  formData,
  handleChange,
  locations,
  categories,
  showExpiration = true,
}) => (
  <>
    <TextField
      required
      label="Name:"
      value={formData.food_name}
      onChange={handleChange('food_name')}
      fullWidth
    />

    <FormControl fullWidth required>
      <InputLabel>Location</InputLabel>
      <Select
        value={formData.location_id}
        onChange={handleChange('location_id')}
        label="Location"
      >
        {locations.map((loc) => (
          <MenuItem key={loc.LocationID} value={loc.LocationID}>
            {loc.LocationName}
          </MenuItem>
        ))}
      </Select>
    </FormControl>

      <TextField
        required
        label="Stock Threshold:"
        type="number"
        value={formData.target_level}
        onChange={handleChange('target_level')}
        fullWidth
        inputProps={{ min: '1', step: '1' }}
      />

      {showExpiration && (
        <TextField
          label="Expiration Date:"
          type="date"
          value={formData.expiration_date}
          onChange={handleChange('expiration_date')}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      )}

      <FormControl fullWidth required>
        <InputLabel>Category:</InputLabel>
        <Select
          value={formData.category}
          onChange={handleChange('category')}
          label="Category:"
        >
          {categories.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {CATEGORY_EMOJI[cat]} {cat}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
  </>
);

export const RightColumnFields = ({
  formData,
  handleChange,
  baseUnits,
  packageLabels,
  readOnlyBaseUnit = false,
  baseUnitLabel,
  quantityFieldOptions = {},
}) => {
  const {
    label: quantityLabel = 'Quantity:',
    helperText: quantityHelperText,
    inputProps: quantityInputOverrides = {},
    required: quantityRequired = true,
    hideField: hideQuantityField = false,
  } = quantityFieldOptions;

  const mergedQuantityInputProps = {
    min: '1',
    ...quantityInputOverrides,
  };

  return (
    <>
      {!hideQuantityField && (
        <TextField
          required={quantityRequired}
          label={quantityLabel}
          type="number"
          value={formData.quantity}
          onChange={handleChange('quantity')}
          fullWidth
          inputProps={mergedQuantityInputProps}
          helperText={quantityHelperText}
        />
      )}

    <Box sx={{ display: 'flex', gap: 1 }}>
      <FormControl required sx={{ flex: 1 }}>
        <InputLabel>Package</InputLabel>
        <Select
          value={packageLabels.includes(formData.package_label) ? formData.package_label : 'Other'}
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'Other') {
              handleChange('package_label')({ target: { value: '' } });
            } else {
              handleChange('package_label')({ target: { value } });
            }
          }}
          label="Package"
        >
          {packageLabels.map((label) => (
            <MenuItem key={label} value={label}>
              {label}
            </MenuItem>
          ))}
          <MenuItem value="Other">Other</MenuItem>
        </Select>
      </FormControl>

      {(!formData.package_label || !packageLabels.includes(formData.package_label)) && (
        <TextField
          required
          label="Package Label"
          value={formData.package_label}
          onChange={handleChange('package_label')}
          sx={{ flex: 1 }}
          placeholder="e.g., box, tin, jar"
        />
      )}
    </Box>

    <Box sx={{ display: 'flex', gap: 1 }}>
      <TextField
        required
        label="Amount per Item"
        type="number"
        value={formData.package_base_unit_amt}
        onChange={handleChange('package_base_unit_amt')}
        sx={{ flex: 1 }}
        inputProps={{ step: '0.01', min: '0.01' }}
      />
      {readOnlyBaseUnit ? (
        <Box sx={{ minWidth: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Unit
          </Typography>
          <Typography variant="body2">
            {baseUnitLabel ||
              (() => {
                const unit = baseUnits.find(
                  (u) => String(u.UnitID) === String(formData.base_unit_id)
                );
                return unit ? unit.Abbreviation : '';
              })()}
          </Typography>
        </Box>
      ) : (
        <FormControl required sx={{ minWidth: 100 }}>
          <InputLabel>Unit</InputLabel>
          <Select
            value={formData.base_unit_id}
            onChange={handleChange('base_unit_id')}
            label="Unit"
          >
            {baseUnits.map((unit) => (
              <MenuItem key={unit.UnitID} value={unit.UnitID}>
                {unit.Abbreviation}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Box>

    <TextField
      label="Price Per Package:"
      type="number"
      value={formData.price_per_item}
      onChange={handleChange('price_per_item')}
      fullWidth
      inputProps={{ step: '0.01', min: '0' }}
    />
    <TextField
      label="Store:"
      value={formData.store}
      onChange={handleChange('store')}
      fullWidth
    />
  </>
  );
};

