const functions = require('firebase-functions');
const admin = require('firebase-admin')

admin.initializeApp();

const express = require('express');
const app = express();

const firebase = require('firebase')
const config = require('./utils/config')
firebase.initializeApp(config);

app.get('/words', (req, res) => {
  admin.firestore()
    .collection('words')
    .orderBy('createdAt', 'desc')
    .get()
    .then(data => {
      let words = [];
      data.forEach(doc => {
        words.push({
          wordId: doc.id,
          userName: doc.data().userName,
          english: doc.data().english,
          japanese: doc.data().japanese,
          sentence: doc.data().sentence,
          translation: doc.data().translation,
          createdAt: doc.data().createdAt
        })
      });
      return res.json(words);
    })
    .catch(err => console.error(err));
});

app.post('/word', (req, res) => {
  const newWord = {
    userName: req.body.userName,
    english: req.body.english,
    japanese: req.body.japanese,
    sentence: req.body.sentence,
    translation: req.body.translation,
    createdAt: new Date().toISOString()
  };
  
  admin.firestore()
    .collection('words')
    .add(newWord)
    .then(doc => {
      res.json({ message: `document ${doc.id} created successfully`});
    })
    .catch(err => {
      res.status(500).json({ error: 'Something went wrong'});
      console.err(err);
    });
});

// Sign Up route
app.post('/signup', (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    name: req.body.name
  };

  firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
    .then(data => {
      return res.status(201).json({ message: `User ${data.user.uid} signed up successfully`})
    })
    .catch(err => {
      console.err(err);
      return res.status(500).json({ error: err.code });
    })
})

exports.api = functions.region('asia-northeast1').https.onRequest(app);