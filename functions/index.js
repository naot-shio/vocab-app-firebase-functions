const functions = require('firebase-functions');

const express = require('express');
const app = express();

const FBAuth = require('./utils/fbAuth');

const { getAllWords, createWord, likeWord, unlikeWord, stockWord, unstockWord } = require('./handlers/words');
const { signUp, login, imageUploader, getOwnDetails } = require('./handlers/users');

// word routes
app.get('/words', getAllWords);
app.post('/word', FBAuth, createWord);
app.get('/word/:wordId/like', FBAuth, likeWord);
app.get('/word/:wordId/unlike', FBAuth, unlikeWord);
app.get('/word/:wordId/stock', FBAuth, stockWord);
app.get('/word/:wordId/unstock', FBAuth, unstockWord);

// user routes
app.post('/signup', signUp);
app.post('/login', login);
app.post('/user/image', FBAuth, imageUploader);
app.get('/user', FBAuth, getOwnDetails);

exports.api = functions.region('asia-northeast1').https.onRequest(app);