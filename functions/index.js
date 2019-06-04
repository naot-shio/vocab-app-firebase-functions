const functions = require('firebase-functions');

const express = require('express');
const app = express();

const FBAuth = require('./utils/fbAuth');

const { db } = require('./utils/admin');

const { 
  getAllWords,
  createWord,
  updateWord,
  deleteWord
} = require('./handlers/words');

const {
  likeWord,
  unlikeWord,
  stockWord,
  unstockWord
} = require('./handlers/likesStocksWords')

const { 
  signUp,
  login,
  imageUploader,
  getOwnDetails
} = require('./handlers/users');

// word routes
app.get('/words', getAllWords);
app.post('/word', FBAuth, createWord);
app.put('/word/:wordId', FBAuth, updateWord)
app.delete('/word/:wordId', FBAuth, deleteWord)
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

exports.onDeletingWord = functions
  .region('asia-northeast1')
  .firestore
  .document('/words/{wordId}')
  .onDelete((snapshot, context) => {
    const wordId = context.params.wordId;
    const batch = db.batch();
    return db
      .collection('likes')
      .where('wordId', '==', wordId)
      .get()
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db
          .collection('stocks')
          .where('wordId', '==', wordId)
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