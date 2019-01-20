require('./config/config');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');

var app = express();
const port = process.env.PORT;

app.use(bodyParser.json());

// stores the todos in the collection
app.post('/todos', (req, res) => {
	var todo = new Todo({
	text: req.body.text
	});

	todo.save().then((doc) => {
		res.send(doc);
	}, (e) => {
		res.status(400).send(e);
	});
});

// gets the todos and sends them to the route
app.get('/todos', (req, res) => {
	Todo.find().then((todos) => {
		res.send({todos});
	}, (e) => {
		res.status(400).send(e);
	})
});

// shows the data from a todo, querying by ID
app.get('/todos/:id', (req, res) => {
	// gets the selected id
	var id = req.params.id;

	// if the id is not valid, sends an empty array and the 404 status
	if (!ObjectID.isValid(id)) {
		return res.status(404).send();
	}

	// trying to find the specified id
	Todo.findById(id).then((todo) => {
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
app.delete('/todos/:id', (req, res) => {
	var id = req.params.id;

	// if the object is not valid, returns a 404
	if (!ObjectID.isValid(id)) {
		return res.status(404).send();
	}

	Todo.findByIdAndRemove(id).then((todo) => {
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
app.patch('/todos/:id', (req, res) => {
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

	Todo.findByIdAndUpdate(id, {$set: body}, {new: true}).then((todo) => {
		if (!todo) {
			return res.status(404).send();
		}

		res.send({todo});
	}).catch((e) => {
		res.status(400).send();
	})
});


app.listen(port, () => {
	console.log(`Started up at port ${port}`);
});

module.exports = {app};
