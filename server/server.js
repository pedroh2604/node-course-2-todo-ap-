require('./config/config');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');
var {authenticate} = require('./middleware/authenticate');

var app = express();
const port = process.env.PORT;

app.use(bodyParser.json());

// stores the todos in the collection
app.post('/todos',authenticate, (req, res) => {
	var todo = new Todo({
	text: req.body.text,
	_creator: req.user._id
	});

	todo.save().then((doc) => {
		res.send(doc);
	}, (e) => {
		res.status(400).send(e);
	});
});

// gets the todos and sends them to the route
app.get('/todos', authenticate, (req, res) => {
	Todo.find({
		_creator: req.user._id
	}).then((todos) => {
		res.send({todos});
	}, (e) => {
		res.status(400).send(e);
	})
});

// shows the data from a todo, querying by ID
app.get('/todos/:id', authenticate, (req, res) => {
	// gets the selected id
	var id = req.params.id;

	// if the id is not valid, sends an empty array and the 404 status
	if (!ObjectID.isValid(id)) {
		return res.status(404).send();
	}

	// trying to find the specified id
	Todo.findOne({
		_id: id,
		_creator: req.user._id
	}).then((todo) => {
		if (!todo) {
			return res.status(404).send();
		}
		// if successful, sends the todo object
		res.send({todo});
	}).catch((e) => {
		res.status(400).send();
	})
});

// deletes a todo from the api
app.delete('/todos/:id', authenticate, (req, res) => {
	var id = req.params.id;

	// if the object is not valid, returns a 404
	if (!ObjectID.isValid(id)) {
		return res.status(404).send();
	}

	Todo.findOneAndRemove({
		_id: id,
		_creator: req.user._id
	}).then((todo) => {
		// gotta check if there's a doc, because the method 'works' with null
		if (!todo) {
			return res.status(404).send();
		}
		res.send({todo});
	}).catch((e) => {
		res.status(400).send();
	})
});

// updates Todo items
app.patch('/todos/:id', authenticate, (req, res) => {
	var id = req.params.id;
	// the properties that users are allowed to update
	var body = _.pick(req.body, ['text', 'completed']);

	if (!ObjectID.isValid(id)) {
		return res.status(404).send();
	}

	// checks if the Todo is completed or not
	if (_.isBoolean(body.completed) && body.completed) {
		body.completedAt = new Date().getTime();
	} else {
		body.completed = false;
		body.completedAt = null;
	}

	Todo.findOneAndUpdate(
		{
			_id: id,
			_creator: req.user._id
		}, 
			{$set: body}, 
			{new: true}).then((todo) => {
		if (!todo) {
			return res.status(404).send();
		}

		res.send({todo});
	}).catch((e) => {
		res.status(400).send();
	})
});

// POST /users
// stores the users in the collection
app.post('/users', (req, res) => {

	// the properties that users are allowed to update
	var body = _.pick(req.body, ['email', 'password']);

	var user = new User(body);

	// generates the token for the new user
	user.save().then(() => {
		return user.generateAuthToken();
		// res.send(user);
	}).then((token) => {
		res.header('x-auth', token).send(user);
	}).catch((e) => {
		res.status(400).send(e);
	})
});

// gets the info from the url, and sends the request
app.get('/users/me', authenticate, (req, res) => {
	res.send(req.user);
});

// POST /users/login(email,password)
app.post('/users/login', (req, res) => {

	var body = _.pick(req.body, ['email', 'password']);

	User.findByCredentials(body.email, body.password).then((user) => {
		return user.generateAuthToken().then((token) => {
			// sends the new generated token
			res.header('x-auth', token).send(user);
		})
	}).catch((e) => {
		res.status(400).send();
	});	
});

// logs off an user, deleting its toke
app.delete('/users/me/token', authenticate, (req, res) => {
	req.user.removeToken(req.token).then(() => {
		res.status(200).send();
	}, () => {
		res.status(400).send();
	});
});

// stablishes the port the server will be up at
app.listen(port, () => {
	console.log(`Started up at port ${port}`);
});

// exports express
module.exports = {app};
