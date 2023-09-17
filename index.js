const express = require("express");             // to get api calling
const bodyparser = require("body-parser");      // to fetch bodyParser from the document
const cookieParser = require("cookie-parser");  // to fetch cookie from the website
const bcrypt = require("bcrypt");               // library that secure paasword using genSalt method's and many more auth.
const cors = require("cors");                   // cross-origin-resourece-sharing use to attach specific frontend at backend 
const jwt = require("jsonwebtoken");            // jwt is token credite library that give a token in the form of header.payload.signature
const app = express();
const PORT = 8000;

require("dotenv").config;
require("./db.js");
const User = require("./model/userSchema.js");
const imageUploadRoutes = require("./controllers/imageUploadRouter.js");

const userData = [
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "password123",
    "age": 30,
    "gender": "male"
  },
  {
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "password": "securePassword",
    "age": 28,
    "gender": "female"
  },
  {
    "name": "David Johnson",
    "email": "david.johnson@example.com",
    "password": "mySecretPass",
    "age": 35,
    "gender": "male"
  },
  {
    "name": "Emily Davis",
    "email": "emily.davis@example.com",
    "password": "strongPassword",
    "age": 25,
    "gender": "female"
  },
  {
    "name": "Michael Brown",
    "email": "michael.brown@example.com",
    "password": "password12345",
    "age": 32,
    "gender": "male"
  },
  {
    "name": "Sophia Wilson",
    "email": "sophia.wilson@example.com",
    "password": "12345678",
    "age": 27,
    "gender": "female"
  },
  {
    "name": "Daniel Lee",
    "email": "daniel.lee@example.com",
    "password": "danielPass",
    "age": 29,
    "gender": "male"
  },
  {
    "name": "Olivia Harris",
    "email": "olivia.harris@example.com",
    "password": "secure123",
    "age": 26,
    "gender": "female"
  },
  {
    "name": "William Clark",
    "email": "william.clark@example.com",
    "password": "williamPass",
    "age": 31,
    "gender": "male"
  },
  {
    "name": "Ava Turner",
    "email": "ava.turner@example.com",
    "password": "pass1234",
    "age": 24,
    "gender": "female"
  }
]


app.use(bodyparser.json());
app.use(cors());
app.use(cookieParser());
app.use('/imageUpload', imageUploadRoutes);

function authenticateToken(req, res, next) {
  const token = req.headers.authorization.split(' ')[1];

  console.log("Token : ", token);


 if (!token){
     const error = new Error('Token not found');
     next(error);
 }

 try {
     const decoded = jwt.verify(token, process.env.JWT_TOKEN_KEY);
   const userid = decoded.id;

   console.log("Pure Decoded : ",decoded)
   const { _id } = userid;  //Demo
   console.log("Decoded userid : ", _id); //Demo

   req.id = userid;
     next();
 }
 catch (err) {
     next(err);
 }
}

app.get("/", (req, res) => {
  // console.log("Here is Headers : ",req.headers)
  res.status(200).json({
    message: "Hello Buddy All Good!..."
  });
});

app.post("/register", async (req, res) => {
  try {
    // const { name, email, password, age, gender } = req.body;
    for (i = 0; i < userData.length; i++) {

      const existingUser = await User.findOne({ email: userData[i].email });

      if (existingUser) {
        return res.status(409).send({
          message: "User Already There",
        });
      }

      const salt = await bcrypt.genSalt(10);

      const hashedPassword = await bcrypt.hash(userData[i].password, salt);

      console.log("salt : ", salt);
      console.log("hashedPassword : ", hashedPassword);

      const newUser = new User({
        name: userData[i].name,
        email: userData[i].email,
        password: hashedPassword,
        age: userData[i].age,
        gender: userData[i].gender,
      });

      await newUser.save();
    }
      res.status(201).json({
        message: "User Registered Successfully!...",
      });
    
  } catch (err) {
    res.status(400).send(`Error while registering: ${err.message}`); //err.message like err={timeout: "", message: "", etc.,}
  }
});

app.post("/Login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      const err = new Error("Invalid Credentials!...");
      return next(err);
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isPasswordCorrect) {
      const err = new Error("Invalid Credentials!...");
      return next(err);
    }

    const accessToken = jwt.sign({ id: existingUser }, process.env.JWT_TOKEN_KEY, {
      expiresIn: "1hr",
    });

    const refreshToken = jwt.sign({ id: existingUser }, process.env.JWT_REFRESH_SECRET_KEY);
    console.log(refreshToken)
    existingUser.refreshToken = refreshToken;
    
    await existingUser.save();

    res.cookie('refreshToken', refreshToken, { httpOnly: true, path: '/refreshToken' });

    res.status(200).json({
      accessToken,
      refreshToken,
      message: "User Log-in Successfully!...",
    });
  } catch (err) {
    next(err);
  }
});

app.get("/myprofile", authenticateToken, async (req, res) => {
  const { id } = req.body;
  const user = await User.findById(id);
  // user.password = undefined;
  res.status(200).json({
    user
  });
});

app.get("/refreshToken", async (req, res, next) => {
  const token = req.cookies.refreshToken;
  //res.send(token)
  if (!token) {
    const error = new Error('Token Not Found!..')
    next(error)
  }
  jwt.verify(token, process.env.JWT_REFRESH_SECRET_KEY, async (err, decoded) => {
    if (err) {
      const error = new Error('Invalid Token!...')
      next(error);
    }
    // TO find User
    const id = decoded.id
    const existingUser = await User.findById({ id });
    if (!existingUser || token !== existingUser.refreshToken) {
      const error = new Error('Invalid Token!...')
      next(error);
    }

    const accessToken = jwt.sign({ id: existingUser._id }, process.env.JWT_TOKEN_KEY, { expiresIn: 40 });
    const refreshToken = jwt.sign({ id: existingUser._id }, process.env.JWT_REFRESH_SECRET_KEY);

    existingUser.refreshToken = refreshToken;

    await existingUser.save();

    res.cookie('refresedToken', refreshToken, { httpOnly: true, path: '/refreshToken' });

    res.status(200).json({
      accessToken,
      refreshToken,
      message: "User Log-in Successfully!..."
    })
  })
});

app.post('/getByGender', async (req, res, next) => {
  try{const { gender } = req.body;

  const allUser = await User.find({ gender: gender });
    res.status(200).json({ allUser });
  }
  catch(err) {
    next(err);
  }
})

app.post('/getByAge', async (req, res, next) => {
  try{const { age } = req.body;

  const allUser = await User.find({ age: {$lte:age} });
    res.status(200).json({ allUser });
  }
  catch(err) {
    next(err);
  }
})

app.post('/sortUser', async (req, res) => {
  const { sortBy, order } = req.body;
  const sortItem = { [sortBy]: order };
  const sortedUser = await User.find().sort(sortItem);
  res.status(200).json({ sortedUser });
})



app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({ message: err.message });
});

app.listen(PORT, () => {
  console.log(`Server Running On Port : ${PORT}`);
});