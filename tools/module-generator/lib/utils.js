var uuid = require('node-uuid');
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var shell = require('node-powershell');
var chalk = require('chalk');

module.exports = { 
	escapeRegExp: function(input) {
		if (typeof input === 'undefined') {
			return '';
		}
		return input.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
	},
	guid: function (input) {
        if (!input || input.length < 1) { // no parameter supplied
            return uuid.v4(); // return guid v4() uuid
        } else { // create a consistent (non-random!) UUID
            var hash = crypto.createHash('sha256').update(input.toString()).digest('hex').substring(0, 36);
            var chars = hash.split('');
            chars[8] = '-';
            chars[13] = '-';
            chars[14] = '4';
            chars[18] = '-';
            chars[19] = '8';
            chars[23] = '-';
            hash = chars.join('');
            return hash;
        }
    },
	addProject: function(solutionName, typeName, projectFolder, projectType, projectextension, projectGuid, fsfolder, Type, prefixExtension, desinationPath, sourceRoot, isNewProjectSolutionFolder) {
		const srcPath = desinationPath + '\\src';
		const files = fs.readdirSync(srcPath);
		const SolutionFile = files.find(file => file.indexOf('.sln') > -1);
		const solutionFilePath = srcPath + '\\' + SolutionFile;
	   

		  const LayeredPrefixName =   `${solutionName}.${Type}.${typeName}${prefixExtension}`;
		  const ProjectPath = 'src' + '\\'  + Type + '\\'  +  typeName + '\\'  + fsfolder + '\\'  + LayeredPrefixName + projectextension;
		  const shortProjectPath = Type + '\\'  +  typeName + '\\'  + fsfolder + '\\'  + LayeredPrefixName + projectextension;

		  const scriptParameters = '-SolutionFile \'' + solutionFilePath + 
								 '\' -Name ' + LayeredPrefixName       +  
								 ' -Type ' + Type +    
								 ' -IsNewProjectSolutionFolder ' + isNewProjectSolutionFolder +                              
								 ' -ProjectPath \'' + ProjectPath + '\''+ 
								 ' -ShortProjectPath \'' + shortProjectPath +  '\''  + 
								 ' -ProjectType \'' + projectType +  '\''  + 
								 ' -ProjectFolderGuid \'' + projectFolder.toUpperCase() +  '\''  + 
								 ' -SolutionFolderName ' + typeName + 
								 ' -ProjectGuid \'' + projectGuid.toUpperCase() +  '\'';



		const pathToAddProjectScript = path.join(sourceRoot, '../../../powershell/add-project.ps1');
		  
		
		var ps = new shell({
			executionPolicy: 'Unrestricted'
		});
		
		 ps.addCommand(pathToAddProjectScript + ' ' + scriptParameters);
		 ps.addCommand('Pop-Location');
	   
		return ps.invoke()
			.then(output => {
				console.log(chalk.green.bold('SUCCESS: installation finished'));
				console.log(output);
				ps.dispose();
			})
			.catch(err => {
				console.log(chalk.red.bold('FAILED: installation finished with an error'));
				console.log(chalk.red.bold(err));
				ps.dispose();
			});
	  
	}
}