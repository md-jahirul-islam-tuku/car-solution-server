const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ MongoDB URI (use .env)
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3v6wfc1.mongodb.net/?appName=Cluster0;`;

// Mongo Client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// ✅ JWT Middleware
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
}

// ✅ Main Function
async function run() {
  try {
    await client.connect();
    console.log("✅ MongoDB Connected");

    const db = client.db("carSolution");

    const servicesCollection = db.collection("services");
    const productsCollection = db.collection("products");
    const ordersCollection = db.collection("orders");

    // ================= JWT =================
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "7d",
      });
      res.send({ token });
    });

    // ================= SERVICES =================
    app.get("/services", async (req, res) => {
      try {
        const services = await servicesCollection.find().toArray();
        res.send(services);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    app.get("/services/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const service = await servicesCollection.findOne({
          _id: new ObjectId(id),
        });
        res.send(service);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    // ================= PRODUCTS =================
    app.get("/products", async (req, res) => {
      try {
        const products = await productsCollection.find().toArray();
        res.send(products);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    // ================= ORDERS =================
    app.post("/orders", async (req, res) => {
      try {
        const order = req.body;
        const result = await ordersCollection.insertOne(order);
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    app.get("/orders", verifyJWT, async (req, res) => {
      try {
        const decoded = req.decoded;

        if (decoded.email !== req.query.email) {
          return res.status(403).send({ message: "Forbidden access" });
        }

        const query = { email: req.query.email };
        const orders = await ordersCollection.find(query).toArray();

        res.send(orders);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    app.delete("/orders/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await ordersCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });
  } catch (err) {
    console.error("❌ MongoDB Error:", err);
  }
}

run();

// Root Route
app.get("/", (req, res) => {
  res.send("🚗 Car Solution Server Running...");
});

// Start Server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
