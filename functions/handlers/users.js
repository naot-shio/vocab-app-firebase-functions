const { admin, db } = require('../utils/admin');

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

exports.uploadImage = (req, res) => {
  const BusBoy = require('busboy');
  const path = require('path');
  const os = require('os');
  const fs = require('fs');

  const busboy = new BusBoy({ headers: req.headers });

  let imageFileName;
  let uploadedImage = {};

  busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
    const imageExtension = filename.split('.')[filename.split('.').length - 1];
    const randomNumberForImageName = Math.floor(Math.random() * 1000000000)
    imageFileName = `${randomNumberForImageName}.${imageExtension}`
    const filepath = path.join(os.tmpdir(), imageFileName);
    uploadedImage = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on('finish', () => {
    admin.storage().bucket().upload(uploadedImage.filepath, {
      resumable: false,
      metadata: {
        metadata: {
          contentType: uploadedImage.mimetype
        }
      }
    })
    .then(() => {
      const imageUrl = `https://firebasestorage.googleapis.com/v0/b${config.storageBucket}/o/${imageFileName}?alt=media`
      return db.doc(`/users/${req.user.name}`).update({ imageUrl })
    })
    .then(() => {
      return res.json({ message: 'Image uploaded'})
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    })
  })
}