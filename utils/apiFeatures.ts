type QueryString = Record<string, any>;

interface APIFeaturesOptions {
  filterFields?: string[];
  sortFields?: string[];
  selectFields?: string[];
  searchFields?: string[];
  maxLimit?: number;
}

export class APIFeatures<T = any> {
  private queryString: QueryString;
  private options: APIFeaturesOptions;

  public where: any = {};
  public orderBy: any = [{ createdAt: "desc" }];
  public select: any = undefined;
  public skip: number = 0;
  public take: number = 40;

  constructor(queryString: QueryString, options: APIFeaturesOptions = {}) {
    this.queryString = queryString;

    this.options = {
      maxLimit: 100,
      ...options,
    };
  }

  filter() {
    const { filterFields = [] } = this.options;

    const queryObj = {
      ...this.queryString,
    };

    const excludedFields = ["page", "sort", "limit", "fields", "search"];

    excludedFields.forEach((field) => {
      delete queryObj[field];
    });

    const where: any = {};

    for (const key in queryObj) {
      // Only allow known filter fields
      if (!filterFields.includes(key)) {
        continue;
      }

      const value = queryObj[key];

      if (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        const operators: any = {};

        for (const operator in value) {
          if (["gte", "gt", "lte", "lt"].includes(operator)) {
            const numberValue = Number(value[operator]);

            if (!Number.isNaN(numberValue)) {
              operators[operator] = numberValue;
            }
          }
        }

        if (Object.keys(operators).length) {
          where[key] = operators;
        }
      } else {
        where[key] = value;
      }
    }

    this.where = where;

    return this;
  }

  search(fields?: string[]) {
    const searchFields = fields ?? this.options.searchFields ?? [];

    if (this.queryString.search && searchFields.length) {
      const searchTerm = String(this.queryString.search).trim();

      if (searchTerm) {
        this.where = {
          ...this.where,
          OR: searchFields.map((field) => ({
            [field]: {
              contains: searchTerm,
              mode: "insensitive",
            },
          })),
        };
      }
    }

    return this;
  }

  sort() {
    const { sortFields = [] } = this.options;

    if (!this.queryString.sort) {
      this.orderBy = [{ createdAt: "desc" }];

      return this;
    }

    const fields = String(this.queryString.sort)
      .split(",")
      .map((field) => field.trim())
      .filter(Boolean);

    const validSortFields = fields
      .map((field) => {
        const isDescending = field.startsWith("-");

        const fieldName = isDescending ? field.substring(1) : field;

        // Only allow known sort fields
        if (!sortFields.includes(fieldName)) {
          return null;
        }

        return {
          [fieldName]: isDescending ? "desc" : "asc",
        };
      })
      .filter(Boolean);

    this.orderBy = validSortFields.length
      ? validSortFields
      : [{ createdAt: "desc" }];

    return this;
  }

  limitFields() {
    const { selectFields = [] } = this.options;

    if (!this.queryString.fields || !selectFields.length) {
      return this;
    }

    const fields = String(this.queryString.fields)
      .split(",")
      .map((field) => field.trim())
      .filter(Boolean);

    const allowedFields = fields.filter((field) =>
      selectFields.includes(field),
    );

    if (allowedFields.length) {
      this.select = allowedFields.reduce((acc: any, field) => {
        acc[field] = true;
        return acc;
      }, {});
    }

    return this;
  }

  paginate() {
    let page = Number(this.queryString.page) || 1;

    let limit = Number(this.queryString.limit) || 40;

    // Prevent invalid values
    if (page < 1) {
      page = 1;
    }

    if (limit < 1) {
      limit = 1;
    }

    // Prevent huge queries
    const maxLimit = this.options.maxLimit ?? 100;

    if (limit > maxLimit) {
      limit = maxLimit;
    }

    this.skip = (page - 1) * limit;

    this.take = limit;

    return this;
  }

  build() {
    return {
      where: this.where,
      orderBy: this.orderBy,
      select: this.select,
      skip: this.skip,
      take: this.take,
    };
  }
}
