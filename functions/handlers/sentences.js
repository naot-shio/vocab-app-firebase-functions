const { db } = require("../utils/admin");
const { findSentenceDocument } = require("../utils/dbDocument");

exports.getAllSentences = (req, res) => {
  db.collection("sentences")
    .orderBy("createdAt", "asc")
    .get()
    .then(data => {
      let sentences = [];
      data.forEach(doc => {
        let searchedKeyword = res.socket._httpMessage.req.query.keyword.toLowerCase();
        if (
          doc
            .data()
            .sentence.toLowerCase()
            .includes(searchedKeyword)
        ) {
          let sentence = {
            sentenceId: doc.id,
            userName: doc.data().userName,
            sentence: doc.data().sentence,
            translation: doc.data().translation,
            words: doc.data().words,
            createdAt: doc.data().createdAt,
            likeCount: doc.data().likeCount
          };
          sentences.push(sentence);
        }
      });
      return res.json(sentences);
    })
    .catch(err => res.status(500).json(err));
};

exports.createSentence = (req, res) => {
  if (req.user.owner) {
    const newSentence = {
      userName: req.user.name,
      sentence: req.body.sentence,
      translation: req.body.translation,
      words: req.body.words,
      createdAt: new Date().toISOString(),
      likeCount: 0
    };
    db.collection("sentences")
      .add(newSentence)
      .then(doc => {
        const sentence = newSentence;
        sentence.sentenceId = doc.id;
        res.json(sentence);
      })
      .catch(err => {
        res.status(500).json({ error: err.code }), console.log(err);
      });
  } else {
    console.log("You gotta be an owner to create a sentence");
  }
};

exports.updateSentence = (req, res) => {
  const sentenceDocument = findSentenceDocument(req);

  sentenceDocument
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ message: "Not found" });
      } else if (doc.data().userName !== req.user.name) {
        return res
          .status(403)
          .json({ error: "This sentence does not belong to you" });
      }
      let updateSentence = {
        words: req.body.words,
        sentence: req.body.sentence,
        translation: req.body.translation,
        updatedAt: new Date().toISOString()
      };
      return sentenceDocument.update(updateSentence);
    })
    .then(() => {
      return res.json({ message: "sentence successfully updated" });
    })
    .catch(err => res.json({ error: err.code }));
};

exports.deleteSentence = (req, res) => {
  const sentenceDocument = findSentenceDocument(req);

  sentenceDocument
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ message: "Not found" });
      } else if (doc.data().userName !== req.user.name) {
        return res
          .status(403)
          .json({ error: "This sentence does not belong to you" });
      }
      return sentenceDocument.delete();
    })
    .then(() => {
      res.json({ message: "Successfully deleted" });
    })
    .catch(err => res.status(500).json({ error: err.code }));
};

exports.getRandomSentences = (req, res) => {
  db.collection("sentences")
    .orderBy("createdAt", "asc")
    .get()
    .then(data => {
      let sentences = [];
      data.forEach(doc => {
        if (doc.data().sentence) {
          let sentence = {
            sentenceId: doc.id,
            userName: doc.data().userName,
            sentence: doc.data().sentence,
            translation: doc.data().translation,
            words: doc.data().words,
            createdAt: doc.data().createdAt,
            likeCount: doc.data().likeCount
          };
          sentences.push(sentence);
        }
      });

      let randomSentences = [];
      let randomNumbers = [];
      let index = 0;

      while (randomSentences.length < 5) {
        let randomIndex = Math.floor(Math.random() * sentences.length);
        randomNumbers.push(randomIndex);
        if (randomNumbers.indexOf(randomIndex) === index) {
          randomSentences.push(sentences[randomIndex]);
          index++;
        } else {
          randomNumbers.pop();
        }
      }

      return res.json(randomSentences);
    })
    .catch(err => res.status(500).json(err));
};
