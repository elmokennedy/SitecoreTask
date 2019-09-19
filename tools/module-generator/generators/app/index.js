'use strict';
var generators = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');
var path = require('path');
var mkdirp = require('mkdirp');
var rename = require('gulp-rename');
var msg = require('../../config/messages.json');
var versions = require('../../config/versions.json');
var unicornIds = require('../../config/unicornIds.json');
var serialisationProviders = require('../../config/serialisationProviders.json');
var moduleTypes = require('../../config/moduleTypes.json');
var shell = require('node-powershell');
var utils = require('../../lib/utils.js');
var props = require('../../config/props.json');
var settings = require('../../config/projectsettings.json');
var uuid = require('node-uuid');
var sleep = require('system-sleep');

module.exports = class extends generators.Base {
    constructor(args, opts) {
        // Calling the super constructor is important so our generator is correctly set up
        super(args, opts);
		
		this.option('solutionName', { type: String, required: false, desc: 'The name of the solution.' });
		this.option('moduleType', { type: String, required: false, desc: 'The type of the module (Foundation|Feature|Project).' });
		this.option('moduleName', { type: String, required: false, desc: 'The name of the module.' });
		this.option('serialisationProvider', { type: String, required: false, desc: 'The provider used to serialize sitecore items. Possible values are \"Unicorn\", \"TDS\"' });
		this.options.appConfigInclude = "";
		this.options.modelGeneration = "";
		this.options.itemGroup = "";
		this.options.packages = "";
		this.options.projectReferencesX = "";
		this.options.unicornSerializationPredicatesX = "";
		
		this.option('sitecoreVersion', { type: String, required: false, desc: 'The version of sitecore to use.' });
		
		var solutionSettings;
		
		try {
			solutionSettings = require(this.destinationPath('SolutionSettings.json'));
		}
		catch(ex){
			
		}
		
		if (solutionSettings && solutionSettings.solutionName)
		{
			this.options.solutionName = solutionSettings.solutionName;
		}
		
		if (solutionSettings && solutionSettings.serialisationProvider)
		{
			this.options.serialisationProvider = solutionSettings.serialisationProvider;
		}
		
		if (solutionSettings && solutionSettings.sitecoreVersion)
		{
			this.options.sitecoreVersion = solutionSettings.sitecoreVersion;
		}
		
		if (this.options.sitecoreVersion == 'latest') {
			this.options.sitecoreVersion = versions[0];
		}
		
		versions.forEach((version) => {
			if (this.options.sitecoreVersion == version.name)
			{
				this.options.sitecoreVersion = version;
				return;
			}
		});
		
		this.option('sitecoreUpdate', { type: String, required: false, desc: 'The version of sitecore to use.' });
		
		if (solutionSettings && solutionSettings.sitecoreUpdate)
		{
			this.options.sitecoreUpdate = solutionSettings.sitecoreUpdate;
		}
		
		if (this.options.sitecoreUpdate == 'latest')
		{
			this.options.sitecoreUpdate = this.options.sitecoreVersion.value[0];
		}
		
		if (this.options.sitecoreVersion && this.options.sitecoreVersion.value) {
			this.options.sitecoreVersion.value.forEach((update) => {
				if (this.options.sitecoreUpdate == update.name)
				{
					this.options.sitecoreUpdate = update;
					return;
				}
			});
		}
    }
	
	addAppConfigInclude(file) {
		if (!file) {
			return;
		}
		this.options.appConfigInclude += "\r\n\t<Content Include=\"" + file + "\"/>";
	}
	
	addSerializationPredicate(name, database, path) {
		if (!name || !database || !path) {
			return;
		}
		this.options.unicornSerializationPredicatesX += "\r\n\t\t\t\t\t\t<include name=\"" + name + "\" database=\"" + database + "\" path=\"" + path + "\" />";
	}
	
	prompting() {
		var self = this;
		return self.prompt([{
			name: 'solutionName',
			message: msg.solutionName.prompt,
			default: self.appname,
			when : !self.options.solutionName
		},
		{
			type: 'list',
			name: 'moduleType',
			message: msg.moduleType.prompt,
			default: props.moduleType,
			choices: moduleTypes,
			when: !self.options.moduleType
		},
		{
			name: 'moduleName',
			message: msg.moduleName.prompt,
			default: props.moduleName,
			when: !self.options.moduleName
		},
		{
			type: 'list',
			name: 'serialisationProvider',
			message: msg.serialisationProvider.prompt,
			default: props.serialisationProvider,
			choices: serialisationProviders,
			when: !self.options.serialisationProvider
		},
		{
			type: 'list',
			name: 'sitecoreVersion',
			message: msg.sitecoreVersion.prompt,
			default: self.options.sitecoreVersion,
			choices: versions,
			when: !self.options.sitecoreVersion
		}]).then(function (answers) {
			self.options = Object.assign({}, self.options, answers);
			
			self.options.guidSeed = self.options.solutionName + '.' + self.options.moduleType + '.' + self.options.moduleName;
			
			self.options.codeGuid = utils.guid(self.options.guidSeed);
			
			if (self.options.serialisationProvider == "TDS")
			{
				self.options.tdsCoreGuid = utils.guid(self.options.guidSeed + '.Core')
				self.options.tdsMasterGuid = utils.guid(self.options.guidSeed + '.Master')
				
				if (self.options.moduleType == 'Project')
				{
					self.options.tdsContentGuid = utils.guid(self.options.guidSeed + '.Content')
				}
				self.options.modelGeneration = '\t<Compile Include="Models.Generated.cs" />';
			}
			else
			{
				self.addAppConfigInclude("App_Config\\Include\\" + self.options.moduleType + "\\" + self.options.solutionName + "." + self.options.moduleType + "." + self.options.moduleName + ".Serialization.config");
				self.options.modelGeneration += '\r\n\t<Compile Include="Models.Generated.cs">\r\n\t\t<DependentUpon>SitecoreTemplates.tt</DependentUpon>\r\n\t\t<AutoGen>True</AutoGen>\r\n\t\t<DesignTime>True</DesignTime>\r\n\t</Compile>';
				self.options.itemGroup += '\r\n\t<ItemGroup>\r\n\t\t<None Include="SitecoreTemplates.tt">\r\n\t\t<Generator>TextTemplatingFileGenerator</Generator>\r\n\t\t<LastGenOutput>Models.Generated.cs</LastGenOutput>\r\n\t\t</None>\r\n\t</ItemGroup>';
				self.options.packages += '\r\n\t<package id="Rainbow.Core" version="2.0.0" targetFramework="net452" />\r\n\t<package id="Rainbow.Storage.Yaml" version="2.0.0" targetFramework="net452" />\r\n\t<package id="RainbowCodeGeneration" version="0.2.0" targetFramework="net452" />';
				self.options.projectReferencesX = '\r\n\t<Reference Include="Rainbow">\r\n\t\t<HintPath>..\\..\\..\\packages\\Rainbow.Core.2.0.0\\lib\\net452\\Rainbow.dll</HintPath>\r\n\t\t<Private>True</Private>\r\n\t</Reference>\r\n\t<Reference Include="Rainbow.Storage.Yaml">\r\n\t\t<HintPath>..\\..\\..\\packages\\Rainbow.Storage.Yaml.2.0.0\\lib\\net452\\Rainbow.Storage.Yaml.dll</HintPath>\r\n\t\t<Private>True</Private>\r\n\t</Reference>\r\n\t<Reference Include="RainbowCodeGeneration">\r\n\t\t<HintPath>..\\..\\..\\packages\\RainbowCodeGeneration.0.2.0\\lib\\net452\\RainbowCodeGeneration.dll</HintPath>\r\n\t\t<Private>True</Private>\r\n\t</Reference>';
				
				var predicatePrefix = self.options.moduleType + '.' + self.options.moduleName + '.';
				var predicatePathPostfix = '/' + self.options.solutionName + '/' + self.options.moduleType + '/' + self.options.moduleName;
				
				if (self.options.moduleType == 'Foundation') {
					self.addSerializationPredicate(predicatePrefix + 'Branches', 'master', '/sitecore/templates/branches' + predicatePathPostfix);
				} else if (self.options.moduleType == 'Project' || self.options.moduleType == 'Feature') {
					self.addSerializationPredicate(predicatePrefix + 'Media', 'master', '/sitecore/media library' + predicatePathPostfix);
				}
				
			}
			
			return self.prompt([{
				type: 'list',
				name: 'sitecoreUpdate',
				message: msg.sitecoreUpdate.prompt,
				choices: self.options.sitecoreVersion.value ? self.options.sitecoreVersion.value : self.options.sitecoreVersion,
				when: !self.options.sitecoreUpdate
		}])
		}).then(function (answers) {
			self.options = Object.assign({}, self.options, answers);

			// Nuget version update
			self.options.nuget = [{
					old: '8.2 rev. 160729',
					new: (self.options.sitecoreUpdate.value ? self.options.sitecoreUpdate.value : self.options.sitecoreUpdate).installVersion
				},
				{
					old: '8.2.160729',
					new: (self.options.sitecoreUpdate.value ? self.options.sitecoreUpdate.value : self.options.sitecoreUpdate).nugetVersion
				}
			]

			self.async();
		});
}

    replaceTokens(input) {
        if (typeof input === 'undefined') {
            return input;
        }
		
        return input.toString().replace(/(SolutionX|NewProject)/g, this.options.solutionName).replace(/(ModuleTypeX)/g, this.options.moduleType).replace(/(ModuleNameX)/g, this.options.moduleName);
    }

	writing() {
		var self = this;

		// Rename files
		self.registerTransformStream(rename(function (path) {
			path.basename = self.replaceTokens(path.basename);
			path.dirname = self.replaceTokens(path.dirname);
		}));

		var ignoreOptions = [
						// src/server
						'**/src/**/*.csproj',
						'**/src/**/*.csproj.*',
						'**/src/**/*.scproj',
						'**/src/*.sln',

						// completly ignore
						'**/src/**/bin',
						'**/src/**/obj',
						'**/src/packages',

						// TDS
						'**/*.item',
						'**/*.tt',

						// src/client
						'**/src/**/node_modules',
						'**/src/**/bower_components',

						// environment
						'**/env/template/config*.json',
						'**/env/modules/**/*',

						// output folders
						'**/*build/*',

						// .git
						'**/.git',
						'**/.git/*',
						
						// serialization
						'**/src/**/serialization/**',
					];
					
		if (self.options.serialisationProvider == "TDS") {
			ignoreOptions.push('**/src/**/code/**/*Unicorn.config');
		}
		
		self.fs.copy(
			self.templatePath('**/*.*'),
			self.destinationPath(), {
				globOptions: {
					ignore: ignoreOptions
				},
				process: function (content) {
					var result = self.replaceTokens(content)
					
					// Replace sitecore version
					self.options.nuget.forEach((id) => {
						result = result
							.replace(new RegExp(utils.escapeRegExp(id.old), 'g'), id.new)
					});
					
					result = result.replace(/(PackagesX)/g, self.options.packages);
					result = result.replace(/(UnicornSerializationPredicatesX)/g, self.options.unicornSerializationPredicatesX);
					
					return result;
				}
			});

		// Visual Studio project files
		self.fs.copy(
			self.templatePath('src/**/*.{*csproj,*csproj.*}'),
			self.destinationPath('src/'), {
				process: function (content) {
					var result = self.replaceTokens(content)

					// Replace sitecore version
					self.options.nuget.forEach((id) => {
						result = result
							.replace(new RegExp(utils.escapeRegExp(id.old), 'g'), id.new)
					});
					
					result = result.replace(/(AppConfigIncludeX)/g, self.options.appConfigInclude);
					result = result.replace(/(ModelGenerationX)/g, self.options.modelGeneration);
					result = result.replace(/(ItemGroupX)/g, self.options.itemGroup);
					result = result.replace(/(ProjectReferencesX)/g, self.options.projectReferencesX);

					return result;
				}
			});
			
		if (self.options.serialisationProvider == "TDS")
		{
			self.fs.copy(
				self.templatePath('src/**/serialization/**/*readme.md'),
				self.destinationPath('src/'), {
					process: function (content) {
						return self.replaceTokens(content);
						}
					}
				);
			
			var globOptions;
			
			if (self.options.moduleType != 'Project') {
				globOptions = {
					ignore: [
						// serialization
						'**/src/**/serialization/Content/**'
					]
				}
			}
			
			self.fs.copy(
				self.templatePath('src/**/serialization/**/*.{*scproj,*config,*xml}'),
				self.destinationPath('src/'), {
					globOptions: globOptions,
					process: function (content) {
						var result = self.replaceTokens(content)

						// Replace sitecore version
						self.options.nuget.forEach((id) => {
							result = result
								.replace(new RegExp(utils.escapeRegExp(id.old), 'g'), id.new)
						});
						
						result = result.replace(new RegExp('d9d50a5c-26fe-4cb2-94fe-e15dd3a8a4c7', 'g'), self.options.codeGuid);

						if (self.options.moduleType == 'Project')
						{
							result = result.replace(/(TDSContentProjectGuidX)/g, self.options.tdsContentGuid);
						}
						else
						{
							result = result.replace(/(TDSMasterProjectGuidX)/g, self.options.tdsMasterGuid);
							result = result.replace(/(TDSCoreProjectGuidX)/g, self.options.tdsCoreGuid);
							
						}

						return result;
					}
				});
			
			self.fs.copy(
				self.templatePath('src/**/serialization/**/*.tt'),
				self.destinationPath('src/'), {
					globOptions: globOptions,
					process: function (content) {
						var re = new RegExp(/D:\\\.projects\\Epam/, 'gi');

						var result = self.replaceTokens(content)
							.replace(re, self.destinationRoot());

						return result;
					}
				});

			
			self.fs.copy(
				self.templatePath('src/**/*.item'),
				self.destinationPath('src/'), {
					globOptions: globOptions,
					process: function (content) {
						var item = self.replaceTokens(content)

						var re = /field(?:(?:.*?\r\n){3})content-length: (\d+)\r\n\r\n(.*(?:(?:\r\n|\n).*)*?)\r\n(?=----field----|----version----|$)/ig
						item.match(re)
							.forEach(function (match) {
								var length = parseInt(match.replace(re, '$1'))
								var content = match.replace(re, '$2')

								if (length !== content.length) {
									var replacement = match.replace('content-length: ' + length, 'content-length: ' + content.length);
									item = item.replace(match, replacement);
								}
							})

						return item;
					}
				});
				
		}
		else
		{
			var ignoreOptions = [];
			
			if (self.options.moduleType == 'Project' || self.options.moduleType == 'Feature') {
				ignoreOptions.push('src/**/serialization/ModuleTypeX.ModuleNameX.Branches/**');
			} else if (self.options.moduleType == 'Foundation') {
				ignoreOptions.push('src/**/serialization/ModuleTypeX.ModuleNameX.Media/**');
			}
			
			self.fs.copy(
				self.templatePath('src/**/serialization/ModuleTypeX.ModuleNameX.*/**'),
				self.destinationPath('src/'), {
					globOptions: {
						ignore: ignoreOptions
					},
					process: function (content) {
						var result = self.replaceTokens(content)
						.replace(new RegExp(/ID: "(.*)"/), "ID: \"" + utils.guid() + "\"" );
						console.log(unicornIds[self.options.moduleType]);
						unicornIds[self.options.moduleType].forEach((item) => {
							result = result.replace(new RegExp('Unicorn' + item.name + 'ParentX', 'g'), item.id);
						});
						
						return result;
					}
				});
				
			self.fs.copy(
				self.templatePath('**/*.tt'),
				self.destinationPath(), {
					globOptions: {
						ignore: [
							'**/src/**/serialization/**'
						]
					},
					process: function (content) {
						var re = new RegExp(/D:\\\.projects\\Epam/, 'gi');

						var result = self.replaceTokens(content)
							.replace(re, self.destinationRoot());
							
						// Replace sitecore version
						self.options.nuget.forEach((id) => {
							result = result
								.replace(new RegExp(utils.escapeRegExp(id.old), 'g'), id.new)
						});

						return result;
					}
				});
		}
	}
	end() {
		var self = this;

		var projectFolder = uuid.v4();
		var destinationPath = this.destinationPath();
		var sourceRoot = this._sourceRoot;
		 
		// Add the main code project
		console.log(self.options.codeGuid);
		utils.addProject(self.options.solutionName, self.options.moduleName, projectFolder, 
									settings.codeproject, settings.codeprojectextension, self.options.codeGuid, settings.codeprojectFolder, 
									self.options.moduleType, settings.codeprefixExtension, destinationPath, sourceRoot, 1);

		// sleep to avoid file writing conflicts
		sleep(2000);
		console.log(chalk.yellow.bold('Successfully added code project'));
		
		

		// Add the test project
		utils.addProject(self.options.solutionName, self.options.moduleName, projectFolder, 
									settings.codeproject, settings.codeprojectextension, utils.guid(self.options.guidSeed + '.Tests'), settings.testcodeprojectFolder, 
									self.options.moduleType, settings.testprefixExtension, destinationPath, sourceRoot, 0);

		// sleep to avoid file writing conflicts
		sleep(2000);
		console.log(chalk.yellow.bold('Successfully added Test project'));     
	 
		if (self.options.serialisationProvider == "TDS")
		{
			// sleep to avoid file writing conflicts
			sleep(2000);
			
			var tdsProjectMasterFolder = "serialization\\Master";
			var tdsProjectCoreFolder = "serialization\\Core";
			var tdsProjectContentFolder = "serialization\\Content";
			
			
			
			if (self.options.moduleType == 'Project')
			{
				
			
				// Add the content tds project
				utils.addProject(self.options.solutionName, self.options.moduleName, projectFolder, 
										   settings.TDSproject, settings.TDSprojectextension, self.options.tdsContentGuid, tdsProjectContentFolder, 
										   self.options.moduleType, settings.TDSContentprefixExtension, destinationPath, sourceRoot,  0);
			    // sleep to avoid file writing conflicts
				sleep(2000);
				
				console.log(chalk.yellow.bold('Successfully added TDS Content project'));
			}
			else
			{
			
			
			//Add the master tds project
			utils.addProject(self.options.solutionName, self.options.moduleName, projectFolder, 
											settings.TDSproject, settings.TDSprojectextension, self.options.tdsMasterGuid, tdsProjectMasterFolder, 
											self.options.moduleType, settings.TDSMasterprefixExtension, destinationPath, sourceRoot, 0);

			// sleep to avoid file writing conflicts
			sleep(2000);
			
			console.log(chalk.yellow.bold('Successfully added TDS Master project'));
			
			

			// Add the core tds project
			utils.addProject(self.options.solutionName, self.options.moduleName, projectFolder, 
										   settings.TDSproject, settings.TDSprojectextension, self.options.tdsCoreGuid, tdsProjectCoreFolder, 
										   self.options.moduleType, settings.TDSCoreprefixExtension, destinationPath, sourceRoot,  0);
			// sleep to avoid file writing conflicts
			sleep(2000);

			console.log(chalk.yellow.bold('Successfully added TDS Core project'));
				
			}
		}
		
		console.log('');
		console.log('Your ' + self.options.moduleType + ' module ' + chalk.green.bold(self.options.solutionName + '.' + self.options.moduleType + '.' + self.options.moduleName) + ' has been created and added to ' + chalk.green.bold(self.options.solutionName));
	}
};