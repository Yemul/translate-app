const fs = require("fs");
const path = require("path");
const express = require("express");

const app = express();
const port = 8080;

const server = require("http").Server(app);
const io = require("socket.io")(server);

const targets = ["fr", "zh", "ja"];

// Imports the Google Cloud client library
const textToSpeech = require("@google-cloud/text-to-speech");
const { Translate } = require('@google-cloud/translate').v2;

const translate = new Translate({ projectId: "" });

// Creates a client
const client = new textToSpeech.TextToSpeechClient();


async function performTranslation(text, target, onFinished) {
    const [translation] = await translate.translate(text, target);
    onFinished(translation)
}

function targetToLanguageCode(target) {
    let languageCode;
    switch (target) {
        case "fr":
            languageCode = "fr-FR";
            break;
        case "cn":
            languageCode = "cmn-CN";
            break;
        case "ja":
            languageCode = "ja-JP";
            break;
        default:
            languageCode = "en-US";
            break;
    }
    return languageCode;
}

function toSpeech(text, languageCode, socketId, completion) {
    // Construct the request
    const request = {
        input: { text: text },
        // Select the language and SSML Voice Gender (optional)
        voice: { languageCode: languageCode, ssmlGender: "NEUTRAL" },
        // Select the type of audio encoding
        audioConfig: { audioEncoding: "MP3" },
    };

    // Performs the Text-to-Speech request
    client.synthesizeSpeech(request, (err, response) => {
        if (err) {
            console.error("ERROR:", err);
            return;
        }

        // Write the binary audio content to a local file
        fs.writeFile(path.join(__dirname, `mp3/${socketId}.mp3`), response.audioContent, "binary", err => {
            if (err) {
                console.error("ERROR:", err);
                return;
            }
            console.log(`Audio content written to file: ${socketId}.mp3`);
            completion(`${socketId}.mp3`);
        });
    });
}


app.use("/", express.static(path.join(__dirname, "dist/translate")));
app.use("/", express.static(path.join(__dirname, "mp3")));

io.on("connection", socket => {
    console.log("new connection made from client with ID=" + socket.id);
    socket.emit("targets", { targets: targets });

    socket.on("newText", req => {
        const target = req.target;
        const text = req.text;
        performTranslation(text, target, ((translation) => {
            socket.emit("translation", translation);
            toSpeech(translation, targetToLanguageCode(target), socket.id, ((fileName) => {
                socket.emit("mp3", fileName);
            }));
        }))
    });
});

server.listen(port, () => {
    console.log("Server Listening on Port " + port);
});
