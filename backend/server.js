const express = require('express');
const cors = require('cors');
const mysqlConnection = require('./connections/mysqlConnection');
const redisClient = require('./connections/redisConnection');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({ message: "GENYSIS API is running" });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

