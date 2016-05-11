# Range server

Range server side functionality supporting Twilio and SendGrid features.

## Configuration

Create the appropiate configuration JSON file depending on your ```NODE_ENV``` and override default values in ```config/default.json```.

## REST

```GET /sms/reply```: Twilio will send this message if a user reply to a text message received from Range

```POST /share/sms```: Send a text massage share from Range

Request body: 
```json
{
    "To": "+1234567890",
    "Body": "Text message content"
}
```

```POST /share/mail```: Send an email share from Range

Request body: 
```json
{
    "to": "test@mail.com",
    "html": "HTML message content"
}
```

```POST /contactus```: Send contact us email

Request body: 
```json
{
    "from": "test@mail.com",
    "subject": "Feedback",
    "text": "Contact us message content"
}
```

```GET /popup```: Get popup message content from server