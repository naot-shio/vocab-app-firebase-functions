const { db } = require("../utils/admin");
const {
  findLikeDocument,
  findSentenceDocument
} = require("../utils/dbDocument");

exports.likeSentence = (req, res) => {
  const likeDocument = findLikeDocument(req);
  const sentenceDocument = findSentenceDocument(req);
  let sentenceData;

  sentenceDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        sentenceData = doc.data();
        sentenceData.sentenceId = doc.id;
        return likeDocument.get();
      }
      return res.status(404).json({ error: "Not Found" });
    })
    .then(data => {
      if (data.empty)
        return db
          .collection("likes")
          .add({
            sentence: sentenceData.sentence,
            translation: sentenceData.translation,
            words: sentenceData.words,
            sentenceId: req.params.sentenceId,
            userName: req.user.name
          })
          .then(() => {
            sentenceData.likeCount++;
            return sentenceDocument.update({
              likeCount: sentenceData.likeCount
            });
          })
          .then(() => res.json(sentenceData))
          .catch(err => res.status(500).json({ error: err.code }));
      return res.status(400).json({ error: "Already liked" });
    })
    .catch(err => res.status(500).json({ error: err.code }));
};

exports.unlikeSentence = (req, res) => {
  const likeDocument = findLikeDocument(req);
  const sentenceDocument = findSentenceDocument(req);
  let sentenceData;

  sentenceDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        sentenceData = doc.data();
        sentenceData.sentenceId = doc.id;
        return likeDocument.get();
      }
      return res.status(404).json({ error: "Not Found" });
    })
    .then(data => {
      if (!data.empty)
        return db
          .doc(`likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            sentenceData.likeCount--;
            return sentenceDocument.update({
              likeCount: sentenceData.likeCount
            });
          })
          .then(() => res.json(sentenceData))
          .catch(err => res.status(500).json({ error: err.code }));

      return res.status(400).json({ error: "Has not been liked" });
    })
    .catch(err => res.status(500).json({ error: err.code }));
};
