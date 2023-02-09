const bcrypt = require('bcrypt');
const mysql = require('mysql');
const { validatePassword, validateEmail} = require('../validation/validation');
const {User} = require('../models')

// Basic HTTP authentication middleware
const auth = async (req, res, next) => {
    if (req.method === 'PUT' || req.method === 'GET') {

        if(!req.get('Authorization')){
            var err = new Error('Unable to Authenticate!')
            // Set status code to '401 Unauthorized' and 'WWW-Authenticate' header to 'Basic'
            res.status(401).set('WWW-Authenticate', 'Basic')
            res.send("Provide Basic Auth, Username, Password")
            next(err)
        }
        // If 'Authorization' header present
        else{
            // Decode the 'Authorization' header Base64 value
            var creds = Buffer.from(req.get('Authorization').split(' ')[1], 'base64')
            .toString()
            // username:password
            .split(':')
            // ['username', 'password']

            var username = creds[0];
            var password = creds[1];

            var userid = req.params.userId;

            let PasswordErr = validatePassword(password);
            let UsernameErr = validateEmail(username);

            if(UsernameErr && PasswordErr) {


                var userFound = await User.findOne({
                    where: { username: username },
                }).catch((err) => {
                    if(err){
                        console.log(err);
                    }
                });

                if(userFound == null){
                    var err = new Error('Unable to Authenticate!')
                    // Set status code to '401 Unauthorized' and 'WWW-Authenticate' header to 'Basic'
                    res.status(401).set('WWW-Authenticate', 'Basic')
                    res.send("Username not Found")
                    next(err)
                }else{
                    if(userid == userFound.id){
                        if(username == userFound.username){
                            const hashedPassword = userFound.password;
                            bcrypt.compare(password, hashedPassword, function (err, result) {
                                if (result === true) {
                                    next()
                                    console.log("Authenticated")
                                } else {
                                    var err = new Error('Unable to Authenticate!')
                                    // Set status code to '401 Unauthorized' and 'WWW-Authenticate' header to 'Basic'
                                    res.status(401).set('WWW-Authenticate', 'Basic')
                                    res.send("Invalid Auth Password")
                                    next(err)
                                }
                            });
                        }else{
                            var err = new Error('Unable to Authenticate!')
                            // Set status code to '401 Unauthorized' and 'WWW-Authenticate' header to 'Basic'
                            res.status(401).set('WWW-Authenticate', 'Basic')
                            res.send("Invalid Auth Username")
                            next(err)
                        }
                    } else{
                        var err = new Error('Unable to Authenticate!')
                        // Set status code to '401 Unauthorized' and 'WWW-Authenticate' header to 'Basic'
                        res.status(403)
                        res.send("Invalid UserID")
                        next(err)
                    }                          
                }
                
            }else{
                res.status(401).send("Invalid Auth Email/Password");
            }
        }
    }else {
        next();
    }
};

module.exports = auth;