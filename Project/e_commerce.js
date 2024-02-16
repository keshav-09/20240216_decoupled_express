/** To implements the ecommerce api on thunder client using filesystem
 * so here we will update the product id, details,order info,order status and 
 * many more,so let's begin
 */
// Import
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();






const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://root:root@cluster0.y04qx.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);






// Middleware to parse JSON bodies
app.use(express.json());
/**Function to read data
 * @param {function} callback -Callback function to handle the retrieved product 
 * data and it is writeen in the produxt.json is in json form we have to read it
 * utfs form
 */
// Function to read data from a JSON file
function readJSONFile(filePath, callback) {
    // Read file asynchronously
    fs.readFile(filePath, 'utf8', (err, data) => {
        // Handle errors if any
        if (err) {
            console.error("Error reading JSON file:", err);
            callback([]); // Callback with an empty array
            return;
        }
        try {
            // Parse JSON data
            const jsonData = JSON.parse(data);
            // Callback with parsed JSON data
            callback(jsonData);
        } catch (parseError) {
            console.error("Error parsing JSON data:", parseError);
            callback([]); // Callback with an empty array in case of parsing error
        }
    });
}

// Function to write data to a JSON file
function writeJSONFile(filePath, data, callback) {
    // Write data to file asynchronously
    fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
        // Handle errors if any
        if (err) {
            console.error("Error writing JSON file:", err);
            if (callback) {
                callback(err); // Callback with error if provided
            }
        } else {
            if (callback) {
                callback(null); // Callback without error if provided
            }
        }
    });
}
/** Function to update the product data in the JSON file
 * @param {Array} productData - Array containing of all product
 * @param {number} productId - ID of the product that we have to update
 * @param {Object} newData - update data
 */
function updateProductData(productData, productId, newData, callback) {
    // Map over product data to find and update the specified product
    const updatedProductData = productData.map(product => {
        if (product.id === productId) {
            return { ...product, ...newData }; // Merge existing data with new data
        }
        return product; // Return unchanged product if ID doesn't match
    });
    const filePath = path.join(__dirname, 'product.json');
    // Write updated product data to the JSON file
    writeJSONFile(filePath, updatedProductData, callback);
}

// Function to delete a record from a JSON file based on unique key
/** Deletes a record from a JSON file based on a unique key.
 * @param {string} pathOfFile - The path of JSON file.
 * @param {number} uniqueKey - The unique key of the record to be deleted.
 */

function deleteJSONRecord(filePath, uniqueKey, callback) {
    // Read JSON file to get current data
    readJSONFile(filePath, (jsonData) => {
        // Find index of the record with the given unique key
        const index = jsonData.findIndex(item => item.id === uniqueKey);
        if (index !== -1) {
            // Remove the record from the array
            jsonData.splice(index, 1);
            // Write the updated JSON data back to the file
            writeJSONFile(filePath, jsonData, (error) => {
                if (error) {
                    console.error("Error updating JSON file:", error);
                    return callback(error);
                }
                console.log("Record deleted successfully.");
                callback(null); // Callback without error on successful deletion
            });
        } else {
            console.error("Record with provided unique key not found.");
            callback(new Error("Record not found")); // Callback with error if record not found
        }
    });
}

// Function to update data in a JSON file based on unique key
function updateJSONData(filePath, uniqueKey, newData, callback) {
    // Read JSON file to get current data
    readJSONFile(filePath, (jsonData) => {
        // Find index of the record with the given unique key
        const index = jsonData.findIndex(item => item.order_id === uniqueKey);
        if (index !== -1) {
            // Update the record with new data
            jsonData[index] = { ...jsonData[index], ...newData };
            // Write the updated JSON data back to the file
            writeJSONFile(filePath, jsonData, (error) => {
                if (error) {
                    console.error("Error updating JSON file:", error);
                    return callback(error);
                }
                console.log("JSON file updated successfully.");
                callback(null); // Callback without error on successful update
            });
        } else {
            console.error("Order with provided ID not found.");
            callback(new Error("Order not found")); // Callback with error if order not found
        }
    });
}

// Route for searching products by name
app.get('/search', (req, res) => {
    const productName = req.query.name;
    // Extract the product name from the query parameter
    // if product name is not enter 
    if (!productName) {
        return res.status(400).json({ error: 'Product name is required' });
    }
    // Read the products JSON file
    const productsFilePath = path.join(__dirname, 'product.json');
    readJSONFile(productsFilePath, (products) => {
        // Filter products based on the product name
        const filteredProducts = products.filter(product => product.name.toLowerCase().includes(productName.toLowerCase()));
        res.json(filteredProducts);
    });
});

//Endpoint to update a product record
//we will pass here an id and according to the id product is updated
app.put('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const newData = req.body;

    // Read product data from JSON file
    const productFilePath = path.join(__dirname, 'product.json');
    readJSONFile(productFilePath, (productData) => {
        // Update product data
        updateProductData(productData, productId, newData, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error updating product data' });
            }
            res.json({ message: `Product with ID ${productId} updated successfully.` });
        });
    });
});

//to delete a product record from product json file
app.delete('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const productFilePath = path.join(__dirname, 'product.json');

    // Call deleteJSONRecord to delete 
    deleteJSONRecord(productFilePath, productId, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error deleting product record' });
        }
        res.json({ message: `Product with ID ${productId} deleted successfully` });
    });
});

// // to read the status of the order by using order.json file 
app.get('/orders/:id', (req, res) => {
    const orderId = parseInt(req.params.id);
    const orderFilePath = path.join(__dirname, 'order.json');

    // Read order data from JSON file
    readJSONFile(orderFilePath, (orders) => {
        // Find the order with the specified order ID
        const order = orders.find(order => order.order_id === orderId);
        if (order) {
            // If the order is found, return its status
            res.json({ status: order.status });
        } else {
            // If the order is not found, return a 404 status
            res.status(404).json({ error: 'Order not found' });
        }
    });
});

//Order creation
app.post('/orders', (req, res) => {
    const orderData = req.body;

    // Generate a unique order ID
    const orderId = Date.now();
    orderData.order_id = orderId;
    const ordersFilePath = path.join(__dirname, 'order.json');
    readJSONFile(ordersFilePath, (orders) => {
        // Add the new order to the existing orders
        orders.push(orderData);

        //  updated orders back to the order JSON file
        writeJSONFile(ordersFilePath, orders, (err) => {
            if (err) {
                res.status(500).json({ error: "Error creating order" });
            } else {
                res.status(200).json({ order_id: orderId });
            }
        });
    });
});

// Cancel order route
// will update the order status to cancel  if order id not present than throw err
app.put('/orders/:id/cancel', (req, res) => {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
        res.status(400).json({ error: "Invalid order ID" });
        return;
    }

    const ordersFilePath = path.join(__dirname, 'order.json');
    // Update order status to "Cancelled"
    updateJSONData(ordersFilePath, orderId, { status: "Cancelled" }, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error cancelling order' });
        }
        res.json({ message: "Order cancelled successfully", orderId });
    });
});

app.get('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id); // Extract the product ID from the URL parameter

    // Read the products JSON file
    const productsFilePath = path.join(__dirname, 'product.json');
    readJSONFile(productsFilePath, (products) => {
        // Find the product with the specified ID
        const product = products.find(product => product.id === productId);
        if (product) {
            // If the product is found, return its information
            res.json(product);
        } else {
            // If the product is not found, return a 404 status
            res.status(404).json({ error: 'Product not found' });
        }
    });
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

