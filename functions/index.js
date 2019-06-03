const functions = require('firebase-functions');
const admin = require('firebase-admin')

admin.initializeApp();

const express = require('express');
const app = express();

app.get('/words', (req, res) => {
  admin.firestore()
    .collection('words')
    .get()
    .then(data => {
      let words = [];
      data.forEach(doc => {
        words.push(doc.data());
      });
      return res.json(words);
    })
    .catch(err => console.error(err));
});

exports.api = functions.https.onRequest(app);