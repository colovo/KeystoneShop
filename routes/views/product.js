var keystone = require('keystone');
var async = require('async');
var numeral = require('numeral');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res);
	var locals = res.locals;
	
	// Set locals
	locals.section = 'products';
	locals.filters = {
		product: req.params.product
	};
	locals.data = {
		products: [],
		categories: []
	};
	locals.numeral = numeral;
	
	// Load all categories
	view.on('init', function(next) {
		
		keystone.list('ProductCategory').model.find().where('primary', true).sort('name').populate('categories').exec(function(err, results) {
			
			if (err || !results.length) {
				return next(err);
			}

			locals.data.categories = results;
			
			// Load the counts for each category
			async.each(locals.data.categories, function(category, next) {
				keystone.list('Product').model.count().where('categories').in([category.id]).exec(function(err, count) {
					category.productCount = count;
					next(err);
				});
				
			}, function(err) {
				next(err);
			});
			
		});
		
	});

	// Load the current product
	view.on('init', function(next) {
		
		var q = keystone.list('Product').model.findOne({
			slug: locals.filters.product
		})
		
		q.exec(function(err, result) {
			locals.data.product = result;
			locals.data.category = result.categories[0] || null;
			next(err);
		});
		
	});
	
	// Load other posts
	// view.on('init', function(next) {
		
	// 	var q = keystone.list('Product').model.find().where('state', 'published').sort('-publishedDate').populate('author').limit('4');
		
	// 	q.exec(function(err, results) {
	// 		locals.data.products = results;
	// 		next(err);
	// 	});
		
	// });
	
	// Render the view
	view.render('product');
	
};
