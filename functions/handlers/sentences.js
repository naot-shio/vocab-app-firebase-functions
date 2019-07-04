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

exports.getSentence = (req, res) => {
  db.doc(`/sentences/${req.params.sentenceId}`)
    .get()
    .then(doc => {
      if (!doc.exists)
        return res.status(404).json({ error: "Sentence not found" });

      sentenceData = doc.data();
      sentenceData.sentenceId = doc.id;

      return res.json(sentenceData);
    })
    .catch(err => console.error(err));
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
      .catch(err => res.status(500).json({ error: err.code }));
  } else {
     res
      .status(400)
      .json({ error: "You must be an owner to add vocabulary" }); 
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

      let numberOfQuestions = parseInt(
        res.socket._httpMessage.req.query.numberOfQuestions
      );

      // If the number of questions is negative, it throws an error
      // And also if a user inputs like an astronomical value that is greater than the size of sentences in db, the loop might not end and cause a problem.
      // And I don't think it would happen, but in case the number of questions would be a string, it crashes the app.

      if (numberOfQuestions < 0 ||  isNaN(numberOfQuestions)) numberOfQuestions = 10;

      if (numberOfQuestions > sentences.length) numberOfQuestions = sentences.length;

      let randomSentences = [];
      let randomNumbers = [];
      let index = 0;

      while (randomSentences.length < numberOfQuestions) {
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

exports.getLikedSentences = (req, res) => {
  let sentences = [];
  db.doc(`/users/${req.user.name}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return db
          .collection("likes")
          .where("userName", "==", req.user.name)
          .get();
      }
    })
    .then(data => {
      data.forEach(doc => {
        sentences.push(doc.data());
      });
      return res.json(sentences);
    })
    .catch(err => {
      return res.status(500).json({ error: err.code });
    });
};
