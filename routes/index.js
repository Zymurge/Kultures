var express = require('express');
var router = express.Router();
var curr_user;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.setHeader('content-type', 'text/html');
  res.render('index', { title: 'Kultures' });
});

router.get('/setuser', function(req, res, next) {
  res.setHeader('content-type', 'application/json');
  curr_user = req.query.name;
  response = {
  	welcome: {
	  	title:'Kultures',
	  	message: 'Welcome ' + req.query.name
	  }
  };
  res.end(JSON.stringify(response));
});

/*
router.get('/getuser', function(req, res, next) {
  res.setHeader('content-type', 'application/json');
  response = {
    user: {
      name: curr_user
    }
  };
  res.end(JSON.stringify(response));
});

router.get('/kulture', function(req, res, next) {
  res.setHeader('content-type', 'application/json');
  console.log( "Params: " + req.query.id );
  response = {
    ref: {
      id: Number(req.query.id),
      name: 'test kulture'
    },
    display: {
      loc: {
        x: 1,
        y: 2,
        z: 3
      }
    }
  };
  res.end(JSON.stringify(response));
});
*/

module.exports = router;
