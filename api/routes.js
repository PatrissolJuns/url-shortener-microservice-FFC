'use strict'

require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });

const path = require('path');
const mongoose = require('mongoose');
const UrlModel = require('./models/UrlModel');


mongoose.Promise = global.Promise;

// connection to the database MongoDB
// in the .env file, provide a MONGOLAB_URI which correspondent to your database online
mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/url_shortner').then(() => {
    console.log('Connected to mongoDB');  
}).catch(e => {
    console.log('Error while DB connecting');
    console.log(e);
});

// we exports our different function which will be execute in the server file
module.exports = function(app) {

    function findNextId(url, callback) {
    // here we check for the largest urlId in the collection and we set the local variable uniqueIdcount if found
    
        UrlModel.count({}, function(err, count) {
            let uniqueIdCount;
            console.log('count: ', count);

            // we check if the collection is empty
            if (count === 0 && !err) {
                uniqueIdCount = 0;
                createAndInsertUrl(uniqueIdCount + 1, url);
            } else {
            // set uniqueIdCount to the largest id in the collection
                UrlModel.find({})
                        .sort({urlId: -1})
                        .limit(1)
                        .exec(function(err, data) {
                            if (!err) {
                                // we set it finally
                                uniqueIdCount = data[0].urlId;
                                console.log(uniqueIdCount);

                                // then we create a new url in the collection
                                createAndInsertUrl(uniqueIdCount + 1, url);
                                
                                // we set the callback so that it will return the last url
                                if (callback) {
                                    callback(uniqueIdCount + 1);
                                }
                            }
                    
                }); 
            }
        });
    }
    
    function createAndInsertUrl(uniqueIdCount, url) {
    //insert object in the collection
        let newUrl = new UrlModel({
            url: url,
            urlId: uniqueIdCount
        });

        newUrl.save(function(err, data) {
            if (err) throw err
            console.log('object added');
        })
    
    }
    
    // this static route is in server.js 
    // app.use(app.static(path.join(__dirname, 'public')))

    app.get('/', function(req, res) {
        res.sendFile(path.join(__dirname, 'index.html'));
    })
    
    app.get('/new/*', function(req, res) {
        // we collect the url and remove the /new/ at the begining
        let url = req.url.replace(/^\/new\//, '');

        //we check if it is a valid url
        if (validURL(url)) {
            // that is in case were the url is wrong
            res.json(
                {
                    error: 'The url that you have just sent is an invalid url please chech it again.'
                }
            );
        } else {    
            // we call this method and bind a callback to send the response
            findNextId(url, function(data) {
                //res.send('hello!')
                console.log('this data:', data + url);
                res.json(
                    {
                        original_url: url,
                        short_url: req.protocol + '://' + req.hostname + '/' + data
                    }
                );
            });
        }
    });
    
    app.get('/:id', function(req, res) {
        
        //we collect the id sent
        let id = req.params.id;

        // we test if it is a number
        if (/^\d+$/.test(id)) {
            // look up the id from the database
            UrlModel.findOne({urlId: id}, function(err, doc) {
                console.log(doc);
                if (err) throw err;
           
                if (doc != null) 
                res.json({
                    original_url: doc.url,
                    short_url: req.protocol + '://' + req.hostname + '/' + doc.urlId
                });

                else res.json({error: 'Not in the database.'});                
            });
        } else res.json({error: 'Please the parameter should be a number.'});         
    });
    
    function validURL(url) {
        // Checks to see if it is an actual url
        // Regex from https://gist.github.com/dperini/729294
        var regex = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i;
        return regex.test(url);
    }
}
