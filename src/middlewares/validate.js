module.exports = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,   // retourne toutes les erreurs
      stripUnknown: true, // enlève les champs non définis
    });

    if (error) {
      return res.status(422).json({
        message: 'Validation error',
        details: error.details.map((err) => err.message),
      });
    }

    
    req.validatedBody = value;

    next();
  };
};
