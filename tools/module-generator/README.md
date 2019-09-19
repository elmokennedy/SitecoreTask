# Yeoman solution generator for Sitecore XP

## Overview
Sitecore solution scaffolding is a yeoman-based script that is designed to simplify initial solution setup and save you time on configuration on early stages of the project. Also, it defines project setup standards withing EPAM (which are strongly recommended to follow)

#### Main Features
- Generated folder structure is ready for initial commit to GIT.
- The auto-generated solution includes back-end and front-end workspaces.
- Automated installation of Sitecore Sandbox via scripts that could be shared withing a team.

#### Sitecore Versions Support
|Version|Update|Status|
|---|---|---|
|8.2|Upd-3|in progress|

#### Downloads
There are no downloads currently available. Please clone this git repository to use this scaffold.

#### Pre-requisites
* Connection to **EPAM** network (as script will try to get resources from internal NuGet server)
* Administrator rights to the system.
* PowershellAccessControl: https://gallery.technet.microsoft.com/scriptcenter/PowerShellAccessControl-d3be7b83, ensure that the bin folder is present
* Powershell 5 or above. (You could PS version by typing __$PSVersionTable__ or __Get-Host__ on a Powershell command line. [Downloadable](https://www.microsoft.com/en-us/download/details.aspx?id=34595) & [Instruction for update](https://blogs.technet.microsoft.com/heyscriptingguy/2013/06/02/weekend-scripter-install-powershell-3-0-on-windows-7/).)
    * Powershell must be started "As Administrator", as scripts accessing system areas (like _hosts_ file or windows features) and require elevated permissions.
    * Execution policy for PowerShell scripts must be set to **Unrestricted**
        ```powershell
        Set-ExecutionPolicy Unrestricted # globally
        # or
        ./setup.ps1 Set-ExecutionPolicy Unrestricted # for current script
        ```
#### Optional
Following list of items would be required to work with scaffolding results.

* Visual Studio 2015
* NuGet Package Manager (in Visual Studio) v2.8.6x and above (Was not tested on earlier versions)
* Git for Windows. Make sure git command has been added to your PATH. Bower FE package manager requires Git.
* TDS 5+
* IIS 7+ - script would try to enable this feature during installation of a sandbox
* ASP .NET 4.5 and .NET Framework 4.6.1 (https://www.microsoft.com/en-us/download/confirmation.aspx?id=49981)
  If you don't, you'll have to later downgrade the .NET version number of the projects.

## Setup
2. Download and install nodejs (https://nodejs.org/en/download/)
3. Install yeoman: Run "npm install -g yo" (http://yeoman.io/learning/index.html)
1. Download scaffolding package
4. Link the generator: Run "npm link" (in the directory of the scaffold)

## Installation
### Part 1 - Creation of solution structure
1. Run "yo" or more specicially "yo sitecore-scaffold-helix"
2. Answer each question in the prompts to configure your solution options

### Part 2 - Creation of modules
By default, the solution created in the step above is empty. In order to add a module (Foundation|Feature|Project) follow the steps below.
1. Run "yo sitecore-scaffold-helix:add"
2. Answer each question in the prompts to configure your module options

* **Note <sup>1</sup>** - The sitecore helix scaffold generator support multiple arguments. Please see the "Help" below for more details.
* **Note <sup>2</sup>** - If you need to do manual changes to local environment configuration change files *config.json* for cloud installtion or *config.local.json* for local inf folder _/env/template/config.local.json_ (For details see commetns in files)
* **Note <sup>3</sup>** - If you want use named SQL server instance you have manualy install and configure it first ([see documentation](https://kb.epam.com/display/EPMACCL/Rquirements+for+named+SQL+Server)). Script could will configure not-named instance "MSSQLSERVER"
* **Note <sup>4</sup>:** In case of manual Sitecore should be installed in to [*/project-folder/sandbox](#) folder*
* **Note <sup>5</sup>:** You can only specify values containing letters and \ or dots for the customer name and project names. All the other symbols are not allowed.
* **Note <sup>6</sup>:** In multisite configuration, name of each project has to be unique.
* **Note <sup>7</sup>:** Name of any project must not be equal to the customer name.

### Part 3 - Solution Compilation, Sync and Publishing
1. Open Visual Studio as Administrator (right click and choose Run As Administrator) - this is necessary for publishing file system permissions.
2. Open the solution file that was generated for you.  This is in [*/project-folder/src/server](#)
3. Rebuild the solution. ***Note:** Compilation of the project includes back-end and front-end, for the first time it might take long as all npm, bower and NuGet packages are downloaded.*
4. Deploy using following options
    * TDS to Deploy:
        * In Visual Studio Choose "Deploy Solution" and let TDS sync items and deploy files to your Sitecore instance
    * Manual:
        * Publish *Common.Web* and *Site.Web* projects to your Sitecore instance using the Visual Studio Publish command and "LocalDev" profile
        * Sync all TDS projects
5. Login into Sitecore and do a full publish for a site.
6. In your browser go to [http://project.customer.local](#), if you see EPAM logo and message “You have successfully installed the EPAM Sc Scaffold” this mean that your installation was completed **successfully**

## Help
Type "yo sitecore-scaffold-helix --help" to see a list of options and arguments that can be passed to the generator.

## Uninstall
Teardown script are planned for future releases of this accelerator, but for now, you have following option:
* Manual Delete
    1. Delete Sitecore databases
    2. Remove entry in hosts file (located in %WINDIR%\System32\drivers\etc)
    3. Remove IIS Site and IIS AppPool using IIS Manager
    4. Delete destination solution folder
* Use SIM to delete the Sitecore instance if it shows up in SIM

## Packing & Publishing
To pack anf publish scaffolding script you need to run PS script [$/src/pack.ps1](#) with followin parameters.
```PS
.\pack-scaffolding-scripts.ps1 compile # to create version of scaffold scripts in ./build folder
# or
.\pack-scaffolding-scripts.ps1 compile # to create archived version of scaffold scripts in ./build folder
# or
.\pack-scaffolding-scripts.ps1 compile # to push archived version to internal file share
```

## Licensing

	1. Used parts of the 7-Zip program
	2. 7-Zip is licensed under the GNU LGPL license
	3. 7-Zip sources are presented on http://www.7-zip.org/

## FEEDBACK
If you had some issues during installation, you have ideas or feedback, please, post them to [GitLab issues section of this project](https://gitpct.epam.com/epm-accl/sitecore-engx-scaffolding/issues)
 
