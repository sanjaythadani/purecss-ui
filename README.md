# purecss-ui

<i>purecss-ui</i> is a design system processed via PostCSS.  
Demo: https://sanjaythadani.github.io/purecss-ui/

It is built on <i>Pure.css</i>, a set of small responsive css modules.  
https://purecss.io/

It attempts to use css processed through PostCSS o create a design system with a minimal footprint that is easily customized. It currenly supports the follwing themes:  
-- default  
-- dark  

The project use gulp as its task runner and will work easier if you have gulp-cli installed globally.  
npm install gulp-cli -g  

Runninng the project locally:  
1. Run 'npm install' to install all Node.js dependencies.  
2. Run 'npm run build:dev' to create all the local artifacts.  
3. Run 'npm run serve' to run the local Express server. If the files need to be watched then use 'npm run watch' instead.  

Creating a distribution:  
1. Run 'npm install' to install all Node.js dependencies.  
2. Run 'npm run build:dist' to create the distribution artifacts.  
