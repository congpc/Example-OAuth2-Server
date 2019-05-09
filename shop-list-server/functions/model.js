var admin = require('firebase-admin');
var functions = require('firebase-functions');
var constants = require('./constants.js');
//firestore
var db = admin.firestore();

/*
 * Methods used by all grant types.
 */
var getAccessToken = function(token) {
	const tokenRef = db.collection(constants.DB_TOKENS).doc(token)
	return tokenRef.get().then(doc => {
		if (doc.exists) {
			let tokenObj = doc.data()
			tokenObj.accessTokenExpiresAt = tokenObj.accessTokenExpiresAt.toDate()
			return tokenObj
		} else {
			return ''
		}
	})
	.catch(err => {
		console.log('Error getting document', err);
	});
};

var getClient = function(clientId, clientSecret) {
	const clientRef = db.collection(constants.DB_CLIENTS)
	var queryRef = clientRef.where('clientId', '==', clientId).where('clientSecret', '==', clientSecret)
	return queryRef.get().then((querySnapshot) => {
		let client = {}
	  querySnapshot.forEach((doc) => {
			client = doc.data()
	  })
		return client
	})
};

var saveToken = function(token, client, user) {
	// console.log('saveToken:')
	token.client = {
		id: client.clientId
	};
	token.user = {
		id: user.username || user.clientId
	};
	if (!token.scope) {
		token.scope = ''; // Make default value for scope undefined
	}
	db.collection(constants.DB_TOKENS).doc(token.accessToken).set(token).then(ref => {
		//console.log('Created token', token);
		return ref
	}).catch(err => {
		console.log('Error getting document', err);
	})
	return token;
};

/*
 * Method used only by password grant type.
 */

var getUser = function(username, password) {
	const userRef = db.collection(constants.DB_USERS)
	var queryRef = userRef.where('username', '==', username).where('password', '==', password)
	return queryRef.get().then((querySnapshot) => {
		let user = {}
		querySnapshot.forEach((doc) => {
			user = doc.data();
		})
		return user
	})
};

/*
 * Method used only by client_credentials grant type.
 */

var getUserFromClient = function(client) {
	const clientRef = db.collection(constants.DB_CLIENTS)
	// Create a query against the collection
	var queryRef = clientRef.where('clientId', '==', client.clientId).where('clientSecret', '==', client.clientSecret).where('grants', 'array-contains', 'client_credentials')
	return queryRef.get().then((querySnapshot) => {
		let client = {}
	  querySnapshot.forEach((doc) => {
			client = doc.data()
	  })
		return client
	})
};

/**
 * Export model definition object.
 */
module.exports = {
	getAccessToken: getAccessToken,
	getClient: getClient,
	saveToken: saveToken,
	getUser: getUser,
	getUserFromClient: getUserFromClient
};

/**
 * Create example data.
 */
// const createExampleData = function() {
// 	var client1 = {
// 		clientId: 'application',
// 		clientSecret: 'secret',
// 		grants: [
// 			'password'
// 		],
// 		redirectUris: []
// 	};
//
// 	var client2 = {
// 		clientId: 'confidentialApplication',
// 		clientSecret: 'topSecret',
// 		grants: [
// 			'password',
// 			'client_credentials'
// 		],
// 		redirectUris: []
// 	};
//
// 	var user = {
// 		id: '1',
// 		username: 'admin',
// 		password: 'password'
// 	};
//
// 	db.collection(constants.DB_CLIENTS).doc(client1.clientId).set(client1).then(ref => {
// 		console.log('Created client', client1);
// 		return ref
// 	}).catch(err => {
// 		console.log('Error getting document', err);
// 	});
//
// 	db.collection(constants.DB_CLIENTS).doc(client2.clientId).set(client2).then(ref => {
// 		console.log('Created client', client2);
// 		return ref
// 	}).catch(err => {
// 		console.log('Error getting document', err);
// 	});
//
// 	db.collection(constants.DB_USERS).doc(user.id).set(user).then(ref => {
// 		console.log('Created user', user);
// 		return ref
// 	}).catch(err => {
// 		console.log('Error getting document', err);
// 	});
// };
