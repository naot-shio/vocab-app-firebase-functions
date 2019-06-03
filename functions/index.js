const functions = require('firebase-functions');
const admin = require('firebase-admin')

admin.initializeApp();

exports.getWords = functions.https.onRequest((req, res) => {
  admin.firestore().collection('words').get()
    .then(data => {
      let words = [];
      data.forEach(doc => {
        words.push(doc.data());
      });
      return res.json(words);
    })
    .catch(err => console.error(err));
})