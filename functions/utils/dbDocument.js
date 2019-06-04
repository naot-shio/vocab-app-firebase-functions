const { db } = require('./admin'); 

exports.findLikeDocument = (req) => {
  return db
    .collection('likes')
    .where('userName', '==', req.user.name)
    .where('wordId', '==', req.params.wordId)
    .limit(1);
}

exports.findStockDocument = (req) => {
  return db
    .collection('stocks')
    .where('userName', '==', req.user.name)
    .where('wordId', '==', req.params.wordId)
    .limit(1);
}

exports.findWordDocument = (req) => db.doc(`/words/${req.params.wordId}`);
