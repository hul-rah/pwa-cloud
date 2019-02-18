const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();

// This serves static files from the specified directory
app.use(express.static(__dirname + '/build'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get(['/', '/index.html'], (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/api/getAll', (req, res) => {
    let options = {
        root: __dirname + '/server-data/'
    };

    const fileName = 'users.json';
    res.sendFile(fileName, options, (err) => {
        if (err) {
            console.log(err);
            res.sendStatus(500);
            return;
        }
    });
});

app.post('/api/add', (req, res) => {
    let jsonFile = __dirname + '/server-data/users.json';
    let newUser = req.body;
    console.log('Adding new user:', newUser);
    fs.readFile(jsonFile, (err, data) => {
        if (err) {
            res.sendStatus(500);
            return;
        }
        let users = JSON.parse(data);
        users.push(newUser);
        let usersJson = JSON.stringify(users, null, 2);
        fs.writeFile(jsonFile, usersJson, err => {
            if (err) {
                res.sendStatus(500);
                return;
            }
            // You could also respond with the database json to save a round trip
            res.sendStatus(200);
        });
    });
});

//
app.post('/api/delete', (req, res) => {
    let jsonFile = __dirname + '/server-data/users.json';
    let id = req.body.id;
    fs.readFile(jsonFile, (err, data) => {
        if (err) {
            res.sendStatus(500);
            return;
        }
        let users = JSON.parse(data);
        let index = users.findIndex(user => user.id === id);
        users.splice(index, 1);

        let usersJson = JSON.stringify(users, null, 2);

        fs.writeFile(jsonFile, usersJson, err => {
            if (err) {
                res.sendStatus(500);
                return;
            }
            res.sendStatus(200);
        });
    });
});

exports.app = functions.https.onRequest(app);
//const server = app.listen(8086, 'localhost', () => {
//
//    const host = server.address().address;
//    const port = server.address().port;
//
//    console.log('App listening at http://%s:%s', host, port);
//});
