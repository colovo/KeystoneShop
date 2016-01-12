var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Product Model
 * ==========
 */

var Product = new keystone.List('Product', {
	map: { name: 'title' },
	autokey: { path: 'slug', from: 'title', unique: true }
});

Product.add({
	title: { type: String, required: true },
	image: { type: Types.CloudinaryImage },
	price: { type: Types.Money, format: '$0,0.00' },
	taxable: { type: Boolean, default: true },
	description: { type: Types.Html, wysiwyg: true, height: 250 },
	categories: { type: Types.Relationship, ref: 'ProductCategory', many: true },
	
});

Product.schema.virtual('content.full').get(function() {
	return this.content.extended || this.content.brief;
});

Product.defaultColumns = 'title, description|%20, price|%20';
Product.register();
