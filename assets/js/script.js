$(document).ready(function () {
	navbar();

	$(window).resize(function () {
		$(".nav-item").removeAttr("style")
		$(".category-list").html(' ');
		navbar();
	});

	function navbar() {
		var totalWidth = 0;
		var navbarWidth = $(".navbar").width() - $(".navbar .dropdown").width();

		$(".nav-item").each(function () {

			totalWidth += $(this).width();

			if (totalWidth > navbarWidth) {
				if (!$(this).hasClass("dropdown")) {
					$(this).hide();
					var link = $(this).html();
					$(".category-list").append(link);
				}
				$(".navbar .dropdown").show();
			} else {
				$(".navbar .dropdown").hide();
			}
		});

		$(".dropdown-menu .nav-link").each(function () {
			$(this).removeClass("nav-link").addClass("dropdown-item");
		});
	}

	$(window).scroll(function () {
		if ($(window).scrollTop() > 540) {
			$(".back-to-top").css("opacity", "1");
			$(".navbar").addClass("sticky-top");
		}
		else {

			$(".back-to-top").css("opacity", "0");
			$(".navbar").removeClass("fixed");
		}
	});

	$(".back-to-top").click(function (e) {
		$("html, body").animate({ scrollTop: 0 }, "slow");

		return false;
	});

	$(document).on("click", ".nav-link, .dropdown-item", function (e) {
		$(".nav-link").removeClass("active");
		$(".dropdown-item").removeClass("active");
		$(this).addClass("active");
	});


}), $(window).on("load", function () {
	console.log('load');
	const initCat = $(".nav-link").first();
	var $grid = $('.grid').masonry({
		// options...
		itemSelector: '.item',
		columnWidth: '.item'
	});
	// filter functions
	var filterFns = {};
	// bind filter button click
	$('.navbar').on('click', 'a', function (e) {

		e.preventDefault();

		var filterValue = $(this).attr('data-filter');
		// use filterFn if matches value
		filterValue = filterFns[filterValue] || filterValue;
		if (filterValue) {
			if (filterValue !== '.featured') {
				history.replaceState(undefined, undefined, "#" + filterValue.slice(1));
			} else {
				history.replaceState(undefined, undefined, " ");
			}
			$grid.isotope({ filter: filterValue });
		}
	});
	// catch hash links
	$(".content .grid").show();
	const hash = $(location).attr('hash');
	if (hash && $(".nav-item " + hash).length) {
		$(hash).trigger('click');
	} else {
		$('#featured').trigger('click');
	}
});