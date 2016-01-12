var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * ProductCategory Model
 * ==================
 */

var ProductCategory = new keystone.List('ProductCategory', {
	autokey: { from: 'name', path: 'key', unique: true }
});

ProductCategory.add({
	name: { type: String, required: true },
	categories: { type: Types.Relationship, ref: 'ProductCategory', many: true },
	primary: { type: Boolean, default: false }
});

ProductCategory.relationship({ ref: 'Product', refPath: 'categories' });
// ProductCategory.relationship({ ref: 'ProductCategory', path: 'parentCategory' });

ProductCategory.register();
