import swaggerAutogen from "swagger-autogen";
import dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT || 4000;

const doc = {
  info: {
    title: "E-Commerce API",
    description: "REST API for E-Commerce application",
    version: "1.0.0",
  },

  host: `localhost:${port}`,
  schemes: ["http"],
  basePath: "",

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },

    parameters: {
      pageParam: {
        name: "page",
        in: "query",
        required: false,
        schema: {
          type: "integer",
          default: 1,
        },
      },

      limitParam: {
        name: "limit",
        in: "query",
        required: false,
        schema: {
          type: "integer",
          default: 40,
        },
      },

      sortParam: {
        name: "sort",
        in: "query",
        required: false,
        schema: {
          type: "string",
          example: "-createdAt,price",
        },
      },

      fieldsParam: {
        name: "fields",
        in: "query",
        required: false,
        schema: {
          type: "string",
          example: "title,price,description",
        },
      },

      searchParam: {
        name: "search",
        in: "query",
        required: false,
        schema: {
          type: "string",
          example: "iphone",
        },
      },
    },
  },
};

const outputFile = "./swagger-output.json";

const endpointsFiles = ["./app.ts"];

swaggerAutogen({ openapi: "3.0.0" })(outputFile, endpointsFiles, doc);
