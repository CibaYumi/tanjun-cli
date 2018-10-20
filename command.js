/**
 _____         _            _____                                 _
|_   _|__ ___ |_|_ _ ___   |   __|___ ___ _____ ___ _ _ _ ___ ___| |_
  | || .'|   || | | |   |  |   __|  _| .'|     | -_| | | | . |  _| '_|
  |_||__,|_|_|| |___|_|_|  |__|  |_| |__,|_|_|_|___|_____|___|_| |_,_|
            |___|

 * CLI Project
 * Copyright © 2018 Engajei. All rights reserved.
*/

const fs       = require('fs');
const git      = require("download-git-repo");
const fsX      = require('fs-extra');
const inquirer = require('inquirer');
const header   = require('./header');

const { exec } = require('child_process');

const expose   = console.log;

class Project{
	constructor(obj){
		this.path =  __dirname + '/' + obj.project_name.toLowerCase();
		this.arch = obj.arch;
		this.db   = obj.db;
		this.settings =  {
			arch : {
				SQL : {
					adapters : ['MYSQL', 'MSSQL', 'SQLITE'],
					libs : ['mysql2', 'tedious', 'sqlite3'],
					path : __dirname + '/_temp/sql'
				},
				NoSQL : {
					adapters : ['MONGODB'],
					libs : ['mongoose'],
					path : __dirname + '/_temp/nosql'
				}
			},
			test_suite : {
				CHAI : {
					adapters : ['chai'],
					libs : ['chai', 'chai-http', 'mocha']
				}
			}
		};
	}
	static async downloadLatest(){
		git("github:Engajei/tanjun", __dirname + "/_temp", function (err) {
			console.log(err)
		});
	}
	createPackageFile(){

		// Base package.json file
		let file = {
			"name": "tanjun",
			"version": "0.1.0",
			"description": "a minimalist framework for API rest with SQL support and no-SQL databases",
			"main": "main.js",
			"scripts": {},
			"author": "https://github.com/cleiton-tavares",
			"license": "MIT",
			"dependencies": {
				"body-parser": "^1.18.3",
				"compression": "^1.7.3",
				"consign": "^0.1.6",
				"cors": "^2.8.4",
				"dotenv": "^6.1.0",
				"express": "^4.16.4",
				"helmet": "^3.14.0",
				"method-override": "^3.0.0"
			}
		};

		//"test": "echo \"Error: no test specified\" && exit 1"

		if(this.arch === 'SQL'){
			file.dependencies.sequelize = '^4.39.1';
			switch(this.db) {
				case 'MYSQL' :
					file.dependencies[this.settings.arch.SQL.libs[0]] = '^1.6.1';
					break;
				case 'MSSQL' :
					file.dependencies[this.settings.arch.SQL.libs[1]] = '^2.6.4';
					break;
				case 'SQLITE' :
					file.dependencies[this.settings.arch.SQL.libs[2]] = '^4.0.2';
					break;
			}
		}else{
			file.dependencies.mongoose = '^5.2.15';
		}

		return file;
	}
	prepareFramework(){
		// Create if not exist folder
		if (!fs.existsSync(this.path)) fs.mkdirSync(this.path);

		if(this.arch === 'SQL'){
			// COPIE FILES
			exec('cp -a _temp/sql/. ' + this.path, (err, stdout, stderr) => {
				if (err) {
					console.error(err);
					return;
				}
				console.log(stdout);
			});
		}

		exec('cp -a _temp/commons/. ' + this.path, (err, stdout, stderr) => {
			if (err) {
				expose(err);
				return;
			}
			expose(stdout);
		});
	}
	build(packageFile){

		// Create package.json file
		fs.writeFile(this.path + '/package.json', JSON.stringify(packageFile ,null, 2) ,(err) => {
			if(err) { return console.log(err); }
			expose("The file was saved!");
		});

	}
}

expose(header);
expose('Welcome to the Tanjun Framework, to start a project it is necessary define some things\n');
	inquirer
		.prompt([
			{
				type: 'input',
				name: 'project_name',
				default : 'Is a path',
				message: 'What is the name of your project',
			},{
				type: 'list',
				name: 'arch',
				message: 'What architecture',
				choices: [
					'SQL',
					'NoSQL',
					new inquirer.Separator(),
					'or start without database'
				]
			},{
				type: 'list',
				name: 'test',
				message: 'Choose the Test Framework you want to use',
				choices: [
					'Chai + Mocha',
					new inquirer.Separator(),
					'or start without test suite (XGH)'
				]
			}
		]).then(answers => {
			if(answers.arch === 'SQL'){
				return inquirer
					.prompt([
						{
							type: 'list',
							name: 'lib',
							message: 'What SQL database',
							choices: [
								'MSSQL',
								'MYSQL',
								new inquirer.Separator(),
								'or SQL LITE'
							]
						}
					]).then((ans) => {
						if(ans.lib === 'or SQL LITE') ans.lib = 'SQLITE';
						answers.db = ans.lib;
						const project = new Project(answers);
						const packageFile = project.createPackageFile();
									project.prepareFramework();
									project.build(packageFile);
						expose(project);
				});
			}
			const project = new Project(answers);
			expose(project);
		});