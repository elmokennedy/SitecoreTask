param
(
[Parameter(Mandatory=$true)]
[ValidateSet("project", "feature", "foundation", "configuration")]
[string]$Type,
[Parameter(Mandatory=$true)]
[string]$SolutionFile,
[Parameter(Mandatory=$true)]
[string]$Name,
[Parameter(Mandatory=$true)]
[bool]$IsNewProjectSolutionFolder,
[Parameter(Mandatory=$true)]
[string]$ProjectPath,
[Parameter(Mandatory=$true)]
[string]$ShortProjectPath,
[Parameter(Mandatory=$true)]
[string]$SolutionFolderName,
[Parameter(Mandatory=$true)]
[string]$ProjectType,
[Parameter(Mandatory=$true)]
[string]$ProjectFolderGuid,
[Parameter(Mandatory=$true)]
[string]$ProjectGuid
)


. $PSScriptRoot\Add-Line.ps1
. $PSScriptRoot\Get-SolutionConfigurations.ps1
. $PSScriptRoot\Get-SolutionFolderId.ps1
. $PSScriptRoot\Get-ProjectPath.ps1 
. $PSScriptRoot\Get-ProjectConfigurationPlatformSection.ps1
. $PSScriptRoot\Add-BuildConfigurations.ps1

Write-Host "adding project $Name"

$configurations = Get-SolutionConfigurations -SolutionFile $SolutionFile
$solutionFolderId = Get-SolutionFolderId -SolutionFile $SolutionFile -Type $Type
$projectPath = "$ProjectPath" 
$shortprojectPath = "$ShortProjectPath" 

$GuidSection = "GlobalSection(ProjectConfigurationPlatforms) = postSolution"
$ProjectSection = "MinimumVisualStudioVersion = 10.0.40219.1"
$NestedProjectSection = "GlobalSection(NestedProjects) = preSolution"

$addProjectSection = @("Project(`"$ProjectType`") = `"$Name`", `"$shortprojectPath`", `"{$ProjectGuid}`"","EndProject")
$addProjectSolutionFolder = @("Project(`"{2150E333-8FDC-42A3-9474-1A3956D46DE8}`") = `"$SolutionFolderName`", `"$SolutionFolderName`", `"{$ProjectFolderGuid}`"","EndProject")

$addNestProjectSection = @("`t`t{$ProjectGuid} = {$ProjectFolderGuid}")
$addNestProjectSolutionFolderSection = @("`t`t{$ProjectFolderGuid} = $solutionFolderId")

#Add-BuildConfigurations -ProjectPath $projectPath -Configurations $configurations                
Add-Line -FileName $SolutionFile -Pattern $ProjectSection -LinesToAdd $addProjectSection
if ($IsNewProjectSolutionFolder) 
{ 	
	Add-Line -FileName $SolutionFile -Pattern $ProjectSection -LinesToAdd $addProjectSolutionFolder	
}
Add-Line -FileName $SolutionFile -Pattern $NestedProjectSection -LinesToAdd $addNestProjectSection

if ($IsNewProjectSolutionFolder) 
{ 	
	Add-Line -FileName $SolutionFile -Pattern $NestedProjectSection -LinesToAdd $addNestProjectSolutionFolderSection
}

Add-Line -FileName $SolutionFile -Pattern $GuidSection -LinesToAdd (Get-ProjectConfigurationPlatformSection -Id $ProjectGuid -Configurations $configurations)

#Setting LastWriteTime to tell VS 2015 that solution has changed.
Set-ItemProperty -Path $SolutionFile -Name LastWriteTime -Value (get-date)
