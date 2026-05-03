import { Prisma } from "@prisma/client";

type QueryString = Record<string, any>;

export class APIFeatures<T> {
  private queryString: QueryString;

  public where: Prisma.PrismaClientKnownRequestError | any = {};
  public orderBy: any = {};
  public select: any = undefined;
  public skip: number = 0;
  public take: number = 40;

  constructor(queryString: QueryString) {
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields", "search"];

    excludedFields.forEach((el) => delete queryObj[el]);

    const where: any = {};

    for (const key in queryObj) {
      const value = queryObj[key];

      if (typeof value === "object") {
        // gte, gt, lte, lt
        where[key] = {};

        for (const operator in value) {
          if (["gte", "gt", "lte", "lt"].includes(operator)) {
            where[key][operator] = Number(value[operator]);
          }
        }
      } else {
        where[key] = value;
      }
    }

    this.where = where;
    return this;
  }

  search(fields: string[]) {
    if (this.queryString.search) {
      const searchTerm = this.queryString.search;

      this.where = {
        ...this.where,
        OR: fields.map((field) => ({
          [field]: {
            contains: searchTerm,
            mode: "insensitive",
          },
        })),
      };
    }

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const fields = this.queryString.sort.split(",");

      this.orderBy = fields.map((field: string) => {
        if (field.startsWith("-")) {
          return { [field.substring(1)]: "desc" };
        }
        return { [field]: "asc" };
      });
    } else {
      this.orderBy = [{ createdAt: "desc" }];
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",");

      this.select = fields.reduce((acc: any, field: string) => {
        acc[field] = true;
        return acc;
      }, {});
    }

    return this;
  }

  paginate() {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 40;

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
