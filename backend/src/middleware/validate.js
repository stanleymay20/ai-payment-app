export const validate = (schema) => (req, _res, next) => {
  const parsed = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
    headers: req.headers
  });

  if (!parsed.success) {
    const error = new Error('Validation failed');
    error.status = 400;
    error.details = parsed.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message
    }));
    return next(error);
  }

  req.validated = parsed.data;
  return next();
};
