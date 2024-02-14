const express = require('express');
const jwt = require('jsonwebtoken')
const fs = require('fs');
const regularUserFilePath = 'regularUser.csv';
const adminUserFilePath = 'adminUser.csv'

const assumeData = [
    { "userType": "admin", "email": "admin1@example.com", "password": "admin123", "name": "Admin One" },
    { "userType": "admin", "email": "admin2@example.com", "password": "admin456", "name": "Admin Two" },
    { "userType": "user", "email": "user1@example.com", "password": "user123", "name": "User One" },
    { "userType": "user", "email": "user2@example.com", "password": "user456", "name": "User Two" },
    { "userType": "user", "email": "user3@example.com", "password": "user789", "name": "User Three" },
    { "userType": "admin", "email": "admin3@example.com", "password": "admin789", "name": "Admin Three" },
    { "userType": "user", "email": "user4@example.com", "password": "userabc", "name": "User Four" },
    { "userType": "admin", "email": "admin4@example.com", "password": "adminabc", "name": "Admin Four" },
    { "userType": "user", "email": "user5@example.com", "password": "userdef", "name": "User Five" },
    { "userType": "admin", "email": "admin5@example.com", "password": "admindef", "name": "Admin Five" },
    { "userType": "user", "email": "user6@example.com", "password": "userghi", "name": "User Six" },
    { "userType": "admin", "email": "admin6@example.com", "password": "adminghi", "name": "Admin Six" },
    { "userType": "user", "email": "user7@example.com", "password": "userjkl", "name": "User Seven" },
    { "userType": "admin", "email": "admin7@example.com", "password": "adminjkl", "name": "Admin Seven" }
]


module.exports = {
    login: async (req, res) => {
        try {
            const { email, password } = req.body
            const findUser = assumeData.find(user => user.email === email && user.password === password);
            if (!findUser) {
                return res.status(404).send({ status: false, message: "Either emailId or password is incorrect" })
            }
            let token = jwt.sign({ userType: findUser.userType }, "Secret-key", { expiresIn: '1h' })
            res.setHeader("token", token)
            return res.status(200).send({ Message: "LoggedIn successfully", Token: token })
        } catch (error) {
            return res.status(500).send({ status: false, message: error.message })
        }
    },

    home: async function (req, res, callback) {
        try {
            let data = []
            fs.readFile(regularUserFilePath, 'utf8', (err, csvFile) => {
                if (err) {
                    console.log('Error reading the file:', err.message);
                }
                const rows = csvFile.split('\n')
                for (let i = 1; i < rows.length; i++) {
                    const arr = rows[i].split(',')
                    data.push(arr[0])
                }
                if (req.fetchBookByAdmin == true) {
                    callback(data)
                    return;
                }
                if (req.decodedToken.userType === 'user') {
                    return res.status(200).send({ message: "Data fetched successfully", Data: data })
                } else {
                    fs.readFile(adminUserFilePath, 'utf8', (err, csvFile) => {
                        if (err) {
                            console.log('Error reading the file:', err.message);
                        }
                        const rows = csvFile.split('\n')
                        for (let i = 1; i < rows.length; i++) {
                            const arr = rows[i].split(',')
                            data.push(arr[0])
                        }
                        return res.status(200).send({ message: "Data fetched successfully", Data: data })
                    })
                }
            })
        } catch (error) {
            return res.status(500).send({ status: false, message: error.message })
        }
    },

    addBook: async (req, res) => {
        try {
            const { bookName, author, publicationYear } = req.query;
            if (!bookName) {
                return res.status(400).send({ status: false, message: 'book name is required'})
            }
            if (typeof bookName != 'string') {
                return res.status(400).send({ status: false, message: 'book name should be a string'})
            }
            if (!author) {
                return res.status(400).send({ status: false, message: 'author is required'})
            }
            if (typeof author != 'string') {
                return res.status(400).send({ status: false, message: 'author should be a string'})
            }
            if (!publicationYear) {
                return res.status(400).send({ status: false, message: 'publicationYear is required'})
            }
            if (! /^\d{4}$/.test(publicationYear) || typeof publicationYear != 'number') {
                return res.status(400).send({ status: false, message: 'publicationYear should be a 4 digit year'})
            }
            const newBookEntry = `
${bookName},${author},${publicationYear}`;
            const stream = fs.createWriteStream(regularUserFilePath, { flags: 'a' });
            stream.write(newBookEntry);
            stream.end();
            stream.on('finish', async () => {
                req.fetchBookByAdmin = true;  // due to fetch only regularUserFilePath
                await module.exports.home(req, res, (data) => {
                    req.fetchBookByAdmin = false; // again chnage condition to false
                    res.status(200).send({ status: true, message: 'Book added successfully', data });
                });
            });
            stream.on('error', (err) => {
                console.log('Error writing file:', err.message);
                return res.status(500).send({ status: false, message: err.message })
            });
        } catch (error) {
            return res.status(500).send({ status: false, message: error.message })
        }
    },

    deleteBook: async (req, res) => {
        try {
            const { bookName } = req.query;
            fs.readFile(regularUserFilePath, 'utf8', (err, data) => {
                if (err) {
                    console.error(err);
                    return;
                }
                const lines = data.split('\n');
                const modifiedContent = lines
                    .filter(line => !line.includes(bookName))
                    .join('\n');

                fs.writeFile(regularUserFilePath, modifiedContent, 'utf8', async (err) => {
                    if (err) {
                        console.error(err);
                    } else {
                        req.fetchBookByAdmin = true;  // due to fetch only regularUserFilePath
                        await module.exports.home(req, res, (data) => {
                            req.fetchBookByAdmin = false; // again chnage condition to false
                            res.status(200).send({ status: true, message: 'Book deleted successfully', data });
                        });
                    }
                });
            });
        } catch (error) {
            return res.status(500).send({ status: false, message: error.message })
        }
    }

}