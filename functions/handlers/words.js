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
    createdAt: new Date().toISOString(),
    likeCount: 0
  };
  
  db
    .collection('words')
    .add(newWord)
    .then(doc => {
      const word = newWord;
      word.wordId = doc.id;
      res.json(word);
    })
    .catch(err => {
      res.status(500).json({ error: 'Something went wrong'});
    });
}

exports.likeWord = (req, res) => {
  const likeDocument = db
    .collection('likes')
    .where('userName', '==', req.user.name)
    .where('wordId', '==', req.params.wordId)
    .limit(1);

    const wordDocument = db.doc(`/words/${req.params.wordId}`)

    let wordData = {};

    wordDocument
      .get()
      .then(doc => {
        if (doc.exists) {
          wordData = doc.data();
          wordData.wordId = doc.id;
          return likeDocument.get()
        }
        return res.status(404).json({ error: 'Not Found' })
      })
      .then(data => {
        if (data.empty) return db
          .collection('likes')
          .add({
            wordId: req.params.wordId,
            userName: req.user.name
          })
          .then(() => {
            wordData.likeCount++;
            return wordDocument.update({ likeCount: wordData.likeCount })
          })
          .then(() => res.json(wordData))
          .catch(err => res.status(500).json({ error: err.code }));
        return res.status(400).json({ error: 'Already liked'});
      })
      .catch(err => res.status(500).json({ error: err.code }));
}