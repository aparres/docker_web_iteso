var express = require('express');
var router = express.Router();
const passport = require('passport');
const passport_handler = require('../passport-handler')
const User = require('../db/mongoose-handler').User;


router.get('/login', function(req, res, next) {
    if(req.query.fail) {
        return res.render('login', { title: 'Login', login_fail: true });
    }
    res.render('login', { title: 'Login', login_fail: false });
});

router.post('/login', passport.authenticate('local', { failureRedirect: '/auth/login?fail=true' }), function(req, res) {
    res.redirect('/');
});

router.get('/logout', function(req, res) {
    if(!req.user) {
        return res.redirect('https://www.iteso.mx');
    }

    req.session.destroy();
    res.redirect('https://www.iteso.mx');
});

router.post('/register', passport_handler.isAuthenticated, async function(req, res, next) {
    if(req.user.rol !== 'admin') {
        return res.redirect('/');
    }

    let u = await new User({ email: req.body.email, nombre: req.body.nombre, apellido: req.body.apellido, grupo: req.body.grupo});
    let user = await User.register(u, req.body.password);
    console.log(user);
    res.redirect('/auth/users');
});

router.get('/change-password', passport_handler.isAuthenticated, function(req, res, next) {
    res.render('change-password',  { user: req.user, change_fail: false, change_error: "" });
});

router.post('/change-password', passport_handler.isAuthenticated, function(req, res, next) {
    console.log(req.body);
    req.user.changePassword(req.body.oldPassword, req.body.newPassword, function(err) {
        if(err) {
            console.log(err);
            return res.render('change-password', { change_fail: true, change_error: err });
        }
        return res.redirect('/');
    });
});

router.get('/users', passport_handler.isAuthenticated, async function(req, res, next) {
    if(req.user.rol !== 'admin') {
        return res.redirect('/');
    }
    
    let users = await User.find({});
    res.render('users', { users: users, user: req.user, show_alert: false });
});

router.get('/delete/:id', passport_handler.isAuthenticated, async function(req, res, next) {
    if(req.user.rol !== 'admin') {
        return res.redirect('/');
    }

    let user = await User.deleteOne({email: req.params.id});
    res.redirect('/auth/users');
});

router.get('/reset-password/:id', passport_handler.isAuthenticated, async function(req, res, next) {    
    if(req.user.rol !== 'admin') {
        return res.redirect('/');
    }

    res.render('reset-password', { user: req.user, email: req.params.id, user_logged: req.user });
});

router.post('/reset-password', passport_handler.isAuthenticated, async function(req, res, next) {
    if(req.user.rol !== 'admin') {
        return res.redirect('/');
    }

    let user = await User.findOne({email: req.body.email});
    let a = user.setPassword(req.body.password, function(err, user) {
        if(err) {
            console.log(err);
            return res.render('reset-password', { user: req.user, email: req.body.email, user_logged: req.user });
        }
        user.save();
        res.redirect('/auth/users');
    });
}); 

module.exports = router;