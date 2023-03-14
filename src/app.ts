import express from 'express';
import {TwitterApi, TwitterApiTokens} from "twitter-api-v2";
import 'websocket-polyfill'
import bodyParser from "body-parser";
require('dotenv').config()

const app = express();
const port = Number(process.env.PORT) || 3333;

app.use(bodyParser.text());

app.get('/twitter/auth', (req, res) => {

    res.setHeader('Access-Control-Allow-Origin', 'https://nostrwitter.onrender.com')
    const client = new TwitterApi({ appKey: process.env.APP_KEY, appSecret: process.env.APP_SECRET });
    client.generateAuthLink('https://nostrwitter.onrender.com', { linkMode: 'authorize' }).then(r => {
        res.send(r);
    }, error => {
        console.log(error)
        res.send('Deu errado');
    })
});

app.post('/twitter/tweet', (req: any, res) => {
    const {pin, oauth_token, oauth_token_secret, post} = JSON.parse(req.body);

    const tokens: TwitterApiTokens = {
        appKey: process.env.APP_KEY,
        appSecret: process.env.APP_SECRET,
        accessToken: oauth_token,
        accessSecret: oauth_token_secret,
    }

    const client = new TwitterApi(tokens);

    res.setHeader('Access-Control-Allow-Origin', 'https://nostrwitter.onrender.com')
    client.login(pin).then(r => {
            console.log(
                r.client.v1.tweet(post)
                    .then(r => {
                        res.send(r)
                    }, error => res.send(error)))
    }, error => res.send(error))
});


app.listen(port, '0.0.0.0',0,() => {
     console.log(`server is listening on ${port}`);
});