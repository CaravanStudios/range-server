const config = require("config");
const appInsights = require("applicationinsights");

module.exports = function(){
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
  ] = ("app.name");

  appInsights.start();
}