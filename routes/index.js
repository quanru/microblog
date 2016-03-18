var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var User = require('../models/user.js');
var Post = require('../models/post.js');

router.get('/', function(req, res) {
    Post.get(null, function(err, posts) {
        if (err) {
            posts = [];
        }
        res.render('index', {
            title: 'index',
            posts: posts,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});
router.get('/reg', checkLogin);
router.get('/reg', function(req, res) {
    res.render('reg', {
        title: 'Account register'
    });
});

router.post('/reg', checkLogin);
router.post('/reg', function(req, res) {
    if(req.body['password-repeat'] !== req.body['password']) {
        req.flash('error', 'The password-repeat is not equal password');
        return res.redirect('/reg');
    }

    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('base64');

    var newUser = new User({
            name: req.body.username,
            password: password,
    });

    User.get(newUser.name, function (err, user) {
        if(user)
            err = 'Username alredy exists.';
        if(err) {
            req.flash('error', err);
            return res.redirect('/reg');
        }
        newUser.save(function (err) {
            if(err) {
                req.flash('error', err);
                return res.redirect('/reg');
            }
            req.session.user = newUser;
            req.session.title = 'Register success';
            req.flash('success', 'Register sucess');
            res.redirect('/');
        });
    });
});

router.get('/login', checkLogin);
router.get('/login', function(req, res) {
        res.render('login', {
            title: 'user login',
        });
});

router.post('/login', checkLogin);
router.post('/login', function(req, res) {
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('base64');

    User.get(req.body.username, function (err, user) {
        if(!user) {
            req.flash('error', 'user is not exist');
            return res.redirect('/login');
        }
        if(user.password !== password) {
            req.flash('error', 'wrong password');
            return res.redirect('/');
        }
        req.session.user = user;
        req.flash('success', 'login success');
        res.redirect('/');
    });
});

router.get('/logout', checkNotLogin);
router.get('/logout', function(req, res) {
    req.session.user =null;
    req.flash('success', 'logout success');
    res.redirect('/');
});

router.post('/post', checkNotLogin);
router.post('/post', function  (req, res) {
    var currentUser = req.session.user;
    var post = new Post(currentUser.name, req.body.post);
    post.save(function  (err) {
        if(err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        req.flash('success', 'post success');
        res.redirect('/u/' + encodeURIComponent(currentUser.name));
    });
});

router.get('/u/:user', function (req, res) {
    User.get(req.params.user, function  (err, user) {
        if(!user) {
            req.flash('error', 'user is not exits');
            return res.redirect('/');
        }
        console.log('hello');
        Post.get(user.name, function  (err, posts) {
            if(err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('user', {
                title: user.name,
                posts: posts,
            });
        });
    });
});

module.exports = router;

function checkNotLogin (req, res, next) {
    if(!req.session.user) {
        req.flash('error', 'have not logined');
        return res.redirect('/login');
    }
    next();
}
function checkLogin (req, res, next) {
    if(req.session.user) {
        req.flash('error', 'login alredy');
        return res.redirect('/');
    }
    next();
}