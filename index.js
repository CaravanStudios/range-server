const config = require("config");
const request = require("request");
const express = require("express");
const bodyParser = require("body-parser");
const appInsights = require("applicationinsights");
const {
  createProxyMiddleware,
  responseInterceptor
} = require("http-proxy-middleware");

if (config.get("appInsightInstrumentKey")) {
  appInsights
    .setup(config.get("appInsightInstrumentKey"))
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true)
    .setAutoDependencyCorrelation(true)
    .setUseDiskRetryCaching(true);

  appInsights.defaultClient.context.tags[
    appInsights.defaultClient.context.keys.cloudRole
  ] = config.get("app.name");

  appInsights.defaultClient.addTelemetryProcessor(function (envelope, context) {
    if (envelope.data.baseType === "RequestData") {
      const data = envelope.data.baseData;
      console.log(data);
      if (
        data.url &&
        (data.url.includes("healthcheck") || data.url.includes("robots933456"))
      ) {
        return false;
      }
    }
    return true;
  });

  appInsights.start();
}

const sendgrid = config.get("sendgrid");
const twilio = config.get("twilio");
const shareMail = config.get("shareMail");
const contactUs = config.get("contactUs");
const popupMsg = config.get("popupMsg");

const app = express();

app.use("/healthcheck", (req, res) => {
  res.send({ status: "ok" });
});

app.get("/", (req, res) => {
  //azure healthcheck
  res.status(200).send("OK");
});

app.get("/robots933456.txt", (req, res) => {
  //azure healthcheck
  res.status(200).send("OK");
});

app.use(require("cors")());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.use("/sms/reply", function (req, res) {
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?><Response><Sms>' +
    twilio.reply +
    "</Sms></Response>";
  res.status(200).header("Content-Type", "text/xml").send(xml);
});

app.post("/share/sms", function (req, res) {
  request(
    {
      url: twilio.url,
      method: "POST",
      auth: {
        username: twilio.username,
        password: twilio.password
      },
      form: {
        From: twilio.from,
        To: req.body.To,
        Body: req.body.Body
      }
    },
    function (err, response, body) {
      if (err) {
        res.status(500).send();
      } else {
        res.status(200).send();
      }
    }
  );
});

app.post("/share/mail", function (req, res) {
  request(
    {
      url: sendgrid.unsubscribes,
      qs: {
        email: req.body.to
      },
      headers: {
        Authorization: "Bearer " + sendgrid.apiKey
      }
    },
    function (err, response, body) {
      if (err) {
        res.status(500).send();
      } else {
        var data = JSON.parse(body);
        if (data.length > 0) {
          res.status(500).send("Email address unsubscribed");
        } else {
          request(
            {
              url: sendgrid.mail,
              qs: {
                to: req.body.to,
                subject: shareMail.subject,
                html: req.body.html,
                from: shareMail.from,
                fromname: "Range",
                "x-smtpapi": JSON.stringify({
                  filters: {
                    templates: {
                      settings: {
                        enable: 1,
                        template_id: shareMail.template_id
                      }
                    }
                  },
                  category: [sendgrid.category]
                })
              },
              headers: {
                Authorization: "Bearer " + sendgrid.apiKey
              }
            },
            function (err, response, body) {
              if (err) {
                res.status(500).send();
              } else {
                res.status(200).send(body);
              }
            }
          );
        }
      }
    }
  );
});

app.post("/contactus", function (req, res) {
  request(
    {
      url: sendgrid.unsubscribes,
      qs: {
        email: req.body.from,
        categories: [sendgrid.category]
      },
      headers: {
        Authorization: "Bearer " + sendgrid.apiKey
      }
    },
    function (err, response, body) {
      if (err) {
        res.status(500).send();
      } else {
        var data = JSON.parse(body);
        if (data.length > 0) {
          res.status(500).send("Email address unsubscribed");
        } else {
          request(
            {
              url: sendgrid.mail,
              qs: {
                to: contactUs.to,
                bcc: req.body.from,
                subject: req.body.subject,
                html: req.body.text,
                from: req.body.from,
                "x-smtpapi": JSON.stringify({
                  category: [sendgrid.category]
                })
              },
              headers: {
                Authorization: "Bearer " + sendgrid.apiKey
              }
            },
            function (err, response, body) {
              if (err) {
                res.status(500).send();
              } else {
                res.status(200).send(body);
              }
            }
          );
        }
      }
    }
  );
});

app.get("/popup", function (req, res) {
  res.status(200).send(popupMsg);
});

const proxyMiddleware = (target, pathRewrite) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    selfHandleResponse: true,
    onProxyRes: responseInterceptor(async (responseBuffer, proxyRes) => {
      if (!proxyRes.headers["content-type"]?.includes("application/json"))
        return responseBuffer;

      const originalResponse = JSON.parse(responseBuffer.toString("utf8"));

      const modifiedResponse = originalResponse.map(item => {
        if (!item.coordinates?.coordinates) return item;

        const {
          coordinates: {
            coordinates: [longitude, latitude]
          }
        } = item;

        return {
          ...item,
          coordinates: {
            latitude,
            longitude
          }
        };
      });

      return JSON.stringify(modifiedResponse);
    })
  });

app.use("/food", proxyMiddleware(config.get("foodUrl"), { "^/food": "" }));

app.use(
  "/library",
  proxyMiddleware(config.get("libraryUrl"), { "^/library": "" })
);

app.use(express.static("./public"));

app.listen(process.env.port || 8787);
console.log("Running on port", process.env.port || 8787);
