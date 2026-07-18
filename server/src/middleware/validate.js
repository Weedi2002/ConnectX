export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({ body: req.body, params: req.params, query: req.query });
    if (parsed.body) req.body = parsed.body;
    next();
  } catch (err) {
    next(err);
  }
};
