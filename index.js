const config = require('config');
const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');

const logger = require('./logger');
logger();

const sendgrid = config.get('sendgrid');
const twilio = config.get('twilio');
const shareMail = config.get('shareMail');
const contactUs = config.get('contactUs');
const popupMsg = config.get('popupMsg');

const server = express();

server.head("/healthcheck", (req, res) => {
    res.send({ status: "ok" });
  });
  
  server.get("/", (req, res) => {
    //azure healthcheck
    res.status(200).send("OK");
  });
  
  server.get("/robots933456.txt", (req, res) => {
    //azure healthcheck
    res.status(200).send("OK");
  });
  
  server.listen(80);

console.log(sendgrid, twilio, shareMail, contactUs, popupMsg);

const app = express();

app.use(require('cors')());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.use('/sms/reply', function(req, res){
    const xml = '<?xml version="1.0" encoding="UTF-8"?><Response><Sms>' + twilio.reply + '</Sms></Response>';
    res.status(200).header('Content-Type','text/xml').send(xml);
});

app.post('/share/sms', function(req, res){
    request({
        url: twilio.url,
        method: 'POST',
        auth: {
            username: twilio.username,
            password: twilio.password
        },
        form: {
            From: twilio.from,
            To: req.body.To,
            Body: req.body.Body
        }
    }, function(err, response, body){
        if (err){
            res.status(500).send();
        }else{
            res.status(200).send();
        }
    });
});

app.post('/share/mail', function(req, res){
    request({
        url: sendgrid.unsubscribes,
        qs: {
            email: req.body.to,
            api_user: sendgrid.username,
            api_key: sendgrid.password
        }
    }, function(err, response, body){
        if (err){
            res.status(500).send();
        }else{
            var data = JSON.parse(body);
            if (data.length > 0){
                res.status(500).send('Email address unsubscribed');
            }else{
                request({
                    url: sendgrid.mail,
                    qs: {
                        to: req.body.to,
                        subject: shareMail.subject,
                        html: req.body.html,
                        from: shareMail.from,
                        fromname: 'Range',
                        api_user: sendgrid.username,
                        api_key: sendgrid.password,
                        'x-smtpapi': JSON.stringify({
                            "filters": {
                                "templates": {
                                    "settings": {
                                        "enabled": 1,
                                        "template_id": shareMail.template_id
                                    }
                                }
                            },
                            "category": [
                                sendgrid.category
                            ]
                        })
                    }
                }, function(err, response, body){
                    if (err){
                        res.status(500).send();
                    }else{
                        res.status(200).send(body);
                    }
                });
            }
        }
    });
});

app.post('/contactus', function(req, res){
    request({
        url: sendgrid.unsubscribes,
        qs: {
            email: req.body.from,
            api_user: sendgrid.username,
            api_key: sendgrid.password,
            categories: [sendgrid.category]
        }
    }, function(err, response, body){
        if (err){
            res.status(500).send();
        }else{
            var data = JSON.parse(body);
            if (data.length > 0){
                res.status(500).send('Email address unsubscribed');
            }else{
                request({
                    url: sendgrid.mail,
                    qs: {
                        to: contactUs.to,
                        bcc: req.body.from,
                        subject: req.body.subject,
                        html: req.body.text,
                        from: req.body.from,
                        api_user: sendgrid.username,
                        api_key: sendgrid.password,
                        'x-smtpapi': JSON.stringify({
                            "category": [
                                sendgrid.category
                            ]
                        })
                    }
                }, function(err, response, body){
                    if (err){
                        res.status(500).send();
                    }else{
                        res.status(200).send(body);
                    }
                });
            }
        }
    });
});

app.get('/popup', function(req, res){
    res.status(200).send(popupMsg);
});

app.use(express.static('./public'));

app.listen(process.env.port || 8787);
console.log('Running on port', process.env.port || 8787);
