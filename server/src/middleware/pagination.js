// Pagination middleware
const paginate = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  
  // Ensure reasonable limits
  const maxLimit = 100;
  const finalLimit = Math.min(limit, maxLimit);
  
  const skip = (page - 1) * finalLimit;

  req.pagination = {
    page,
    limit: finalLimit,
    skip
  };

  next();
};

module.exports = { paginate };
