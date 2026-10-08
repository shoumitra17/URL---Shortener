import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema(
  {
    shortCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    originalUrl: {
      type: String,
      required: true,
      trim: true,
    },
    customAlias: {
      type: String,
      unique: true,
      sparse: true, // allows multiple documents to have null value
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null means anonymous user (Phase 3 adds auth)
    },
    expiresAt: {
      type: Date,
      default: null, // null means never expires
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // auto adds createdAt and updatedAt fields
  }
);

// Index for fast lookup by shortCode (this is the hot path)


// Index for looking up all URLs by a user
urlSchema.index({ userId: 1 });

const Url = mongoose.model('Url', urlSchema);

export default Url;