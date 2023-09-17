const express = require("express");
const router = express.Router();
require("dotenv").config(); // just comment one more
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const User = require("../model/userSchema.js");

cloudinary.config({
  cloud_name: process.env.CLOUND_NAME,
  api_key: process.env.CLOUND_API_KEY,
  api_secret: process.env.CLOUND_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// add next while doing next(err);
router.post("/uploadProfilePic", upload.single("myImage"), async (req, res) => {
  const file = req.file;
  const { userId } = req.body;

  if (!file) {
    return res.status(400).json({ error: "No image file provided" });
  }
  const existingUser = await User.findById(userId);
  if (!existingUser) {
    return res.status(400).json({ error: "No user found" });
  }

  console.log(existingUser);


//   cloudinary.uploader
//     .upload_stream(
//       {
//         resource_type: "auto",
//       },
//       async (error, result) => {
//         if (error) {
//           console.error("Cloudinary Upload Error:", error);
//           return res
//             .status(500)
//             .json({ error: "Error uploading image to Cloudinary" });
//         }
//         res.send(result);

//         //     existingUser.profilePic = result.secure_url;

//         //     await existingUser.save();
//         // res.json({ imageUrl: result.url  , message: 'Profile picture uploaded successfully'});
//       }
//     )
//         .end(file.buffer);
    
    cloudinary.uploader.upload_stream(
        { resource_type: "auto" },
        async (err, result) => {
            if (err) {
                console.log("Cloudinary Upload Error:", err);
                return res
                    .status(500)
                    .json({ error: "Error Uploading Image To Cloudinary...." });
            }
            res.send(result)
        }
    )
        // .end(file.buffer)
});

module.exports = router;
