const functions = require('firebase-functions');

const express = require('express');
const app = express();

const FBAuth = require('./utils/fbAuth');

const { db } = require('./utils/admin');

const { 
  getAllSentences,
  createSentence,
  getSentence,
  updateSentence,
  deleteSentence
} = require('./handlers/sentences');

const {
  likeSentence,
  unlikeSentence,
  stockSentence,
  unstockSentence
} = require('./handlers/likesStocksSentences')

const { 
  signUp,
  login,
  imageUploader,
  getOwnDetails
} = require('./handlers/users');

// sentence routes
app.get('/sentences', getAllSentences);
app.post('/sentence', FBAuth, createSentence);
app.get('/sentence/:sentenceId', getSentence);
app.put('/sentence/:sentenceId', FBAuth, updateSentence);
app.delete('/sentence/:sentenceId', FBAuth, deleteSentence)
app.get('/sentence/:sentenceId/like', FBAuth, likeSentence);
app.get('/sentence/:sentenceId/unlike', FBAuth, unlikeSentence);
app.get('/sentence/:sentenceId/stock', FBAuth, stockSentence);
app.get('/sentence/:sentenceId/unstock', FBAuth, unstockSentence);

// word routes
app.get('/words', )

// user routes
app.post('/signup', signUp);
app.post('/login', login);
app.post('/user/image', FBAuth, imageUploader);
app.get('/user', FBAuth, getOwnDetails);

exports.api = functions.region('asia-northeast1').https.onRequest(app);

exports.onDeletingSentence = functions
  .region('asia-northeast1')
  .firestore
  .document('/sentences/{sentenceId}')
  .onDelete((snapshot, context) => {
    const sentenceId = context.params.sentenceId;
    const batch = db.batch();
    return db
      .collection('likes')
      .where('sentenceId', '==', sentenceId)
      .get()
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db
          .collection('stocks')
          .where('sentenceId', '==', sentenceId)
          .get()
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/stocks/${doc.id}`));
        });
        return batch.commit();
      })
      .catch(err => {
        console.error(err);
      })
});