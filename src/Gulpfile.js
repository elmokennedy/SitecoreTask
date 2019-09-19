var gulp = require("gulp");
var msbuild = require("gulp-msbuild");
var debug = require("gulp-debug");
var foreach = require("gulp-foreach");
var rename = require("gulp-rename");
var watch = require("gulp-watch");
var merge = require("merge-stream");
var newer = require("gulp-newer");
var util = require("gulp-util");
var runSequence = require("run-sequence");
var path = require("path");
var config = require("./gulp-config.js")();
var nugetRestore = require('gulp-nuget-restore');
var fs = require('fs');
var unicorn = require("./scripts/unicorn.js");
var habitat = require("./scripts/habitat.js");
var yargs = require("yargs").argv;
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var rigger = require('gulp-rigger');
var concat = require('gulp-concat');

module.exports.config = config;

gulp.task("default", function (callback) {
  config.runCleanBuilds = true;
  return runSequence(
    "01-Copy-Sitecore-License",
    "02-Nuget-Restore",
    "03-Compile-Scss",
    "04-Collect-Js",
    "05-Publish-All-Projects",
    "06-Apply-Xml-Transform",
    "07-Sync-Unicorn",
    "08-Deploy-Transforms",
	callback);
});

/*****************************
  Initial setup
*****************************/
gulp.task("01-Copy-Sitecore-License", function () {
  console.log("Copying Sitecore License file");

  return gulp.src(config.licensePath).pipe(gulp.dest("./lib"));
});

gulp.task("02-Nuget-Restore", function (callback) {
  var solution = "./" + config.solutionName + ".sln";
  return gulp.src(solution).pipe(nugetRestore());
});

gulp.task("03-Compile-Scss", function () {
    gulp.src("./Foundation/Theming/code/scss/*.scss")
        .pipe(sourcemaps.init())
		.pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.write())
        .pipe(autoprefixer(['last 2 version']))
		.pipe(minifyCss({ compatibility: 'ie9' }))
		.pipe(gulp.dest("./Foundation/Theming/code/css/"))
});

gulp.task("04-Collect-Js", function () {
    gulp.src(["./Project/MHS/code/js/!(client-main)*.js", "./Project/MHS/code/js/client-main.js"])
        .pipe(concat('main.js'))
        .pipe(uglify('main.js'))
		.pipe(gulp.dest("./Project/MHS/code/scripts/"))
});

gulp.task("05-Publish-All-Projects", function (callback) {
  return runSequence(
    "Build-Solution",
    "Publish-Foundation-Projects",
    "Publish-Feature-Projects",
    "Publish-Project-Projects", callback);
});

gulp.task("06-Apply-Xml-Transform", function () {
  var layerPathFilters = ["./Foundation/**/*.transform", "./Feature/**/*.transform", "./Project/**/*.transform", "!./**/obj/**/*.transform", "!./**/bin/**/*.transform"];
  return gulp.src(layerPathFilters)
    .pipe(foreach(function (stream, file) {
      var fileToTransform = file.path.replace(/.+code\\(.+)\.transform/, "$1");
      util.log("Applying configuration transform: " + file.path);
      return gulp.src("./scripts/applytransform.targets")
        .pipe(msbuild({
          targets: ["ApplyTransform"],
          configuration: config.buildConfiguration,
          logCommand: false,
          verbosity: "minimal",
          stdout: true,
          errorOnFail: true,
          maxcpucount: 0,
          toolsVersion: 14.0,
          properties: {
            WebConfigToTransform: config.websiteRoot,
            TransformFile: file.path,
            FileToTransform: fileToTransform
          }
        }));
    }));
});

gulp.task("07-Sync-Unicorn", function (callback) {
  var options = {};
  options.siteHostName = habitat.getSiteUrl();
  options.authenticationConfigFile = config.websiteRoot + "/App_config/Include/Unicorn/Unicorn.UI.config";

  unicorn(function() { return callback() }, options);
});


gulp.task("08-Deploy-Transforms", function () {
  return gulp.src("./**/code/**/*.transform")
      .pipe(gulp.dest(config.websiteRoot + "/temp/transforms"));
});

/*****************************
  Copy assemblies to all local projects
*****************************/
gulp.task("Copy-Local-Assemblies", function () {
  console.log("Copying site assemblies to all local projects");
  var files = config.sitecoreLibraries + "/**/*";

  var root = "./";
  var projects = root + "/**/code/bin";
  return gulp.src(projects, { base: root })
    .pipe(foreach(function (stream, file) {
      console.log("copying to " + file.path);
      gulp.src(files)
        .pipe(gulp.dest(file.path));
      return stream;
    }));
});

/*****************************
  Publish
*****************************/
var publishStream = function (stream, dest) {
  var targets = ["Build"];

  return stream
    .pipe(debug({ title: "Building project:" }))
    .pipe(msbuild({
      targets: targets,
      configuration: config.buildConfiguration,
      logCommand: false,
      verbosity: "minimal",
      stdout: true,
      errorOnFail: true,
      maxcpucount: 0,
      toolsVersion: 14.0,
      properties: {
        DeployOnBuild: "true",
        DeployDefaultTarget: "WebPublish",
        WebPublishMethod: "FileSystem",
        DeleteExistingFiles: "false",
        publishUrl: dest,
        _FindDependencies: "false"
      }
    }));
}

var publishProject = function (location, dest) {
  dest = dest || config.websiteRoot;

  console.log("publish to " + dest + " folder");
  return gulp.src(["./" + location + "/code/*.csproj"])
    .pipe(foreach(function (stream, file) {
      return publishStream(stream, dest);
    }));
}

var publishProjects = function (location, dest) {
  dest = dest || config.websiteRoot;

  console.log("publish to " + dest + " folder");
  return gulp.src([location + "/**/code/*.csproj"])
    .pipe(foreach(function (stream, file) {
      return publishStream(stream, dest);
    }));
};

gulp.task("Build-Solution", function () {
  var targets = ["Build"];
  if (config.runCleanBuilds) {
    targets = ["Clean", "Build"];
  }
  var solution = "./" + config.solutionName + ".sln";
  return gulp.src(solution)
      .pipe(msbuild({
          targets: targets,
          configuration: config.buildConfiguration,
          logCommand: false,
          verbosity: "minimal",
          stdout: true,
          errorOnFail: true,
          maxcpucount: 0,
          toolsVersion: 14.0
        }));
});

gulp.task("Publish-Foundation-Projects", function () {
  return publishProjects("./Foundation");
});

gulp.task("Publish-Feature-Projects", function () {
  return publishProjects("./Feature");
});

gulp.task("Publish-Project-Projects", function () {
  return publishProjects("./Project");
});

gulp.task("Publish-Project", function () {
  if(yargs && yargs.m && typeof(yargs.m) == 'string') {
    return publishProject(yargs.m);
  } else {
    throw "\n\n------\n USAGE: -m Layer/Module \n------\n\n";
  }
});

gulp.task("Publish-Assemblies", function () {
  var root = "./";
  var binFiles = root + "/**/code/**/bin/Sitecore.{Feature,Foundation,Habitat}.*.{dll,pdb}";
  var destination = config.websiteRoot + "/bin/";
  return gulp.src(binFiles, { base: root })
    .pipe(rename({ dirname: "" }))
    .pipe(newer(destination))
    .pipe(debug({ title: "Copying " }))
    .pipe(gulp.dest(destination));
});

gulp.task("Publish-All-Views", function () {
  var root = "./";
  var roots = [root + "/**/Views", "!" + root + "/**/obj/**/Views"];
  var files = "/**/*.cshtml";
  var destination = config.websiteRoot + "\\Views";
  return gulp.src(roots, { base: root }).pipe(
    foreach(function (stream, file) {
      console.log("Publishing from " + file.path);
      gulp.src(file.path + files, { base: file.path })
        .pipe(newer(destination))
        .pipe(debug({ title: "Copying " }))
        .pipe(gulp.dest(destination));
      return stream;
    })
  );
});

gulp.task("Publish-All-Configs", function () {
  var root = "./";
  var roots = [root + "/**/App_Config", "!" + root + "/**/obj/**/App_Config"];
  var files = "/**/*.config";
  var destination = config.websiteRoot + "\\App_Config";
  return gulp.src(roots, { base: root }).pipe(
    foreach(function (stream, file) {
      console.log("Publishing from " + file.path);
      gulp.src(file.path + files, { base: file.path })
        .pipe(newer(destination))
        .pipe(debug({ title: "Copying " }))
        .pipe(gulp.dest(destination));
      return stream;
    })
  );
});

/*****************************
 Watchers
*****************************/
gulp.task("Auto-Publish-Css", function () {
  var root = "./";
  var roots = [root + "/**/styles", "!" + root + "/**/obj/**/styles"];
  var files = "/**/*.css";
  var destination = config.websiteRoot + "\\styles";
  gulp.src(roots, { base: root }).pipe(
    foreach(function (stream, rootFolder) {
      gulp.watch(rootFolder.path + files, function (event) {
        if (event.type === "changed") {
          console.log("publish this file " + event.path);
          gulp.src(event.path, { base: rootFolder.path }).pipe(gulp.dest(destination));
        }
        console.log("published " + event.path);
      });
      return stream;
    })
  );
});

gulp.task("Auto-Publish-Views", function () {
  var root = "./";
  var roots = [root + "/**/Views", "!" + root + "/**/obj/**/Views"];
  var files = "/**/*.cshtml";
  var destination = config.websiteRoot + "\\Views";
  gulp.src(roots, { base: root }).pipe(
    foreach(function (stream, rootFolder) {
      gulp.watch(rootFolder.path + files, function (event) {
        if (event.type === "changed") {
          console.log("publish this file " + event.path);
          gulp.src(event.path, { base: rootFolder.path }).pipe(gulp.dest(destination));
        }
        console.log("published " + event.path);
      });
      return stream;
    })
  );
});

gulp.task("Auto-Publish-Assemblies", function () {
  var root = "./";
  var roots = [root + "/**/code/**/bin"];
  var files = "/**/Sitecore.{Feature,Foundation,Habitat}.*.{dll,pdb}";;
  var destination = config.websiteRoot + "/bin/";
  gulp.src(roots, { base: root }).pipe(
    foreach(function (stream, rootFolder) {
      gulp.watch(rootFolder.path + files, function (event) {
        if (event.type === "changed") {
          console.log("publish this file " + event.path);
          gulp.src(event.path, { base: rootFolder.path }).pipe(gulp.dest(destination));
        }
        console.log("published " + event.path);
      });
      return stream;
    })
  );
});