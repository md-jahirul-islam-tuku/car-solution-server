const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5001;
require('dotenv').config();
require('colors');

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.USER_PASSWORD}@cluster0.fqmp7pn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'Unauthorized access' })
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
    if (err) {
      return res.status(401).send({message: 'Unauthorized access'})
    }
    req.decoded = decoded;
    next();
  })
}

async function run() {
  try {
    const servicesCollection = client.db('carDoctor').collection('services');
    const productsCollection = client.db('carDoctor').collection('products');
    const ordersCollection = client.db('carDoctor').collection('orders');

    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' })
      res.send({ token })
    })

    app.get('/orders', verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      if (decoded.email !== req.query.email) {
        res.status(403).send({message: 'Unauthorized access'})
      }
      let query = {}
      if (req.query.email) {
        query = {
          email: req.query.email
        };
      }
      const cursor = ordersCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    })
    app.get('/services', async (req, res) => {
      const query = {}
      const cursor = servicesCollection.find(query);
      const services = await cursor.toArray();
      res.send(services)
    })
    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const service = await servicesCollection.findOne(query)
      res.send(service)
    })
    app.get('/products', async (req, res) => {
      const query = {}
      const cursor = productsCollection.find(query);
      const products = await cursor.toArray();
      res.send(products)
    })
    app.post('/orders', async (req, res) => {
      const order = req.body;
      const result = await ordersCollection.insertOne(order);
      res.send(result)
    })
    app.delete('/orders/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.deleteOne(query);
      res.send(result);
    })
  }
  finally {

  }
}
run().catch(err => console.log(err))

app.get('/', (req, res) => {
  res.send('Car doctor server is running...')
})

app.listen(port, () => {
  console.log('Car doctor is listening...'.cyan.bold.italic, port);
})