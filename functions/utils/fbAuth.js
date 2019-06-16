const { admin, db } = require('./admin')

module.exports = (req, res, next) => {
  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    idToken = req.headers.authorization.split('Bearer ')[1];
  } else {
    return res.status(403).json({ errors: 'Unauthorized' });
  }
  
  admin
    .auth()
    .verifyIdToken(idToken)
    .then(decodedToken => {
      req.user = decodedToken;
      return db
        .collection('users')
        .where('userId', '==', req.user.uid)
        .limit(1)
        .get();
    })
    .then(data => {
      req.user.name = data.docs[0].data().name;
      req.user.owner = data.docs[0].data().owner;
      return next();
    })
    .catch(err => {
      console.error(err);
      return res.status(403).json(err);
    });
}