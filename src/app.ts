import express from 'express';
import {EUploadMimeType, TwitterApi, TwitterApiTokens} from "twitter-api-v2";
import 'websocket-polyfill'
import bodyParser from "body-parser";
import {ImgurClient} from "imgur";

require('dotenv').config()

const app = express();
const port = Number(process.env.PORT) || 3333;

app.use(bodyParser.text({limit: '20mb'}));

app.get('/twitter/auth', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://nostrwitter.onrender.com')

    const client = new TwitterApi({ clientId: process.env.CLIENT_ID, clientSecret: process.env.CLIENT_SECRET });
    const { url, codeVerifier, state } = client.generateOAuth2AuthLink('https://nostrwitter.onrender.com', { scope: ['tweet.write', 'tweet.read', 'users.read', 'offline.access'] })

    res.send({url: url, codeVerifier: codeVerifier});
});

app.post('/twitter/tweet', (req: any, res) => {
    const {code, codeVerifier, post, imageBase64} = JSON.parse(req.body);

    const client = new TwitterApi({ clientId: process.env.CLIENT_ID, clientSecret: process.env.CLIENT_SECRET });

    res.setHeader('Access-Control-Allow-Origin', 'https://nostrwitter.onrender.com')

    client.loginWithOAuth2({ code, codeVerifier, redirectUri: 'https://nostrwitter.onrender.com' }).then(r => {
        if(imageBase64){
            let imageType = undefined

            if(imageBase64.includes("jpeg") || imageBase64.includes("jpg")){
                imageType = EUploadMimeType.Jpeg
            } else if (imageBase64.includes("png")){
                imageType = EUploadMimeType.Png
            } else if (imageBase64.includes("gif")){
                imageType = EUploadMimeType.Gif
            }

            const imageBase64Content = imageBase64.split(",")[1]

            r.client.v1.uploadMedia(Buffer.from(imageBase64Content, 'base64'), {mimeType: imageType}).then(mediaId =>
                r.client.v2.tweet({text: post, media: {media_ids: [mediaId]}}).then(r => res.send(r.data), error => res.send(error))
            ).catch(r => res.send(r))
        }else{
            r.client.v2.tweet({text: post}).then(r => res.send(r.data), error => res.send(error));
        }
    }, error => res.send(error))
});

app.get('/ping', (req: any, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://nostrwitter.onrender.com')
    res.send('pong!')
})

app.post('/imgur/upload', (req: any, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://nostrwitter.onrender.com')
    const imgurClient = new ImgurClient({ clientId: 'bfd3861f722121a'/*process.env.IMGUR_CLIENT_ID*/ });

    const {imageBase64} = JSON.parse(req.body);

    imgurClient.upload({image: imageBase64, type: "base64"})
        .then((r) => res.send(r.data.link))
        .catch(e => {
                console.log(e)
                res.send("error")
            }
        )
})

app.listen(port, '0.0.0.0',0,() => {
     console.log(`server is listening on ${port}`);
});
