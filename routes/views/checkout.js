var keystone = require('keystone');
var stripeSecretKey = keystone.get('stripe secret key');
var Stripe = require('stripe')(stripeSecretKey);

exports = module.exports = function(request, response) {
	var stripeToken = request.body.id;

	console.log("Received token")
	console.log(request.body)

	var items = request.body.shoppingCart
	
	// console.log(items)
	
	var itemSlugs = []

	for (var i = 0; i < items.length; i++) {
		var slug = items[i].slug
		itemSlugs.push(slug)
	}

	keystone.list('Product').model.find().where('slug').in(itemSlugs).exec(function(err, products) {
		if (err) {
			console.log("Serious error guys")
			console.log(err)
		} else {
			console.log("Response")
			console.log(products)

			var slugToProductsMap = {}

			for (var i = 0; i < products.length; i++) {
				var product = products[i]

				slugToProductsMap[product.slug] = product
			}

			var amount = 0

			for (var i = 0; i < items.length; i++) {
				var item = items[i]
				var quantity = item.quantity

				// Compare it to our database
				var product = slugToProductsMap[item.slug]

				var totalAmount = (product.price * quantity) * 100

				amount += totalAmount
			}

			var tax = 0.05
			var total = amount + (amount * tax)

			var charge = Stripe.charges.create({
				amount: total, // amount in cents, again
				currency: 'cad',
				source: stripeToken,
				description: 'Colovo Shop',
			}, function(err, charge) {
				if (err && err.type === 'StripeCardError') {
					response.json({ accepted: false, message: 'Payment Declined'})
					// The card has been declined
				} else {
					if (err) {
						console.log("We have an error!")
						console.log(err)

						response.json({ accepted: false, message: 'Payment Declined'})
					} else {
						// The card has been accepted
						console.log("Charged")
						console.log(charge)
					}
				}
			})
		}
	});
}