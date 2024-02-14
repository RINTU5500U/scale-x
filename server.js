const express = require('express');
const { authentication, authorization } = require('./auth');
const {login, home, addBook, deleteBook} = require('./controller')
const app = express();

app.use(express.json());

app.post('/login', login)

app.get("/home", authentication, home)

app.post('/addBook', authentication, authorization, addBook)

app.delete('/deleteBook', authentication, authorization, deleteBook)

app.listen(3001, function () {
    console.log('Express app running on port ' + 3001)
});