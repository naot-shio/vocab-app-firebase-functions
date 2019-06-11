const { db } = require('../utils/admin')
const { findSentenceDocument } = require('../utils/dbDocument')

exports.getAllSentences = (req, res) => {
  db
    .collection('sentences')
    .orderBy('createdAt', 'desc')
    .get()
    .then(data => {
      let sentences = [];
      data.forEach(doc => {
        sentences.push({
          sentenceId: doc.id,
          userName: doc.data().userName,
          sentence: doc.data().sentence,
          translation: doc.data().translation,
          words: doc.data().words,
          createdAt: doc.data().createdAt,
          likeCount: doc.data().likeCount,
          stockCount: doc.data().stockCount
        })
      });
      return res.json(sentences);
    })
    .catch(err => res.status(500).json(err));
}

exports.createSentence = (req, res) => {
  const newSentence = {
    userName: req.user.name,
    sentence: req.body.sentence,
    translation: req.body.translation,
    words: req.body.words,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    stockCount: 0
  };
  
  db
    .collection('sentences')
    .add(newSentence)
    .then(doc => {
      const sentence = newSentence;
      sentence.sentenceId = doc.id;
      res.json(sentence);
    })
    .catch(err => res.status(500).json({ error: err.code }));
}

exports.updateSentence = (req, res) => {
  const sentenceDocument = findSentenceDocument(req);

  sentenceDocument
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ message: 'Not found' });
      } else if (doc.data().userName !== req.user.name) {
        return res.status(403).json({ error: "This sentence does not belong to you"});
      }
      let updateSentence = {
        english: req.body.english,
        japanese: req.body.japanese,
        sentence: req.body.sentence,
        translation: req.body.translation,
        updatedAt: new Date().toISOString()
      };
      return sentenceDocument.update(updateSentence);
    })
    .then(() => {
      return res.json({ message: 'sentence successfully updated' });
    })
    .catch(err => res.status(500).json({ error: err.code }));
}

exports.deleteSentence = (req, res) => {
  const sentenceDocument = findSentenceDocument(req);

  sentenceDocument
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ message: 'Not found' });
      } else if (doc.data().userName !== req.user.name) {
        return res.status(403).json({ error: "This sentence does not belong to you"});
      }
      return sentenceDocument.delete()
    })
    .then(() => {
      res.json({ message: 'Successfully deleted'})
    })
    .catch(err => res.status(500).json({ error: err.code }));
}