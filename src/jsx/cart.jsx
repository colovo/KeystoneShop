import {Component, default as React} from 'react'
import ReactDOM from 'react-dom'
import numeral from 'numeral'
import countryData from './countries.js'
import request from 'superagent'

var {countries} = countryData

const currencyFormat = '$0,0.00'
const tax = 0.05

window.shoppingCart = null
window.shoppingCartKey = 'shoppingCartData'

window.addToCart = function(product) {
	if (!window.shoppingCart) {
		alert("Can't add items until cart is loaded")
	}

	for (var i = 0; i < window.shoppingCart.length; i++) {
		var item = window.shoppingCart[i]

		if (item.slug === product.slug) {
			item.quantity++
			window.saveCart()
			return item.quantity
		}
	}

	window.shoppingCart.push({
		quantity: 1,
		slug: product.slug,
		price: product.price,
		image: product.image.url,
		title: product.title
	})

	window.saveCart()
	return 1
}

window.loadCart = function() {
	if (!window.shoppingCart) {
		var shoppingCartString = localStorage.getItem(shoppingCartKey)

		if (shoppingCartString) {
			window.shoppingCart = JSON.parse(shoppingCartString)
		} else {
			window.shoppingCart = []
		}
	}

	return window.shoppingCart
}

window.getQuantityForProductSlug = function(slug) {
	var items = window.loadCart()

	for (var i = 0; i < items.length; i++) {
		var item = items[i]

		if (item.slug === slug) {
			return item.quantity
		}
	}

	return 0
}

window.saveCart = function() {
	if (!window.shoppingCart) {
		alert("Shopping cart hasn't been loaded yet")
	}

	var shoppingCartString = JSON.stringify(window.shoppingCart)
	localStorage.setItem(shoppingCartKey, shoppingCartString)

	window.updateButton()
}
window.updateButton = function() {
	var totalQuantity = 0
	var items = loadCart()
	for (var i = 0; i < items.length; i++){
		var item = items[i]
		totalQuantity += item.quantity
	}


	var shoppingCartButton = document.getElementsByClassName('shopping-cart-count')[0]
	shoppingCartButton.innerText = totalQuantity
}

class Cart extends Component {
	constructor(props) {
		super(props)

		var items = window.loadCart()
		var subTotal = 0

		for (var i = 0; i < items.length; i++){
			var item = items[i]
			subTotal += item.price * item.quantity
		}
		var taxAmount = subTotal * tax
		var total = subTotal + taxAmount

		var defaultSelectedCountryName = localStorage.getItem('selectedCountry') || props.defaultCountry
		var defaultSelectedCity = localStorage.getItem('selectedCity') || ''

		this.state = {
			items: items,
			subTotal: subTotal,
			taxAmount: taxAmount,
			total: total,
			country: defaultSelectedCountryName,
			city: defaultSelectedCity
		}
	}

	componentDidMount() {
		if (navigator.geolocation) {
	        navigator.geolocation.getCurrentPosition(this.retrievedPosition.bind(this));
	    }
	}

	retrievedPosition(position) {
		var {latitude, longitude} = position.coords

		var geocodeURL = 'http://maps.googleapis.com/maps/api/geocode/json?latlng=' + latitude + ',' + longitude

		request.get(geocodeURL).end((err, response) => {
			if (response && response.body) {
				var {results} = response.body
				// console.log("Success!")
				// console.log(results)

				var topResult = results[0] || null

				if (!topResult) {
					console.log("No results")
					return
				}

				var addressComponents = topResult.address_components

				for (var i = 0; i < addressComponents.length; i++){
					var result = addressComponents[i]
					
					if (result.types.indexOf("country") >= 0) {
						this.setState({
							country: result.long_name
						})
					}

					if (result.types.indexOf("locality") >= 0) {
						this.setState({
							city: result.long_name
						})
					}
				}
			}
		})
	}

	removeItem(event){
		var index = parseInt(event.target.getAttribute('data-index'))

		var currentItems = this.state.items
		currentItems.splice(index, 1)
		this.updateItems(currentItems)
	}

	updateItemQuantity(event) {
		var index = parseInt(event.target.getAttribute('data-index'))

		var newQuantity = parseInt(event.target.value)

		if (!newQuantity) {
			newQuantity = 1
		}

		var currentItems = this.state.items
		currentItems[index].quantity = newQuantity
		this.updateItems(currentItems)
	}

	updateItems(newItems) {
		var subTotal = 0

		for (var i = 0; i < newItems.length; i++){
			var item = newItems[i]
			subTotal += item.price * item.quantity
		}
		var taxAmount = subTotal * tax
		var total = subTotal + taxAmount

		this.setState({
			items: newItems,
			subTotal: subTotal,
			taxAmount: taxAmount,
			total: total
		})
		this.saveCurrentItems()
	}

	saveCurrentItems() {
		window.shoppingCart = this.state.items
		window.saveCart()
	}

	checkout() {
		const StripeHandler = StripeCheckout.configure({
			key: this.props.stripePublishableKey,
			locale: 'auto',
			allowRememberMe: true,
			token: (token) => {
				token.shoppingCart = this.state.items

				console.log(token)

				$.post('/checkout', token, function(response) {
					console.log(response)
				})
			}
		});

		StripeHandler.open({
			name: 'Colovo Inc.',
			description: this.state.items.length + ' Items',
			currency: "cad",
			amount: (this.state.total * 100)
		})
	}

	countryChanged(event) {
		var newCountry = event.target.value
		this.setState({
			country: newCountry
		})
		localStorage.setItem('selectedCountry', newCountry)
	}

	inputChanged(event) {
		console.log("Changed")

		var inputKey = event.target.getAttribute('data-key')
		var inputValue = event.target.value

		console.log(inputKey)
		console.log(inputValue)

		var newState = {}

		newState[inputKey] = inputValue

		this.setState(newState)

		if (inputKey === 'city') {
			localStorage.setItem('selectedCity', inputValue)
		}
	}

	renderCartItem(item, index) {
		var itemKey = "cart-item-" + index

		return <div className="row shopping-cart-item" key={ itemKey }>
			<div className="shopping-cart-item-image">
				<img src={ item.image }/>
			</div>
			<div className="shopping-cart-item-description">
				<div className="shopping-cart-title">{ item.title }</div>
				<div className="shopping-cart-price">{ numeral(item.price).format(currencyFormat) } x </div>
				<div className='quantity-box'><input type="number" className="form-control" min={ 1 } value={ item.quantity } data-index={ index } onChange={ this.updateItemQuantity.bind(this) }/></div>
				<div className='clear-button' onClick={this.removeItem.bind(this)} data-index={ index }></div>
			</div>
		</div>
	}

	renderCountryOption(country, index) {
		var key = 'country-' + index

		var optionProps = {
			value: country.country,
			key: key
		}

		return <option {...optionProps}>{ country.country }</option>
	}

	render() {
		var postalCodePlaceholder = "Postal Code"
		if (this.state.country == "United States") {
			postalCodePlaceholder = "Zip Code"
		}

		return <div className="shopping-cart-container">
			<div className="shopping-cart-items">
				{ this.state.items.map(this.renderCartItem.bind(this)) }
			</div>
			<div className="checkout">
				<div className="checkout-line">
					<div className="checkout-title">Subtotal</div>
					<div className="checkout-value">{numeral(this.state.subTotal).format(currencyFormat)}</div>
				</div>
				<div className="checkout-line">
					<div className="checkout-title">Tax</div>
					<div className="checkout-value">{numeral(this.state.taxAmount).format(currencyFormat)}</div>
				</div>
				<div className="checkout-line total">
					<div className="checkout-title">Total</div>
					<div className="checkout-value">{numeral(this.state.total).format(currencyFormat)}</div>
				</div>
				<div className="checkout-form"> 
					<label>Shipping Information</label>
					<div className="form-group"> 
						<input className="form-control" data-key="name" value={ this.state.name } placeholder="Name" onChange={ this.inputChanged.bind(this) }/>
					</div>
					<div className="form-group"> 
						<input className="form-control" data-key="address" value={ this.state.address } placeholder="Address" onChange={ this.inputChanged.bind(this) }/>
					</div>
					<div className="form-group form-inline"> 
						<input className="form-control" data-key="postalCode" value={ this.state.postalCode } placeholder={ postalCodePlaceholder } onChange={ this.inputChanged.bind(this) }/>
						<input className="form-control" data-key="city" value={ this.state.city } placeholder="City" onChange={ this.inputChanged.bind(this) }/>
					</div>
					<select className="form-control" data-key="country" value={ this.state.country } onChange={ this.countryChanged.bind(this) }>
						{ countries.map(this.renderCountryOption.bind(this)) }
					</select>
				 </div>
					<div className="btn btn-primary btn-cart" onClick={ this.checkout.bind(this) }>Purchase</div>
			</div>
		</div>
	}
}

// class CheckoutButton extends Component {

// }
// ReactDOM.render(<CheckoutButton />, document.getElementById('checkout-button'))

window.renderShoppingCart = function(element, options) {
	var {stripePublishableKey, defaultCountry} = options

	ReactDOM.render(<Cart stripePublishableKey={stripePublishableKey} defaultCountry={ defaultCountry }/>, element)
}

window.updateButton()