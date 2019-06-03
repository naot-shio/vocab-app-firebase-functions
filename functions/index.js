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

const notFilledIn = (string) => {
  if (string.trim() === '') return true;
  return false;
}

const isValidEmailAddress = (email) => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) return true;
  return false;
}

const emailValidation = (user, errors) => {
  if (notFilledIn(user.email)) {
    errors.email = messageForNoInput
  } else if (!isValidEmailAddress(user.email)) {
    errors.email = "Invalid email address"
  };
}

const passwordValidation = (user, errors) => {
  if (notFilledIn(user.password)) errors.password = messageForNoInput;
  if (user.password.length < 6) errors.password = 'Password must be at least 6 characters'
}

const messageForNoInput = "Must be filled in";

// Sign Up route
app.post('/signup', (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    name: req.body.name
  };

  let errors = {};
  
  emailValidation(newUser, errors);
  passwordValidation(newUser, errors);

  if (newUser.password !== newUser.confirmPassword) errors.confirmPassword = "Password confirmation does not match with password";
  if (notFilledIn(newUser.name)) errors.name = messageForNoInput;

  if (Object.keys(errors).length > 0) return res.status(400).json({ errors })

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

app.post('/login', (req, res) => {
  const user = {
    email: req.body.email, 
    password: req.body.password 
  };

  let errors = {};
  
  emailValidation(user, errors);
  passwordValidation(user, errors);

  if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

  firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({ token });
    }) 
    .catch(err => {
      console.error(err);
      if (err.code === "auth/user-not-found") return res.status(403).json({ general: 'User not found'})
      return res.status(500).json({ error: err.code });
    })
})

exports.api = functions.region('asia-northeast1').https.onRequest(app);