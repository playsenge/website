process.title = 'Pretendo - Website';

const express = require('express');
const handlebars = require('express-handlebars');
const morgan = require('morgan');
const expressLocale = require('express-locale');
const cookieParser = require('cookie-parser')
const logger = require('./logger');
const util = require('./util');
const config = require('../config.json');

const { http: { port } } = config;
const app = express();

logger.info('Setting up Middleware');
app.use(morgan('dev'));

logger.info('Setting up static public folder');
app.use(express.static('public'));

logger.info('Importing page routers');
const routers = {
	home: require('./routers/home'),
	faq: require('./routers/faq'),
	progress: require('./routers/progress')
};

app.use(cookieParser())

// Locale express middleware setup
app.use(expressLocale({
	"priority": ['cookie', 'accept-language', 'map', 'default'],
	cookie: {name: 'preferredLocale'},
	// fallbacks for browsers that don't send a region code, but only a language
	map: {
		ar: 'ar-AR',
		es: 'es-ES',
		it: 'it-IT',
		ru: 'ru-RU',
		tr: 'tr-TR'
	},
	allowed: [
		'en-US', // English doesn't need as many allowed locales since it's the default anyways
		'ar', 'ar-AR',
		'es', 'es-ES',
		'it', 'it-IT',
		'ru', 'ru-RU',
		'tr', 'tr-TR',
	],
	"default": "en-US"
}))




app.use('/', routers.home);
app.use('/faq', routers.faq);
app.use('/progress', routers.progress);

logger.info('Creating 404 status handler');
// This works because it is the last router created
// Meaning the request could not find a valid router
app.use((request, response) => {
	const fullUrl = util.fullUrl(request);
	logger.warn(`HTTP 404 at ${fullUrl}`);

	response.sendStatus(404); // TODO: 404 page
});

logger.info('Setting up handlebars engine');
app.engine('handlebars', handlebars({
	helpers: {
		doFaq(value, options) {
			let htmlLeft = '';
			let htmlRight = '';
			for(const [i, v] of Object.entries(value)) {
				const appendHtml = options.fn({
					...v
				}); // Tis is an HTML string
				if(i % 2 === 0) {
					htmlLeft += appendHtml;
				} else {
					htmlRight += appendHtml;
				}
			}
			return `
			<div class="left questions-left">
				${htmlLeft}
			</div>
			<div class="right questions-right">
				${htmlRight}
			</div>
			`;
		}
	}
}));
app.set('view engine', 'handlebars');

logger.info('Starting server')
app.listen(port, () => {
	logger.success(`Server listening on *:${port}`);
});