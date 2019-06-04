const { db } = require('../utils/admin')
const { findWordDocument } = require('../utils/dbDocument')

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
          createdAt: doc.data().createdAt,
          likeCount: doc.data().likeCount,
          stockCount: doc.data().stockCount
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

exports.updateWord = (req, res) => {
  const wordDocument = findWordDocument(req);

  wordDocument
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ message: 'Not found' });
      } else if (doc.data().userName !== req.user.name) {
        return res.status(403).json({ error: "This word does not belong to you"});
      }
      let updateWord = {
        english: req.body.english,
        japanese: req.body.japanese,
        sentence: req.body.sentence,
        translation: req.body.translation,
        updatedAt: new Date().toISOString()
      };
      wordDocument
        .update(updateWord)
        .then(() => {
          return res.json({ message: 'Word successfully updated' });
        })
        .catch(err => res.status(500).json({ error: err.code }));
    })
    .catch(err => res.status(500).json({ error: err.code }));
}