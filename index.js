const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const exec = require("child_process").exec;

const app = express();
const port = 3000;
const cors = require("cors");
app.use(cors());
// Ensure the 'uploads' directory exists
if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname),
    );
  },
});

// Initialize multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).array("images", 10); // Accept up to 10 images

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}

// Serve static files
app.use(express.static("./public"));

// Serve the 'uploads' directory statically
app.use("/uploads", express.static("uploads"));
app.use("/output", express.static("output"));

// Upload route
app.post("/upload", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      console.log(err);
      res.send("Error: " + err);
    } else {
      if (req.files == undefined) {
        res.send("Error: No Files Selected!");
      } else {
        const filePaths = req.files.map((file) => file.path);
        const outputPath = path.join("output", `panorama-${Date.now()}.jpeg`);

        // Log the file paths for debugging
        console.log("Files to be stitched:", filePaths);
        console.log("Output path:", outputPath);

        // Construct the command to run the Python script
        const command = `python3 stitch.py ${outputPath} ${filePaths.join(" ")}`;
        console.log("Executing command:", command);

        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error("Error:", error);
            console.error("stdout:", stdout);
            console.error("stderr:", stderr);
            res.send("Error stitching images: " + error.message);
          } else {
            console.log("stdout:", stdout);
            console.log("stderr:", stderr);
            res.send(`
              <html>
                <head><title>Panorama Created</title></head>
                <body>
                  <h1>Panorama Created!</h1>
                  <p><a href="https://81db4ec0-bb4d-4aac-8c6a-a04cf553573d-00-1coxric1gxo3d.janeway.replit.dev/view/${path.basename(outputPath)}">View Panorama</a></p>
                </body>
              </html>
            `);
          }
        });
      }
    }
  });
});

// View panorama route
app.get("/view/:filename", (req, res) => {
  const filePath = path.join(__dirname, "output", req.params.filename);
  if (fs.existsSync(filePath)) {
    res.send(`
      <html>
        <head>
          <script src="https://cdn.pannellum.org/2.5/pannellum.js"></script>
          <link rel="stylesheet" href="https://cdn.pannellum.org/2.5/pannellum.css"/>
        </head>
        <body>
          <div id="panorama" style="width: 100%; height: 600px;"></div>
          <script>
            pannellum.viewer('panorama', {
              "type": "equirectangular",
              "panorama": "/output/${encodeURIComponent(req.params.filename)}"
            });
          </script>
        </body>
      </html>
    `);
  } else {
    res.send("File not found");
  }
});

// Start server
app.listen(port, () => console.log(`Server started on port ${port}`));
