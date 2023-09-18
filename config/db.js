const dotenv = require('dotenv');
dotenv.config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const client = new MongoClient(process.env.DB_URI2, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
	writeConcern: { w: 'majority', wtimeout: 0, provenance: 'clientSupplied' },
});

async function start() {
	try {
		await client.connect();
		const app = require('../app');
		const PORT = process.env.PORT || 3000;
		app.listen(PORT, () => console.log(`Server started at ${PORT}`));
	} catch (error) {
		console.error('Error connecting to the database:', error);
	}
}

start();
module.exports = client;
