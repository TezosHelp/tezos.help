async function generateMap() { // update
	let bakers = initBakers();
	bakers = append(bakers, await mtbBakers());
	bakers = append(bakers, await tzaBakers());
	//bakers = append(bakers, await tzsBakers());
	bakers = append(bakers, await bbBakers());
	bakers = addIcons(bakers);
	const count = "countOfPublicBakers = " + bakers.length + ";\n";
	let bakersOut = "mapOfPublicBakers = [\n";
	for (var i = 0; i < bakers.length; i++) {
		const image = bakers[i].image ? ', image: "' + bakers[i].image + '"' : '';
		bakersOut += "{pkh: \"" + bakers[i].pkh + "\", name: \"" + bakers[i].name + "\"" + image + "}";
		if (i + 1 < bakers.length) {
			bakersOut += ",\n";
		}
	}
	bakersOut += "\n];";
	console.log(bakers);
	$("#container").html(count + bakersOut);
}
function initBakers() {
	console.log(mapOfPublicBakers);
	return mapOfPublicBakers;
}
function addIcons(bakers) {
	for (const i in bakers) {
		const index = iconMap.findIndex(a => a.identity === bakers[i].pkh);
		if (index !== -1 && iconMap[index].image) {
			bakers[i].image = iconMap[index].image;
		}
	}
	return bakers;
}
function append(a, b) {// Yay
	const c = a;
	const initSize = a.length;
	for (const baker of b) {
		if (!a.some(a => a.pkh === baker.pkh)) {
			c.push(baker);
		}
	}
	console.log(a.length + ' ' + initSize);
	console.log('Added ' + (a.length - initSize) + ' bakers');
	return c;
}
async function tzsBakers() {
	const d = await fetch('https://api5.tzscan.io/v1/services').then(function(ans) {
		return ans.json();
	});
	let bakers = [];
	for (const b of d) {
		if (b.address && b.address.slice(0,2) === 'tz') {
			bakers.push({name: b.name, pkh: b.address});
		}
	}
	console.log('tzscan: ' + bakers.length);
	return bakers;
}
async function mtbBakers() {
	const d = await fetch('https://api.mytezosbaker.com/v1/bakers/').then(function(ans) {
		return ans.json();
	});
	let bakers = [];
	for (const b of d.bakers) {
		if (b.baker_name) {
			bakers.push({name: b.baker_name, pkh: b.delegation_code});
		}
	}
	console.log('MTB: ' + bakers.length);
	return bakers;
}
async function bbBakers() {
	const d = await fetch('https://api.baking-bad.org/v1/aliases').then(function(ans) {
		return ans.json();
	});
	let bakers = [];
	for (const b of d) {
		if (b.name) {
			bakers.push({name: b.name, pkh: b.address});
		}
	}
	console.log('Baking Bad: ' + bakers.length);
	return bakers;
}
async function tzaBakers(period = 19) {
	const d1 = await fetch('https://www.tezosagora.org/api/v1/non_voters/' + period).then(function(ans) {
		return ans.json();
	});
	const d2 = await fetch('https://www.tezosagora.org/api/v1/ballots/' + period + '?limit=500' + period).then(function(ans) {
		return ans.json();
	});
	let bakers = [];
	for (const b of d1) {
		if (b.name) {
			bakers.push({name: b.name, pkh: b.pkh});
		}
	}
	for (const b of d2.results) {
		if (b.author.name) {
			bakers.push({name: b.author.name, pkh: b.author.pkh});
		}
	}
	console.log('Agora: ' + bakers.length);
	return bakers;
}
$('document').ready(function(){
	generateMap();
});