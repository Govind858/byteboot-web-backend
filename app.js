const express = require("express");
const mongoose = require("mongoose");
const Product = require("./Models/Product");
require("dotenv").config();
const router = express.Router()
const cors = require('cors')
const upload = require('./Config/MulterConfig')
const cloudinary = require('cloudinary').v2; 
require("./Config/CloudinaryConfig")
const cron = require('node-cron');
const { getReviews } = require('./puppeteer/getReviews')
const Admin = require('./Models/Admin')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const connectDB = require('./Config/Dbconfig');



const app = express();

app.use(cors())
app.use(express.json());

// Test Route
router.post("/product", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const media = req.file;

    // Determine resource type
    let resourceType = "auto";
    if (media.mimetype.startsWith("video/")) {
      resourceType = "video";
    } else if (media.mimetype.startsWith("image/")) {
      resourceType = "image";
    }

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "ecommerce_products", // ✅ NEW FOLDER
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(media.buffer);
    });

    // Save product with Cloudinary URL
    const product = await Product.create({
      ...req.body,
      image: uploadResult.secure_url,   // ✅ Save image URL
      public_id: uploadResult.public_id // (optional but recommended)
    });

    res.status(201).json({
      success: true,
      message: "Successfully added product",
      product,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to add product",
      error: error.message,
    });
  }
});

router.get("/product", async (req, res) => {
  try {
    const product = await Product.find({});

    res.status(201).json({
      success: true,
      message: "Successfully fethed product",
      product: product
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message
    });
  }
});

router.get("/product/:id", async (req, res) => {
  try {
    // 1. Get the ID from the URL parameters
    const productId = req.params.id;

    // 2. Find the product in the database by its ID
    const product = await Product.findById(productId);

    // 3. Handle the case where the product doesn't exist
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 4. Return the found product
    res.status(200).json({
      success: true,
      message: "Successfully fetched product",
      product: product,
    });

  } catch (error) {
    console.error(error);
    
    // Handle specific Mongoose invalid ID errors (CastError) gracefully
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
});

router.delete("/product/:id", async (req, res) => {
  try {
    // 1. Get the ID from the URL parameters
    const productId = req.params.id;

    // 2. Find the product in the database by its ID
    const product = await Product.findByIdAndDelete(productId);
        // const product = await Product.deleteMany({});


    // 3. Handle the case where the product doesn't exist
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 4. Return the found product
    res.status(200).json({
      success: true,
      message: "Successfully deleted product",
      product: product,
    });

  } catch (error) {
    console.error(error);
    
    // Handle specific Mongoose invalid ID errors (CastError) gracefully
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
});


router.put("/product/:id", async (req, res) => {
  try {
    console.log("CALLED --------------")
    const productId = req.params.id;
    const updateData = req.body;
    console.log("udateData 00000000000000",updateData)
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { returnDocument: 'after' }
    );
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    console.log(updatedProduct)
    res.status(200).json({
      success: true,
      message: "Successfully updated product",
      product: updatedProduct
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message
    });
  }
});

router.post('/add-admin', async (req, res) => {
    try {
        const { userName, email, password } = req.body;

        // 1. Basic Validation
        if (!userName || !password) {
            return res.status(400).json({ message: 'Please provide name, email, and password.' });
        }

        // 2. Check if Admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: 'An admin with this email already exists.' });
        }

        // 3. Encrypt the password using bcrypt
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Create the new Admin instance
        const newAdmin = new Admin({
            userName,
            password: hashedPassword
        });

        // 5. Save to the database
        await newAdmin.save();

        // 6. Send success response (excluding the password)
        res.status(201).json({ 
            message: 'Admin added successfully', 
            admin: {
                _id: newAdmin._id,
                name: newAdmin.userName,
                email: newAdmin.email
            }
        });

    } catch (error) {
        console.error('Error adding admin:', error);
        res.status(500).json({ message: 'Server error while adding admin.' });
    }
});


router.post('/login', async (req, res) => {
    try {
        const { userName, password } = req.body;

        // 1. Basic Validation
        if (!userName || !password) {
            return res.status(400).json({ message: 'Please provide both userName and password.' });
        }

        // 2. Find the admin by userName
        const admin = await Admin.findOne({ userName });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials.' }); 
        }

        // 3. Compare the provided password with the hashed password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // 4. Generate the JWT
        // The payload contains the data you want to store inside the token
        const payload = {
            adminId: admin._id,
            userName: admin.userName
        };

        // Sign the token with your secret key and set an expiration time (e.g., 1 hour)
        const token = jwt.sign(payload, process.env.JWT_KEY, { expiresIn: '1h' });

        // 5. Send success response including the generated token
        res.status(200).json({ 
            message: 'Login successful', 
            token: token, // Send the token to the client
            admin: {
                _id: admin._id,
                userName: admin.userName
            }
        });

    } catch (error) {
        console.error('Error during admin login:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});


const MAPS_URL = "https://www.google.com/maps/place/Byteboot+techno+Solutions+Pvt+Ltd/@9.9674064,76.2971434,17z/data=!3m1!4b1!4m6!3m5!1s0x3b080d08fa24c74d:0x6e4d855cfe4fbfd6!8m2!3d9.9674011!4d76.2997183!16s%2Fg%2F11v04131yc?authuser=0&entry=ttu&g_ep=EgoyMDI2MDIxOC4wIKXMDSoASAFQAw%3D%3D";

// cron.schedule('*/20 * * * * *', async () => {
//     console.log("Cron Job Started: Syncing Google Reviews...");
    
//     const data = await getReviews(MAPS_URL);
    
//     for (const item of data) {
//         if (item.rating >= 4) {
//             // Use findOneAndUpdate to avoid duplicates in your DB
//             await Review.findOneAndUpdate(
//                 { author: item.author, text: item.text },
//                 item,
//                 { upsert: true }
//             );
//         }
//     }
//     console.log("Cron Job Finished: DB Updated.");
// });

app.use(router)

const start = async () => {
  try {
    await connectDB();

    // AdminJS Setup
    const { AdminJS } = await import('adminjs');
    const AdminJSExpress = await import('@adminjs/express');
    const AdminJSMongoose = await import('@adminjs/mongoose');

    AdminJS.registerAdapter(AdminJSMongoose);

    const adminJs = new AdminJS({
      resources: [
        { resource: Product, options: { navigation: { name: 'Dashboard', icon: 'Product' } } }
      ],
      rootPath: '/admin',
    });

    const adminRouter = AdminJSExpress.buildRouter(adminJs);
    app.use(adminJs.options.rootPath, adminRouter);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`AdminJS started on http://localhost:${PORT}/admin`);
    });
  } catch (error) {
    console.error("❌ Server Error:", error);
  }
};

start();
