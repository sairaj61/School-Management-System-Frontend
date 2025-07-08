export const formatApiError = (error) => {
  if (!error.response) {
    return 'Network error occurred';
  }

  const { data } = error.response;

  // Handle validation errors (array of errors)
  if (Array.isArray(data?.detail)) {
    return data.detail.map(err => {
      const field = err.loc[err.loc.length - 1];
      const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
      return `${fieldName}: ${err.msg}`;
    }).join('\n');
  }

  // Handle single error message
  if (data?.detail) {
    return data.detail;
  }

  // Default error message
  return 'An unexpected error occurred';
};

export const handleApiError = (error, setAlert) => {
  const errorMessage = formatApiError(error);
  setAlert({
    open: true,
    message: errorMessage,
    severity: 'error'
  });
  console.error('API Error:', error.response?.data || error.message);
}; 