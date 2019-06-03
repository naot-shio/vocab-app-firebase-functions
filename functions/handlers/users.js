const { db } = require('../utils/admin');

const firebase = require('firebase');
const config = require('../utils/config');
firebase.initializeApp(config);

const { signUpValidator, loginValidator } = require('../utils/validations')

exports.signUp = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    name: req.body.name
  };

  const {valid, errors} = signUpValidator(newUser);
  if (!valid) return res.status(400).json(errors);

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
      if (err.code === 'auth/email-already-in-use') return res.status(400).json({ email: 'Email is already taken'})
      return res.status(500).json({ error: err.code })
    })
}

exports.login = (req, res) => {
  const user = {
    email: req.body.email, 
    password: req.body.password 
  };

  const {valid, errors} = loginValidator(user);
  if (!valid) return res.status(400).json(errors);

  firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({ token });
    }) 
    .catch(err => {
      console.error(err);
      if (err.code === 'auth/user-not-found') return res.status(403).json({ general: 'User not found'})
      return res.status(500).json({ error: err.code });
    })
}

