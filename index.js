const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const stripe = require('stripe')("sk_test_51N2GidJraFl18PG7nuK3pkaMUEOsRPZ7X0tI6JI2AvPF69NMmPYeucxxH0IzjTNseGQagQpwoO2Vx96M2hxcqxX700Vm9dNhM0")

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://taskManagment:SbfQLkj6NLCymLtw@cluster0.37kn8jw.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();
    // Send a ping to confirm a successful connection
    const usersCollection = client.db("jobTask").collection("userCollections");
    const paymentCollection = client.db("jobTask").collection("paymentCollection");

    app.get("/users", async (req, res) => {
      const cursor = usersCollection.find()
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists" });
      }
      const result = await usersCollection.insertOne(user);
      return res.send(result);
    });

    app.get("/currentUser", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.send([]);
      }
      const query = { email: email };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    app.put("/updateUser", async (req, res) => {
      const email = req.body.email;
      const updatedData = {
        name: req.body.name,
        gender: req.body.gender,
        dateOfBirth: req.body.dateOfBirth,
      };

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const query = { email: email };
      const update = { $set: updatedData };

      const result = await usersCollection.updateOne(query, update);
      if (result.modifiedCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.status(200).json({ message: "User updated successfully" });
    });

    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });


    //payment done

    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentCollection.insertOne(payment);
      return res.send(result);
    });

    /*  */
    app.get("/payments", async (req, res) => {
      const email = req.query.email;
      const payments = await paymentCollection
        .find({ email })
        .sort({ date: -1 })
        .toArray();
      res.send(payments);
    });




    /*  */


    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("welcome to nifty");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
