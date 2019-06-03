const functions = require('firebase-functions');
const admin = require('firebase-admin')

admin.initializeApp();

const express = require('express');
const app = express();

const firebase = require('firebase')
const config = require('./utils/config')
firebase.initializeApp(config);

const db = admin.firestore();

app.get('/words', (req, res) => {
  db()
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
  
  db()
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

  let token, userId;
  db
    .doc(`/users/${newUser.name}`)
    .get()
    .then(doc => {
      if (doc.exists) return res.status(400).json({ name: 'User name is already taken'})
      return firebase
        .auth()
        .createUserWithEmailAndPassword(newUser.email, newUser.password)
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(idToken => {
      token = idToken;
      const userCredentials = {
        name: newUser.name,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId
      };
      return db.doc(`/users/${newUser.name}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch(err => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") return res.status(400).json({ email: 'Email is already taken'})
      return res.status(500).json({ error: err.code })
    })
})

exports.api = functions.region('asia-northeast1').https.onRequest(app);