const bcrypt = require("bcrypt");
const User = require("../models/Users");
const auth = require("../Auth");

//This module is to create a user
// Only Admin can create User
module.exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, role, username, password } = req.body;

    // Validation: fail fast (return early)
    if (!username || !username.includes(".")) {
      return res.status(400).send({ error: "Username invalid" });
    }
    if (!password || password.length < 8) {
      return res
        .status(400)
        .send({ error: "Password must be at least 8 characters" });
    }

    // Pre-check for duplicates before hashing (save CPU cycles)
    const existingUser = await User.exists({ username });
    if (existingUser) {
      return res.status(409).send({ error: "Username already exists" });
    }

    // Hash password asynchronously (non-blocking)
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      role,
      username,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    // Exclude password from response for security
    const { password: _, ...userWithoutPassword } = savedUser.toObject();

    return res.status(201).send({
      message: "Created successfully",
      user: userWithoutPassword,
    });
  } catch (err) {
    console.error("Error in Save:", err);
    return res.status(500).send({ error: "Error in Save" });
  }
};

// This module is to login a user
// Deactivated user cant Login

module.exports.loginUser = (req, res) => {
  if (!req.body.username.includes(".")) {
    return res.status(400).send({ error: "Invalid username format" });
  }

  return User.findOne({ username: req.body.username })
    .then((result) => {
      if (result == null) {
        return res.status(404).send({ error: "No Username Found" });
      }

      //SAFETY FEATURE: Block deactivated users
      if (result.isActive === false) {
        return res.status(403).send({ error: "Account is deactivated" });
      }

      const isPasswordCorrect = bcrypt.compareSync(
        req.body.password,
        result.password
      );

      if (isPasswordCorrect) {
        return res.status(200).send({ access: auth.createAccessToken(result) });
      } else {
        return res
          .status(401)
          .send({ error: "Username and password do not match" });
      }
    })
    .catch((err) => {
      return res.status(500).send({ error: "Error in find", details: err });
    });
};

//Get User Profile
module.exports.getProfile = (req, res) => {
  return User.findById(req.user.id)
    .lean()
    .then((user) => {
      if (user) {
        delete user.password;
        return res.status(200).send({ user });
      } else {
        return res.status(404).send({ error: "User not found" });
      }
    })
    .catch((err) => {
      //console.error("Failed to fetch user profile:", err)
      return res.status(500).send({ error: "Failed to fetch user profile" });
    });
};

// Get all profile

module.exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -__v");

    if (!users || users.length === 0) {
      return res.status(404).send({ message: "No users found" });
    }

    res.status(200).send({
      message: "All user profiles retrieved successfully",
      count: users.length,
      users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal server error" });
  }
};

// Get user detail by ID

module.exports.getUserProfileById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).send({ error: "User ID is required" });
    }

    const user = await User.findById(userId).select("-password -__v");

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    res.status(200).send({
      message: "User profile retrieved successfully",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal server error" });
  }
};

//Update User Profile
module.exports.updateUserById = async (req, res) => {
  try {
    const { userId } = req.params; // get ID from URL param
    const { firstName, lastName, role, username, isActive } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        role,
        username,
        isActive,
      },
      { new: true }
    ).select("-isAdmin -password -__v");

    if (!updatedUser) {
      return res.status(404).send({ message: "User not found" });
    }

    res.status(200).send({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to update user" });
  }
};

// //Reset Password
// Admin-only: Reset a user's password
// Admin-only: Reset a user's password
module.exports.resetPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    // ✅ Validation
    if (!userId || !newPassword) {
      return res
        .status(400)
        .json({ error: "User ID and new password are required" });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    // ✅ Hash password asynchronously (non-blocking)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // ✅ Update password
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
