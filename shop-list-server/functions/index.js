'use strict';
// var express = require('express'),
// 	bodyParser = require('body-parser');
var OAuth2Server = require('oauth2-server'),
	Request = OAuth2Server.Request,
	Response = OAuth2Server.Response;

var constants = require('./constants.js');

var functions = require('firebase-functions');
var admin = require('firebase-admin');
var cors = require('cors')({ origin: true });

// Firestore database
admin.initializeApp(functions.config().firebase);
var db = admin.firestore();

// OAuth 2 server
var oauthModel = require('./model.js');
var oauth = new OAuth2Server({
	model: oauthModel,
	accessTokenLifetime: 60 * 60,
	allowBearerTokensInQueryString: true
});

// exports.createExampleData = functions.https.onRequest((request, response) => {
//   oauthModel.createExampleData(); // Create sample data
//   response.send("Created sample database!");
// });

const getItemsFromDatabase = (res) => {
  let items = []

  var itemsRef = db.collection(constants.DB_ITEMS);
  return itemsRef.get().then(snapshot => {
    snapshot.forEach(doc => {
      console.log(doc.id, '=>', doc.data());
      items.push({id: doc.id, item: doc.data().item})
    });
    return res.status(constants.SUCCESS_CODE).json(items);
  })
  .catch(err => {
    console.log('Error getting documents', err);
    return res.status(err.code).json({
      message: `Something went wrong. ${err.message}`
    })
  });
};

exports.addItem = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if(req.method !== constants.METHOD_POST) {
      return res.status(constants.ERROR_CODE_METHOD_NOT_ALLOWED).json({
        message: constants.ERROR_TEXT_METHOD_NOT_ALLOWED
      })
    }
		return authenticateRequest(req, res, () => {
			const item = req.body.item;
	    return db.collection(constants.DB_ITEMS).add({item}).then(ref => {
	      return getItemsFromDatabase(res)
	    }).catch(err => {
	      console.log('Error getting document', err);
	      return res.status(err.code).json({
	        message: `Something went wrong. ${err.message}`
	      })
	    })
		})
  })
});

exports.getItems = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if(req.method !== constants.METHOD_GET) {
      return res.status(constants.ERROR_CODE_METHOD_NOT_ALLOWED).json({
        message: constants.ERROR_TEXT_METHOD_NOT_ALLOWED
      })
    }
		return authenticateRequest(req, res, () => {
			return getItemsFromDatabase(res)
		})
  })
});

exports.deleteItem = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if(req.method !== constants.METHOD_DELETE) {
      return res.status(constants.ERROR_CODE_METHOD_NOT_ALLOWED).json({
        message: constants.ERROR_TEXT_METHOD_NOT_ALLOWED
      })
    }
    const id = req.query.id
    if (!id) {
      return res.status(constants.ERROR_CODE_INTERNAL).json({statusCode:constants.ERROR_CODE_INTERNAL, message: `Invalid parameter`});
    }
		return authenticateRequest(req, res, () => {
			var docRef = db.collection(constants.DB_ITEMS).doc(id)
	    return docRef.delete().then(ref => {
	      return getItemsFromDatabase(res)
	    }).catch(err => {
	      console.log('Error getting document', err);
	      return res.status(err.code).json({message: `Something went wrong. ${err.message}`})
	    })
		})
  })
});

exports.oauth = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if(req.method !== constants.METHOD_POST) {
      return res.status(constants.ERROR_CODE_METHOD_NOT_ALLOWED).json({
        message: constants.ERROR_TEXT_METHOD_NOT_ALLOWED
      })
    }
		var request = new Request(req);
		var response = new Response(res);
		return oauth.token(request, response)
			.then((token) => {
				return res.json(token)
			}).catch((err) => {
				return res.status(err.code || constants.ERROR_CODE_INTERNAL).json(err)
			})
  })
});

exports.verify = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if(req.method !== constants.METHOD_POST) {
      return res.status(constants.ERROR_CODE_METHOD_NOT_ALLOWED).json({
        message: constants.ERROR_TEXT_METHOD_NOT_ALLOWED
      })
    }
		return authenticateRequest(req, res, () => {
			return res.status(constants.SUCCESS_CODE).json({statusCode: constants.SUCCESS_CODE, message: 'valid'})
		})
  })
});

function authenticateRequest(req, res, next) {
	var request = new Request(req)
	var response = new Response(res)
	return oauth.authenticate(request, response)
		.then((token) => {
			return next()
		}).catch((err) => {
			return res.status(err.code || constants.ERROR_CODE_INTERNAL).json(err)
		})
}

/*
// Init express server
var app = express();
app.use(cors);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.oauth = new OAuth2Server({
	model: require('./model.js'),
	accessTokenLifetime: 60 * 60,
	allowBearerTokensInQueryString: true
});

app.all('/oauth/token', obtainToken);

app.get('/', authenticateRequest, function(req, res) {
	res.send('Congratulations, you are in a secret area!');
});

// app.listen(3000);

function obtainToken(req, res) {
	var request = new Request(req);
	var response = new Response(res);

	return app.oauth.token(request, response)
		.then(function(token) {
			res.json(token);
		}).catch(function(err) {
			res.status(err.code || 500).json(err);
		});
}

function authenticateRequest(req, res, next) {
	var request = new Request(req);
	var response = new Response(res);

	return app.oauth.authenticate(request, response)
		.then(function(token) {
			next();
		}).catch(function(err) {
			res.status(err.code || 500).json(err);
		});
}

// This HTTPS endpoint can only be accessed by your Firebase Users.
// Requests need to be authorized by providing an `Authorization` HTTP header
// with value `Bearer <Firebase ID Token>`.
exports.app = functions.https.onRequest(app);
*/
