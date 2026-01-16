const { ValidationException } = require('./exceptions');

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(422).json({
      errors: result.error.errors,
    });
  }

  req.validatedBody = result.data;
  next();
};

module.exports = validate;
