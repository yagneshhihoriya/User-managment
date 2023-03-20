const dotenv = require("dotenv");
dotenv.config();

module.exports = {
	PROJECT_NAME: "Product",
	PORT: process.env.PORT,

	database: {
		mongoURL: process.env.MONGO_URL,
		use: process.env.DB_USE // specify db =>  mongodb , mysql
	},
};
