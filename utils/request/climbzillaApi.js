const got = require('got');
const Promise = require('bluebird');
const _ = require('underscore');
const moment = require('moment');
const configHolder = require('../../config/holder');

const makeDate = (item) => {
	return moment(item, 'YYYY-MM-DD HH:mm:ss').valueOf();
};

const makeHall = (item) => {
	return {
		id: item.id,
		name: item.name,
		city: {name: item.city},
		routesCount: Number(item.tops_count)
	};
};

const makeHalls = (items) => {
	return items.map(makeHall);
};

const makeUser = (item) => {
	return {
		id: item.id,
		createDate: makeDate(item.create_time),
		fullName: item.full_name,
		avatarUrl: item.photo_200
	};
};

const makeFinish = (item) => {
	return {
		createDate: makeDate(item.create_time),
		user: makeUser(item.user)
	};
};

const makePhoto = (item, {baseUrl}) => {
	return {
		id: item.id,
		url: baseUrl + item.url,
		description: item.description
	};
};

const gradeTitleHash = {
	10: '5a',
	11: '5a+',
	12: '5b',
	13: '5b+',
	14: '5c',
	15: '5c+',
	16: '6a',
	17: '6a+',
	18: '6b',
	19: '6b+',
	20: '6c',
	21: '6c+',
	22: '7a',
	23: '7a+',
	24: '7b',
	25: '7b+',
	26: '7c',
	27: '7c+',
	28: '8a',
	29: '8a+',
	30: '8b',
	31: '8b+',
	32: '8c',
	33: '8c+',
	34: '9а'
};

const makeGrade = (numericGrade) => {
	return {numeric: numericGrade, title: gradeTitleHash[numericGrade]};
};

const makeRoute = (item, {baseUrl}) => {
	return {
		id: item.id,
		createDate: makeDate(item.create_time),
		hall: makeHall(item.hall || {id: item.hall_id}),
		grade: makeGrade(item.grade),
		title: item.title,
		author: item.author && makeUser(item.author),
		photos: item.photos.map((photo) => {
			return makePhoto(photo, {baseUrl});
		}),
		finishes: (item.finishes || []).map(makeFinish)
	};
};

const makeRoutes = (items, options) => {
	return items.map(makeRoute, options);
};

const baseRequest = (path, options = {}) => {
	const gotOptions = _(options).omit('transform');
	const transform = options.transform || _.identity;

	return Promise.resolve()
		.then(() => {
			return configHolder.get();
		})
		.then((config) => {
			const {host, port} = config.services.climbzillaApi;
			const baseUrl = `${host}:${port}`;

			const res = got(
				baseUrl + path,
				_(gotOptions).defaults({json: true})
			);

			return Promise.all([
				config.services.climbzillaApi.baseUrl,
				res
			]);
		})
		.then(([baseUrl, res]) => {
			return transform(res.body, {baseUrl});
		});
};

exports.getHalls = () => {
	return baseRequest('/v03/hall', {transform: makeHalls});
};

exports.getHall = (hallId) => {
	return baseRequest(`/v03/hall/${hallId}`, {
		transform: makeHall
	});
};

exports.getRoutes = ({hallId}) => {
	return baseRequest('/v02/top', {
		query: {hall_id: hallId},
		transform: makeRoutes
	});
};

exports.getRoute = (routeId) => {
	return baseRequest(`/v02/top/${routeId}`, {
		query: {expand: 'hall'},
		transform: makeRoute
	});
};
