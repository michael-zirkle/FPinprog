const passport = require('passport');
const express = require('express');
const jwt = require('jsonwebtoken');
const asyncMiddleware = require('../middleware/asyncMiddleware');

const tokenList = {};
const router = express.Router();

router.get('/status', (req, res, next) => {
  res.status(200).json({ status: 'ok' });
});

router.post('/signup', passport.authenticate('signup', { session: false }), async (req, res, next) => {
  res.status(200).json({ message: 'signup successful' });
});

//router.get('/avatars', asyncMiddleware(async (req, res, next) => {
  //const user = await UserModel.find({}, 'gender type -_id');
  //req.json(user);
//}));
//router.post('/signup', asyncMiddleware( async (req, res, next) => {
  //const { name, email, password, type, gender } = req.body;
  //await UserModel.create({ email, password, name, type, gender });
  //res.status(200).json({ 'status': 'ok' });
//}));

router.post('/login', async (req, res, next) => {
  passport.authenticate('login', async (err, user, info) => {
    
    try {
      if (err || !user) {
        const error = new Error('An Error occured');
        return next(error);
      }
      req.login(user, { session: false }, async (error) => {
        if (error) return next(error);
        const body = {
          _id: user._id,
          email: user.email,
          name: user.name,
          gender: user.gender,
          type: user.type
        };

        const token = jwt.sign({ user: body }, 'top_secret', { expiresIn: 300 });
        const refreshToken = jwt.sign({ user: body }, 'top_secret_refresh', { expiresIn: 86400 });

        // store tokens in cookie
        res.cookie('jwt', token);
        res.cookie('refreshJwt', refreshToken);

        // store tokens in memory
        tokenList[refreshToken] = {
          token,
          refreshToken,
          email: user.email,
          _id: user._id,
          name: user.name,
          gender: user.gender,
          type: user.type
        };

        //Send back the token to the user
        return res.status(200).json({ token, refreshToken });
      });
    } catch (error) {
      return next(error);
    }
  })(req, res, next);
  
});

router.post('/token', (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken in tokenList) {
    const body = { email: tokenList[refreshToken].email, _id: tokenList[refreshToken]._id, name: tokenList[refreshToken].name, type: tokenList[refreshToken].type, gender: tokenList[refreshToken].gender };
    const token = jwt.sign({ user: body }, 'top_secret', { expiresIn: 300 });

    // update jwt
    res.cookie('jwt', token);
    tokenList[refreshToken].token = token;

    res.status(200).json({ token });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

router.post('/logout', (req, res) => {
  if (req.cookies) {
    const refreshToken = req.cookies['refreshJwt'];
    if (refreshToken in tokenList) delete tokenList[refreshToken]
    res.clearCookie('refreshJwt');
    res.clearCookie('jwt');
  }

  res.status(200).json({ message: 'logged out' });
});

module.exports = router;
