require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const dns = require('dns');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);

const url_Schema = new mongoose.Schema({
  original_url: {type:String, required:true},
  short_url: Number
});

const Url = mongoose.model('Url', url_Schema);
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({extended:false}));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

//Code Here
function findOneByUrl(url,done){
  Url.findOne({original_url:url}, (err,doc)=>{
    if (err) return console.log(err);
    done(null, doc);
  });
}

function findOneByShortUrl(url_number,done){
  Url.findOne({short_url:url_number}, (err,doc)=>{
    if (err) return console.log(err);
    done(null, doc);
  });
}

function testValidUrl(url,done,invalid){
  let validUrlRegExp= /^(https?:\/\/)?(w{3}.)?\w[\w-]*.[\w{2,}]+((\/\w+(-\w)*)*)?/;
  if (validUrlRegExp.test(url)){
    replacedUrl= url.replace(/^https?:\/\//,'').replace(/\/([\w?=\/])*$/,'');
    dns.lookup(replacedUrl, (err,add,fam)=>{
      if (err) return done(err);
      done(null,add);
    });
  } else {
    invalid();
  }
}

function createAndSaved(url,done){
  Url.count((err,length)=>{
    if (err) return done(err);
    if (length==0){
      new Url({
        original_url:url,
        short_url:1
      }).save((err,doc)=>{
        if (err) return done(err);
        done(null,{original_url:doc.original_url,short_url:doc.short_url});
      });
    } else {
      new Url({
        original_url:url,
        short_url:length +1
      }).save((err,doc)=>{
        if (err) return done(err);
        done(null,{original_url:doc.original_url,short_url:doc.short_url});
      });
    }
  });
}

app.post('/api/shorturl',function(req,res){
  testValidUrl(req.body.url, (err,address)=>{
    if (err) return console.log(err);
    if (address==null){
      return res.json({error: 'invalid url'});
    }
    findOneByUrl(req.body.url,function(err,doc){
      if (err) return console.log(err);
      if (doc){
        res.json({
          original_url: doc.original_url,
          short_url: doc.short_url
        });
      } else {
        createAndSaved(req.body.url,function(err,doc){
          if (err) return console.log(err);
          res.json({
            original_url: doc.original_url,
            short_url: doc.short_url
          });
        });
      }
    });
  },function(){
    res.json({error: 'invalid url'});
  });
});

app.get('/api/shorturl/:urlNumber',function(req,res){
  findOneByShortUrl(req.params.urlNumber,function(err,doc){
    if (err) return console.log(err);
    if (doc==null){
      res.json({error: 'url not exist'})
    } else {
      res.redirect(doc.original_url);
    }
  })
});
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
