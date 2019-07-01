const { admin, db } = require("../utils/admin");

const firebase = require("firebase");
const config = require("../utils/config");
firebase.initializeApp(config);

const { signUpValidator, loginValidator } = require("../utils/validations");

const imageUrl = imageFile =>
  `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFile}?alt=media`;

exports.signUp = (req, res) => {
  const newUser = {
    email: req.body.email.toLowerCase(),
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    name: req.body.name
  };

  const { valid, errors } = signUpValidator(newUser);
  if (!valid) return res.status(400).json(errors);

  const initialProfile = "blank-profile-picture.png";

  let token, userId;
  db.doc(`/users/${newUser.name}`)
    .get()
    .then(doc => {
      if (doc.exists)
        return res.status(400).json({ name: "User name is already taken" });
      return firebase
        .auth()
        .createUserWithEmailAndPassword(newUser.email, newUser.password);
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
        imageUrl: imageUrl(initialProfile),
        owner: false,
        userId
      };
      return db.doc(`/users/${newUser.name}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch(err => {
      if (err.code === "auth/email-already-in-use")
        return res.status(400).json({ email: "Email is already taken" });
      return res.status(500).json({ error: err.code });
    });
};

exports.login = (req, res) => {
  const user = {
    email: req.body.email.toLowerCase(),
    password: req.body.password
  };

  const { valid, errors } = loginValidator(user);
  if (!valid) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({ token });
    })
    .catch(err => {
      if (err.code === "auth/user-not-found")
        return res.status(403).json({ general: "User not found" });
      return res.status(500).json({ error: err.code });
    });
};

exports.getOwnDetails = (req, res) => {
  let userData = {};
  db.doc(`/users/${req.user.name}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        userData.credentials = doc.data();
        return db
          .collection("likes")
          .where("userName", "==", req.user.name)
          .get();
      }
    })
    .then(data => {
      userData.likes = [];
      data.forEach(doc => {
        userData.likes.push(doc.data());
      });
      return res.json(userData);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.imageUploader = (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers });

  let imageFileName;
  let uploadedImage = {};

  busboy.on("file", function(fieldname, file, filename, encoding, mimetype) {
    if (mimetype !== "image/jpeg" && mimetype !== "image/png")
      return res.status(400).json({ error: "Wrong type of file" });

    const splitFile = filename.split(".");
    const imageExtension = splitFile[splitFile.length - 1];

    const randomNumberForImageName = Math.floor(Math.random() * 1000000000);

    imageFileName = `${randomNumberForImageName}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    uploadedImage = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });

  busboy.on("finish", () => {
    admin
      .storage()
      .bucket()
      .upload(uploadedImage.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: uploadedImage.mimetype
          }
        }
      })
      .then(() => {
        return db
          .doc(`/users/${req.user.name}`)
          .update({ imageUrl: imageUrl(imageFileName) });
      })
      .then(() => {
        return res.json({ message: "Image uploaded" });
      })
      .catch(err => {
        return res.status(500).json({ error: err.code });
      });
  });

  busboy.end(req.rawBody);
};
