const { db } = require('./admin'); 

exports.findLikeDocument = (req) => {
  return db
    .collection('likes')
    .where('userName', '==', req.user.name)
    .where('sentenceId', '==', req.params.sentenceId)
    .limit(1);
}

exports.findStockDocument = (req) => {
  return db
    .collection('stocks')
    .where('userName', '==', req.user.name)
    .where('sentenceId', '==', req.params.sentenceId)
    .limit(1);
}

exports.findSentenceDocument = (req) => db.doc(`/sentences/${req.params.sentenceId}`);
