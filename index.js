var express = require('express');
var path = require('path')
var app = express();
var bodyParser = require('body-parser');
var process = require('process');
const fetch = require('node-fetch');
const FormData = require('form-data');

const axios = require("axios")
app.use(bodyParser.text());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).redirect('/')
  })

app.get('/', function (req, res) {
    if (req.headers['user-agent'].includes('Discordbot')) {
        console.log('loaded by cdn');
        res.render('meta');
    } else {
        console.log('loaded index');
        res.redirect('https://discord.com/api/oauth2/authorize?client_id=715047504126804000&redirect_uri=https%3A%2F%2Fguildcount.triviabot.tech%2Fguildcount&response_type=code&scope=identify%20guilds');
    }
})

app.get('/credits', function (req, res) {
  res.render('credits');
});

app.get('/guildcount', function (req, res) {
    const data = new FormData();
    console.log(req.body)
    data.append('client_id', "715047504126804000");
    data.append('client_secret', process.env.client_secret);
    data.append('grant_type', 'authorization_code');
    data.append('redirect_uri', "https://guildcount.triviabot.tech/guildcount");
    data.append('scope', 'identify');
    data.append('code', req.query.code);

    fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        body: data,
    })
        .then(response => response.json())
        .then(data=>{
            console.log(data)
            const config = {
                headers:{
                    "authorization":`Bearer ${data.access_token}`
                }
            }
            axios
                .get("https://discord.com/api/users/@me",config)
                .then(response=>{
                    const username = response.data.username
                    console.log(response.data.username)
                    axios
                    .get("https://discord.com/api/users/@me/guilds",config)
                    .then(response=>{
                        const guildcount = response.data.length
                        console.log(response.data.length)
                        if (err) {
                            console.error(err);
                            res.status(500).render('oops')
                        };
                        const totals= {owner:0, community:0, partnered:0, discoverable:0, commerce:0, partnered:0, verified:0};
                        response.data.map(i =>{
                            if (i.owner) {
                                totals['owner'] = totals['owner'] + 1
                            }
                            if (i.features.includes('VERIFIED')) {
                                totals['verified'] = totals['verified'] + 1
                            }
                            if (i.features.includes('COMMUNITY')) { 
                                totals['community'] = totals['community'] + 1 
                            }
                            if (i.features.includes('PARTNERED')) { 
                                totals['partnered'] = totals['partnered'] + 1 
                            }
                                if (i.features.includes('DISCOVERABLE')) { 
                                totals['discoverable'] = totals['discoverable'] + 1 
                            }
                                if (i.features.includes('COMMERCE')) { 
                                totals['commerce'] = totals['commerce'] + 1 
                            }
                        res.render('guildcount', {username: username, guildcount: guildcount, totals:totals});
                        });
                    })
                    .catch(error=>{
                        console.log(error)
                        res.status(500).redirect('/')
                    })
                })
                .catch(error=>{
                    console.log(error)
                    res.status(500).redirect('/')
                })
        })
})
app.listen(8081)
