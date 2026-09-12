import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import app from "./app.js";

const port = process.env.PORT || 6000;

app.listen(port, () => {
  console.log(`App running on port ${port}...`);
  console.log(`[swagger]: Docs available at http://localhost:${port}/api-docs`);
});
