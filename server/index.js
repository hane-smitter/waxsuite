require("dotenv").config();
const express = require("express");
const methodoverride = require("method-override");
const cors = require("cors");
const bodyparser = require("body-parser");
const winston = require("winston");
const expresswinston = require("express-winston");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const { connectDB } = require("./services/db/mysql.js");
const chalk = require("chalk");

const app = express();

const PORT = process.env.PORT || 5500;

app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.text());
app.use(bodyparser.json());
app.use(cors());

app.use(methodoverride("_method"));
app.use(
  expresswinston.logger({
    transports: [
      new winston.transports.Console({
        // @ts-ignore
        json: true,
        colirize: true,
      }),
      new winston.transports.File({
        filename: "logs/success.log",
      }),
    ],
  })
);

app.use(
  expresswinston.errorLogger({
    transports: [
      new winston.transports.Console({
        // @ts-ignore
        json: true,
        colorize: true,
      }),
      new winston.transports.File({
        filename: "logs/error.log",
      }),
    ],
  })
);
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      version: "1.0.0",
      title: "WorkSuite API",
      description: "WorkSuite API Information",
      contact: {
        name: " Developer",
      },
      servers: ["http://localhost:5000"],
    },
  },
  apis: ["./routes/*.js", "./controllers/*.js"],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

connectDB()
  .then((msg) => {
    console.log(chalk.green("Yay! " + msg));
    app.listen(PORT, () => console.log(`Server running on PORT ${chalk.green(PORT)} 🔥`));
  })
  .catch((err) => console.error(chalk.bgRed("Unable to connect application: ", err)));
