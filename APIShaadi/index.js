const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;

mongoose
  .connect("mongodb://localhost:27017/pms")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Define Profile schema
const profileSchema = new mongoose.Schema({
  name: String,
  age: Number,
  imageURL: String,
  gender: String,
  height: Number,
  religion: String,
  occupation: String,
  qualification: String,
  hobbies: String,
  maritalStatus: String,
  birthdate: Date,
  birthplace: String,
  time_of_birth: String,
  p_gender: String,
  p_age: Number,
  p_height: Number,
  p_religion: String,
  p_occupation: String,
  p_qualification: String,
  p_maritalStatus: String,
  p_place: String,
  username: String,
  password: String,
});

const likesSchema = new mongoose.Schema({
  likedProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "profiles",
    required: true,
  },
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "profiles",
    required: true,
  },
});

const ProfileModel = mongoose.model("profiles", profileSchema);

const LikesModel = mongoose.model("likes", likesSchema);
app.use(express.json());
app.use(cors());

// Create a new product
app.post("/profiles", async (req, res) => {
  try {
    req.body.password = await bcrypt.hashSync(req.body.password, 10);
    await ProfileModel.create(req.body);
    res.status(201).send({ message: "Profile Created" });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// login functionality
app.post("/login", async (req, res) => {
  try {
    const profile = await ProfileModel.findOne({
      username: req.body.username,
    });
    if (!profile) {
      return res.status(400).send({ message: "Invalid username or password" });
    }
    if (!bcrypt.compareSync(req.body.password, profile.password)) {
      return res.status(400).send({ message: "Invalid username or password" });
    }

    const token = await jwt.sign({ id: profile._id }, "secretkey");
    res.send({ message: "Login successful", token });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

// Get all profiles
app.get("/profiles", async (req, res) => {
  try {
    const profile = await ProfileModel.find();
    res.send(profile);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

// Get a single profile
app.get("/profiles/:id", getProfile, (req, res) => {
  res.json(req.profile);
});

// Update a profile
app.put("/profiles/:id", getProfile, async (req, res) => {
  try {
    const {
      name,
      age,
      imageUrl,
      height,
      gender,
      religion,
      occupation,
      qualification,
      hobbies,
      maritalStatus,
      birthdate,
      birthplace,
      time_of_birth,
      p_gender,
      p_age,
      p_height,
      p_occupation,
      p_qualification,
      p_maritalStatus,
      p_religion,
      p_place,
    } = req.body;

    if (!res.profile) {
      return res.status(404).send({ message: "Profile not found" });
    }

    res.profile.name = name || res.profile.name;
    res.profile.age = age || res.profile.age;
    res.profile.imageUrl = imageUrl || res.profile.imageUrl;
    res.profile.gender = gender || res.profile.gender;
    res.profile.height = height || res.profile.height;
    res.profile.religion = religion || res.profile.religion;
    res.profile.occupation = occupation || res.profile.occupation;
    res.profile.qualification = qualification || res.profile.qualification;
    res.profile.hobbies = hobbies || res.profile.hobbies;
    res.profile.maritalStatus = maritalStatus || res.profile.maritalStatus;
    res.profile.birthdate = birthdate || res.profile.birthdate;
    res.profile.birthplace = birthplace || res.profile.birthplace;
    res.profile.time_of_birth = time_of_birth || res.profile.time_of_birth;
    res.profile.p_gender = p_gender || res.profile.p_gender;
    res.profile.p_age = p_age || res.profile.p_age;
    res.profile.p_height = p_height || res.profile.p_height;
    res.profile.p_religion = p_religion || res.profile.p_religion;
    res.profile.p_occupation = p_occupation || res.profile.p_occupation;
    res.profile.p_qualification =
      p_qualification || res.profile.p_qualification;
    res.profile.p_maritalStatus =
      p_maritalStatus || res.profile.p_maritalStatus;
    res.profile.p_place = p_place || res.profile.p_place;

    await res.profile.save();
    res.send(res.profile);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// Delete a profile
app.delete("/profiles/:id", getProfile, async (req, res) => {
  try {
    await res.profile.deleteOne();
    res.send({ message: "Profile deleted" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

app.get("/matches", verifyToken, async (req, res) => {
  try {
    // Find the profile of the user making the request
    const profile = await ProfileModel.findById(req.userId);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Find matches based on various attributes
    let matches = await ProfileModel.find({
      p_gender: profile.gender,
      $or: [
        { p_gender: profile.p_gender },
        { p_age: profile.p_age },
        { p_height: profile.p_height },
        { p_religion: profile.p_religion },
        { p_occupation: profile.p_occupation },
        { p_qualification: profile.p_qualification },
        { p_maritalStatus: profile.p_maritalStatus },
        { p_place: profile.p_place },
      ],
    });

    // Filter out the user's own profile from the matches
    matches = matches.filter((matech) => matech._id.toString() !== req.userId);

    res.json(matches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/like/:id", verifyToken, async (req, res) => {
  try {
    await LikesModel.create({
      likedProfileId: req.params.id,
      profileId: req.userId,
    });
    res.send({ message: "Profile liked" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

app.get("/likes", verifyToken, async (req, res) => {
  try {
    const likes = await LikesModel.find({ profileId: req.userId })
      .populate("likedProfileId")
      .exec();

    const likedProfiles = likes.map((like) => like.likedProfileId);
    res.json(likedProfiles);
  } catch (error) {
    console.error("Error fetching likes:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/getUserDetails", verifyToken, async (req, res) => {
  try {
    const profile = await ProfileModel.findById(req.userId);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json(profile);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

async function getProfile(req, res, next) {
  let profile;
  try {
    profile = await ProfileModel.findById(req.params.id);
    if (profile == null) {
      return res.status(404).send({ message: "Profile not found" });
    }
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }

  res.profile = profile;
  next();
}

async function verifyToken(req, res, next) {
  const token = req.headers["authorization"].split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "Access denied" });
  }

  try {
    const decoded = await jwt.verify(token, "secretkey");
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(400).send({ message: "Invalid token" });
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
