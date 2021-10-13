const dns = require('dns');

dns.lookup('stormy-bastion-47351.herokuapp.com',function(err,add,fam){
    if (err) return console.log(err);
    console.log(add);
});