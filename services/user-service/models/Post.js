/*-----------------------------------------------------------------
* File: Post.js
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is part of the user backend service.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['regular', 'article', 'question', 'announcement'],
    default: 'regular'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'friends'],
    default: 'public'
  },
  location: String,
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  sharesCount: {
    type: Number,
    default: 0
  },
  reportsCount: {
    type: Number,
    default: 0
  },
  media: [{
    mediaUrl: {
      type: String,
      required: true
    },
    mediaType: {
      type: String,
      enum: ['image', 'video', 'document', 'audio']
    },
    thumbnailUrl: String,
    size: Number,
    width: Number,
    height: Number,
    duration: Number
  }],
  tags: [{
    type: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

module.exports = mongoose.model('Post', postSchema); 
