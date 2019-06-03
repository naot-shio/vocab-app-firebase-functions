const functions = require('firebase-functions');

const express = require('express');
const app = express();

const FBAuth = require('./utils/fbAuth')

// word routes
const { getAllWords, createWord } = require('./handlers/words')
const { signUp, login } = require('./handlers/users')

app.get('/words', getAllWords);
app.post('/word', FBAuth, createWord);

// user routes
app.post('/signup', signUp);
app.post('/login', login);

exports.api = functions.region('asia-northeast1').https.onRequest(app);