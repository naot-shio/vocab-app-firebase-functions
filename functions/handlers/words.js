const { db } = require('../utils/admin')

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
    .catch(err => {
      return res.status(500).json(err);
    });
}

exports.createWord = (req, res) => {
  const newWord = {
    userName: req.user.name,
    english: req.body.english,
    japanese: req.body.japanese,
    sentence: req.body.sentence,
    translation: req.body.translation,
    createdAt: new Date().toISOString()
  };
  
  db
    .collection('words')
    .add(newWord)
    .then(doc => {
      res.json({ message: `document ${doc.id} created successfully`});
    })
    .catch(err => {
      res.status(500).json({ error: 'Something went wrong'});
    });
}