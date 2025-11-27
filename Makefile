api:
	APP_TYPE=api npm run start:watch
core-build:
	npm run build:watch
socket:
	APP_TYPE=socket npm run start:watch
worker:
	APP_TYPE=worker npm run start:watch