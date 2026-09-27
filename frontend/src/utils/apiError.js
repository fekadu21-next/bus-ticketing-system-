/**
 * Helper to extract a friendly error message from Axios / backend response
 */
export const extractErrorMessage = (err, fallback = 'An unexpected error occurred') => {
  if (!err) return fallback;
  if (err.response?.data?.message) return err.response.data.message;
  if (err.response?.data?.error) return err.response.data.error;
  if (err.message) return err.message;
  return fallback;
};

/**
 * Helper to extract validation field errors if returned as an array from backend Zod middleware
 */
export const extractValidationErrors = (err) => {
  if (err?.response?.data?.errors && Array.isArray(err.response.data.errors)) {
    const errorMap = {};
    err.response.data.errors.forEach((e) => {
      const field = e.field || (Array.isArray(e.path) ? e.path[e.path.length - 1] : e.path);
      if (field) {
        errorMap[field] = e.message;
      }
    });
    return errorMap;
  }
  return {};
};
