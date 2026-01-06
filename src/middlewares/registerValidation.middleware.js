export const registerValidation = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(422).json({
        errors: result.error.errors
      });
    }
    req.body = result.data;
    next();
  };
