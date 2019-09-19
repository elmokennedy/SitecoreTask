module.exports = function () {
    /* Path to the IIS site root */
    var instanceRoot = "c:\\interpub\\wwwroot\\starter";
  var config = {
    websiteRoot: instanceRoot + "\\Website",
    sitecoreLibraries: instanceRoot + "\\Website\\bin",
    licensePath: instanceRoot + "\\Data\\license.xml",
    solutionName: "Starter",
    buildConfiguration: "Debug",
	buildPlatform: "Any CPU",
    publishPlatform: "AnyCpu",
    runCleanBuilds: false
  };
  return config;
}