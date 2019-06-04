const { db } = require('../utils/admin')
const { findLikeDocument, findWordDocument, findStockDocument } = require('../utils/dbDocument')

exports.getAllWords = (req, res) => {
  db
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
    .catch(err => res.status(500).json(err));
}

exports.createWord = (req, res) => {
  const newWord = {
    userName: req.user.name,
    english: req.body.english,
    japanese: req.body.japanese,
    sentence: req.body.sentence,
    translation: req.body.translation,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    stockCount: 0
  };
  
  db
    .collection('words')
    .add(newWord)
    .then(doc => {
      const word = newWord;
      word.wordId = doc.id;
      res.json(word);
    })
    .catch(err => res.status(500).json({ error: err.code }));
}

