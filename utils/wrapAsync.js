/*
module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};
*/

module.exports = (fn) => {
  return (req, res, next) => {
    try {
      const result = fn(req, res, next);
      if (result instanceof Promise) {
        result.catch((err) => next(err));
      }
    } catch (err) {
      next(err);
    }
  };
};
