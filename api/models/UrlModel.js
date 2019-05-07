'use strict'

var mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
    url: String,
    urlId: Number
});

module.exports = mongoose.model('urls', urlSchema);