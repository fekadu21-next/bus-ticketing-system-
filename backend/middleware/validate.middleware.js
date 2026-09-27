import ApiError from '../utils/apiError.js';

export const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      const errorMessages = parsed.error.issues.map((issue) => {
        const path = issue.path.join('.');
        return path ? `${path}: ${issue.message}` : issue.message;
      });
      return next(new ApiError(400, 'Validation error', errorMessages));
    }

    if (source === 'query') {
      Object.assign(req.query, parsed.data);
    } else {
      req[source] = parsed.data;
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default validate;