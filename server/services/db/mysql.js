const { Sequelize, DataTypes } = require("sequelize");
const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");

// Generate database credentials according to workspace environment
const dbCredentials = {
  dialect: "mysql",
};
switch (process.env.NODE_ENV) {
  case "development":
    Object.assign(dbCredentials, {
      name: process.env.DEV_DB_NAME,
      user: process.env.DEV_DB_USER,
      password: process.env.DEV_DB_PASSWORD,
      host: process.env.DEV_DB_HOST || "127.0.0.1",
    });
    break;
  case "production":
    Object.assign(dbCredentials, {
      name: process.env.PROD_DB_NAME,
      user: process.env.PROD_DB_USER,
      password: process.env.PROD_DB_PASSWORD,
      host: process.env.PROD_DB_HOST || "127.0.0.1",
    });
    break;
  case "test":
    Object.assign(dbCredentials, {
      name: process.env.TEST_DB_NAME,
      user: process.env.TEST_DB_USER,
      password: process.env.TEST_DB_PASSWORD,
      host: process.env.TEST_DB_HOST || "127.0.0.1",
    });
    break;

  default:
    Object.assign(dbCredentials, {
      name: "HCM",
      user: "root",
      password: null,
      host: "127.0.0.1",
    });
    break;
}

async function prepDB() {
  // Create database if it is not created
  const { dialect, name, ...mysqlCreds } = dbCredentials;
  // console.log("mysqlCreds", mysqlCreds);
  try {
    const connection = await mysql.createConnection(mysqlCreds);
    const result = await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${dbCredentials.name}`
    );
    // console.log("result ", result);
    // console.log("res", result[0].affectedRows);
    if (result[0].affectedRows)
      console.log(chalk.underline.blueBright(`DATABASE CREATED (${dbCredentials.name})`));
    console.log(chalk.blue("DATABASE PREPARED"));
    connection.end();
  } catch (err) {
    console.log(chalk.bgRed("Database error:", err));
    process.exit(1);
  }
}

const connectDB = async () => {
  await prepDB();
  try {
    const sequelize = new Sequelize(
      dbCredentials.name,
      dbCredentials.user,
      dbCredentials.password,
      {
        host: dbCredentials.host,
        dialect: dbCredentials.dialect,
      }
    );
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");

    const models = path.join(__dirname, "../../models");

    const sift = /^\w+[.]?\w+.[jt]s$/;
    fs.readdirSync(models)
      .filter((file) => sift.test(file))
      .forEach(function (file) {
        require(path.join(models, file))(sequelize, DataTypes);
        // console.log("starng one", model);
        // db[model.name] = model;
      });

    await sequelize.sync({ logging: false });
    console.log("Models synchronized");

    return Promise.resolve("Database is connected");
  } catch (err) {
    // console.log("err", err);
    return Promise.reject(err.message);
  }
};

// const connectDB = () =>
//   new Promise(async (resolve, reject) => {
//     try {
//       await sequelize.authenticate();
//       console.log("Connection has been established successfully.");
//       await sequelize.sync({ force: true });
//       console.log("Models synchronized");
//       resolve("Database connection successful");
//     } catch (error) {
//       reject(error);
//     }
//   });

module.exports.connectDB = connectDB;
