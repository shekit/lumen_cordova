var SearchView = function(){

	this.initialize = function(){

		this.$el = $('<div/>'); //create a div element
		this.render();
	};

	this.render = function() {
		this.$el.html(this.template());
		return this;
	}

	this.initialize();
}