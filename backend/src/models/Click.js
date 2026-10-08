import mongoose from 'mongoose';

const clickSchema = new mongoose.Schema(
  {
    shortCode: {
      type: String,
      required: true,
      index: true,
    },
    urlId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Url',
      required: true,
    },
    device: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown',
    },
    browser: {
      type: String,
      default: 'unknown',
    },
    os: {
      type: String,
      default: 'unknown',
    },
    referer: {
      type: String,
      default: 'direct',
    },
  },
  {
    timestamps: true, // createdAt = click timestamp
  }
);

const Click = mongoose.model('Click', clickSchema);

export default Click;