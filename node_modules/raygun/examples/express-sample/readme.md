# Raygun + ExpressJS sample

A demo on how to use Raygun4Node and ExpressJS together.

## To run

Set your API key in *config/default.json* and run

	npm install && npm start

## Files to look at 

- app.js
	- Sets the user (line 22)
	- Attaches Raygun to Express (line 47)
- routes/index.js
	- Calls a fake object, which bounces up to the Express handler (line 11)
