const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

// — users collection
const userSchema = new mongoose.Schema(
  {
    username: {
      type:      String,
      required:  [true, "Username is required"],
      unique:    true,
      lowercase: true,
      trim:      true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type:      String,
      required:  [true, "Email is required"],
      unique:    true,
      lowercase: true,
      trim:      true,
    },
   
    password_hash: {
      type:     String,
      required: true,
      select:   false,   // excluded from all queries by default
    },
    role: {
      type:    String,
      enum:    ["user", "moderator"],
      default: "user",
    },
    is_active:  { type: Boolean, default: true  },
    created_at: { type: Date,    default: Date.now },
  },
  { timestamps: false }
);


// userSchema.index({ email:    1 }, { unique: true });
// userSchema.index({ username: 1 }, { unique: true });

// Auto-hash password before every save
userSchema.pre("save", async function (next) {
 
  this.password_hash = await bcrypt.hash(this.password_hash, 12);
  
});

// Instance method to verify password at login
userSchema.methods.comparePassword = async function (plaintext) {
  return bcrypt.compare(plaintext, this.password_hash);
};

module.exports = mongoose.model("User", userSchema);
