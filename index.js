const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes")
const applicationRoutes= require("./routes/applicationRoutes")
const jobRoutes = require("./routes/jobRoutes")
const fileUpload = require("express-fileupload");

const app = express();
const PORT = process.env.PORT || 3000;

dotenv.config();

const url=process.env.MONGO_URI;

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// Middleware
app.use(express.json());
app.use(cors()); // Add this line to enable CORS
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/job", jobRoutes);
app.use("/api/v1/application",applicationRoutes);



// Connect to MongoDB
mongoose
  .connect(
    `${url}`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: "courseverse",
    }
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error.message);
  });

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
