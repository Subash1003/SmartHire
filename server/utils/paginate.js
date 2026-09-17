const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export async function paginate(model, filter, { page, limit, skip }, options = {}) {
  let query = model.find(filter, options.projection).sort(options.sort || { createdAt: -1 }).skip(skip).limit(limit);

  if (options.populate) {
    for (const p of options.populate) {
      query = query.populate(p);
    }
  }

  const [data, total] = await Promise.all([query, model.countDocuments(filter)]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
