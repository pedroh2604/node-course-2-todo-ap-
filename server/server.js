var express = require('express');
var bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');

var app = express();

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

app.listen(3000, () => {
	console.log('Started on port 3000');
});

module.exports = {app};
