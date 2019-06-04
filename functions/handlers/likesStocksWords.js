const { db } = require('../utils/admin')
const { findLikeDocument, findWordDocument, findStockDocument } = require('../utils/dbDocument')

exports.likeWord = (req, res) => {
  const likeDocument = findLikeDocument(req);
  const wordDocument = findWordDocument(req);
  let wordData = {};

  wordDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        wordData = doc.data();
        wordData.wordId = doc.id;
        return likeDocument.get();
      }
      return res.status(404).json({ error: 'Not Found' });
    })
    .then(data => {
      console.log(data)
      if (data.empty) return db
        .collection('likes')
        .add({
          wordId: req.params.wordId,
          userName: req.user.name
        })
        .then(() => {
          wordData.likeCount++;
          return wordDocument.update({ likeCount: wordData.likeCount });
        })
        .then(() => res.json(wordData))
        .catch(err => res.status(500).json({ error: err.code }));
      return res.status(400).json({ error: 'Already liked'});
    })
    .catch(err => res.status(500).json({ error: err.code }));
}

exports.unlikeWord = (req, res) => {
  const likeDocument = findLikeDocument(req);
  const wordDocument = findWordDocument(req);
  let wordData = {};

  wordDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        wordData = doc.data();
        wordData.wordId = doc.id;
        return likeDocument.get();
      }
      return res.status(404).json({ error: 'Not Found' });
    })
    .then(data => {
      if (!data.empty) return db
        .doc(`likes/${data.docs[0].id}`)
        .delete()
        .then(() => {
          wordData.likeCount--;
          return wordDocument.update({ likeCount: wordData.likeCount });
        })
        .then(() => res.json(wordData))
        .catch(err => res.status(500).json({ error: err.code }));

      return res.status(400).json({ error: 'Has not been liked'});
    })
    .catch(err => res.status(500).json({ error: err.code }));
}

exports.stockWord = (req, res) => {
  const stockDocument = findStockDocument(req);
  const wordDocument = findWordDocument(req);
  let wordData = {};

  wordDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        wordData = doc.data();
        wordData.wordId = doc.id;
        return stockDocument.get();
      }
      return res.status(404).json({ error: 'Not Found' });
    })
    .then(data => {
      console.log(data)
      if (data.empty) return db
        .collection('stocks')
        .add({
          wordId: req.params.wordId,
          userName: req.user.name
        })
        .then(() => {
          wordData.stockCount++;
          return wordDocument.update({ stockCount: wordData.stockCount });
        })
        .then(() => res.json(wordData))
        .catch(err => res.status(500).json({ error: err.code }));
      return res.status(400).json({ error: 'Already stocked'});
    })
    .catch(err => res.status(500).json({ error: err.code }));
}

exports.unstockWord = (req, res) => {
  const stockDocument = findStockDocument(req);
  const wordDocument = findWordDocument(req);
  let wordData = {};

  wordDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        wordData = doc.data();
        wordData.wordId = doc.id;
        return stockDocument.get();
      }
      return res.status(404).json({ error: 'Not Found' });
    })
    .then(data => {
      if (!data.empty) return db
        .doc(`stocks/${data.docs[0].id}`)
        .delete()
        .then(() => {
          wordData.stockCount--;
          return wordDocument.update({ stockCount: wordData.stockCount });
        })
        .then(() => res.json(wordData))
        .catch(err => res.status(500).json({ error: err.code }));

      return res.status(400).json({ error: 'Has not been stocked'});
    })
    .catch(err => res.status(500).json({ error: err.code }));
}