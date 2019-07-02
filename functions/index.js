const functions = require("firebase-functions");
const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());
const FBAuth = require("./utils/fbAuth");
const { db } = require("./utils/admin");

const {
  getAllSentences,
  createSentence,
  updateSentence,
  deleteSentence,
  getRandomSentences
} = require("./handlers/sentences");

const {
  likeSentence,
  unlikeSentence
} = require("./handlers/likeUnlikeSentences");

const {
  signUp,
  login,
  imageUploader,
  getOwnDetails
} = require("./handlers/users");

// sentence routes
app.get("/sentences", getAllSentences);
app.get("/quiz", getRandomSentences);
app.post("/sentence", FBAuth, createSentence);
app.put("/sentence/:sentenceId", FBAuth, updateSentence);
app.delete("/sentence/:sentenceId", FBAuth, deleteSentence);
app.get("/sentence/:sentenceId/like", FBAuth, likeSentence);
app.get("/sentence/:sentenceId/unlike", FBAuth, unlikeSentence);

// user routes
app.post("/signup", signUp);
app.post("/login", login);
app.post("/user/image", FBAuth, imageUploader);
app.get("/user", FBAuth, getOwnDetails);

exports.api = functions.region("asia-northeast1").https.onRequest(app);

exports.onDeletingSentence = functions
  .region("asia-northeast1")
  .firestore.document("/sentences/{sentenceId}")
  .onDelete((snapshot, context) => {
    const sentenceId = context.params.sentenceId;
    const batch = db.batch();
    return db
      .collection("likes")
      .where("sentenceId", "==", sentenceId)
      .get()
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return batch.commit();
      })
      .catch(err => {
        console.error(err);
      });
  });
