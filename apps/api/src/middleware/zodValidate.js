/**
 * Express middleware adapter for Zod schemas.
 *
 * Parses `req.body` against the provided Zod schema and, on failure,
 * returns a 400 response that matches the existing validation error
 * contract used by express-validator:
 *
 *   { success: false, message: "Validation failed", errors: [{ field, message }] }
 *
 * Usage:
 *   import { zodValidate } from '../middleware/zodValidate.js';
 *   router.post('/login', zodValidate(loginSchema), loginController);
 */
export const zodValidate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Replace req.body with the parsed (and potentially transformed) data
  req.body = result.data;
  next();
};

export default zodValidate;
